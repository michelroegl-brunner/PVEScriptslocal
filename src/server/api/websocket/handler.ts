import { WebSocketServer, WebSocket } from 'ws';
import { IncomingMessage } from 'http';
import { scriptManager } from '~/server/lib/scripts';
import { env } from '~/env.js';

interface ScriptExecutionMessage {
  type: 'start' | 'output' | 'error' | 'end';
  data: string;
  timestamp: number;
}

export class ScriptExecutionHandler {
  private wss: WebSocketServer;
  private activeExecutions: Map<string, { process: any; ws: WebSocket }> = new Map();

  constructor(server: any) {
    this.wss = new WebSocketServer({ 
      server,
      path: '/ws/script-execution'
    });

    this.wss.on('connection', this.handleConnection.bind(this));
  }

  private handleConnection(ws: WebSocket, request: IncomingMessage) {
    console.log('New WebSocket connection for script execution');
    
    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString());
        this.handleMessage(ws, message);
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
        this.sendMessage(ws, {
          type: 'error',
          data: 'Invalid message format',
          timestamp: Date.now()
        });
      }
    });

    ws.on('close', () => {
      console.log('WebSocket connection closed');
      // Clean up any active executions for this connection
      this.cleanupActiveExecutions(ws);
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
      this.cleanupActiveExecutions(ws);
    });
  }

  private async handleMessage(ws: WebSocket, message: any) {
    const { action, scriptPath, executionId } = message;

    switch (action) {
      case 'start':
        if (scriptPath && executionId) {
          await this.startScriptExecution(ws, scriptPath, executionId);
        } else {
          this.sendMessage(ws, {
            type: 'error',
            data: 'Missing scriptPath or executionId',
            timestamp: Date.now()
          });
        }
        break;

      case 'stop':
        if (executionId) {
          this.stopScriptExecution(executionId);
        }
        break;

      default:
        this.sendMessage(ws, {
          type: 'error',
          data: 'Unknown action',
          timestamp: Date.now()
        });
    }
  }

  private async startScriptExecution(ws: WebSocket, scriptPath: string, executionId: string) {
    try {
      // Validate script path
      const validation = scriptManager.validateScriptPath(scriptPath);
      if (!validation.valid) {
        this.sendMessage(ws, {
          type: 'error',
          data: validation.message || 'Invalid script path',
          timestamp: Date.now()
        });
        return;
      }

      // Check if execution is already running
      if (this.activeExecutions.has(executionId)) {
        this.sendMessage(ws, {
          type: 'error',
          data: 'Script execution already running',
          timestamp: Date.now()
        });
        return;
      }

      // Start script execution
      const process = await scriptManager.executeScript(scriptPath);
      
      // Store the execution
      this.activeExecutions.set(executionId, { process, ws });

      // Send start message
      this.sendMessage(ws, {
        type: 'start',
        data: `Starting execution of ${scriptPath}`,
        timestamp: Date.now()
      });

      // Handle stdout
      process.stdout?.on('data', (data: Buffer) => {
        this.sendMessage(ws, {
          type: 'output',
          data: data.toString(),
          timestamp: Date.now()
        });
      });

      // Handle stderr
      process.stderr?.on('data', (data: Buffer) => {
        this.sendMessage(ws, {
          type: 'error',
          data: data.toString(),
          timestamp: Date.now()
        });
      });

      // Handle process exit
      process.on('exit', (code: number | null, signal: string | null) => {
        this.sendMessage(ws, {
          type: 'end',
          data: `Script execution finished with code: ${code}, signal: ${signal}`,
          timestamp: Date.now()
        });
        
        // Clean up
        this.activeExecutions.delete(executionId);
      });

      // Handle process error
      process.on('error', (error: Error) => {
        this.sendMessage(ws, {
          type: 'error',
          data: `Process error: ${error.message}`,
          timestamp: Date.now()
        });
        
        // Clean up
        this.activeExecutions.delete(executionId);
      });

    } catch (error) {
      this.sendMessage(ws, {
        type: 'error',
        data: `Failed to start script: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: Date.now()
      });
    }
  }

  private stopScriptExecution(executionId: string) {
    const execution = this.activeExecutions.get(executionId);
    if (execution) {
      execution.process.kill('SIGTERM');
      this.activeExecutions.delete(executionId);
      
      this.sendMessage(execution.ws, {
        type: 'end',
        data: 'Script execution stopped by user',
        timestamp: Date.now()
      });
    }
  }

  private sendMessage(ws: WebSocket, message: ScriptExecutionMessage) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }

  private cleanupActiveExecutions(ws: WebSocket) {
    for (const [executionId, execution] of this.activeExecutions.entries()) {
      if (execution.ws === ws) {
        execution.process.kill('SIGTERM');
        this.activeExecutions.delete(executionId);
      }
    }
  }

  // Get active executions count
  getActiveExecutionsCount(): number {
    return this.activeExecutions.size;
  }

  // Get active executions info
  getActiveExecutions(): string[] {
    return Array.from(this.activeExecutions.keys());
  }
}

// Export function to create handler
export function createScriptExecutionHandler(server: any): ScriptExecutionHandler {
  return new ScriptExecutionHandler(server);
}
