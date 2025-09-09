import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { WebSocketServer } from 'ws';
import { spawn } from 'child_process';
import { join, resolve } from 'path';

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = process.env.PORT || 3000;

// when using middleware `hostname` and `port` must be provided below
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

// WebSocket handler for script execution
class ScriptExecutionHandler {
  constructor(server) {
    this.wss = new WebSocketServer({ 
      server,
      path: '/ws/script-execution'
    });
    this.activeExecutions = new Map();
    this.setupWebSocket();
  }

  setupWebSocket() {
    this.wss.on('connection', (ws, request) => {
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
        this.cleanupActiveExecutions(ws);
      });

      ws.on('error', (error) => {
        console.error('WebSocket error:', error);
        this.cleanupActiveExecutions(ws);
      });
    });
  }

  async handleMessage(ws, message) {
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

  async startScriptExecution(ws, scriptPath, executionId) {
    try {
      // Basic validation
      const scriptsDir = join(process.cwd(), 'scripts');
      const resolvedPath = resolve(scriptPath);
      
      if (!resolvedPath.startsWith(resolve(scriptsDir))) {
        this.sendMessage(ws, {
          type: 'error',
          data: 'Script path is not within the allowed scripts directory',
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
      const process = spawn('bash', [scriptPath], {
        cwd: scriptsDir,
        stdio: ['pipe', 'pipe', 'pipe'],
        shell: true
      });
      
      // Store the execution
      this.activeExecutions.set(executionId, { process, ws });

      // Send start message
      this.sendMessage(ws, {
        type: 'start',
        data: `Starting execution of ${scriptPath}`,
        timestamp: Date.now()
      });

      // Handle stdout
      process.stdout?.on('data', (data) => {
        this.sendMessage(ws, {
          type: 'output',
          data: data.toString(),
          timestamp: Date.now()
        });
      });

      // Handle stderr
      process.stderr?.on('data', (data) => {
        this.sendMessage(ws, {
          type: 'error',
          data: data.toString(),
          timestamp: Date.now()
        });
      });

      // Handle process exit
      process.on('exit', (code, signal) => {
        this.sendMessage(ws, {
          type: 'end',
          data: `Script execution finished with code: ${code}, signal: ${signal}`,
          timestamp: Date.now()
        });
        
        // Clean up
        this.activeExecutions.delete(executionId);
      });

      // Handle process error
      process.on('error', (error) => {
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
        data: `Failed to start script: ${error.message}`,
        timestamp: Date.now()
      });
    }
  }

  stopScriptExecution(executionId) {
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

  sendMessage(ws, message) {
    if (ws.readyState === 1) { // WebSocket.OPEN
      ws.send(JSON.stringify(message));
    }
  }

  cleanupActiveExecutions(ws) {
    for (const [executionId, execution] of this.activeExecutions.entries()) {
      if (execution.ws === ws) {
        execution.process.kill('SIGTERM');
        this.activeExecutions.delete(executionId);
      }
    }
  }
}

app.prepare().then(() => {
  const httpServer = createServer(async (req, res) => {
    try {
      // Be sure to pass `true` as the second argument to `url.parse`.
      // This tells it to parse the query portion of the URL.
      const parsedUrl = parse(req.url, true);
      const { pathname, query } = parsedUrl;

      if (pathname === '/ws/script-execution') {
        // WebSocket upgrade will be handled by the WebSocket server
        return;
      }

      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  });

  // Create WebSocket handler
  const scriptHandler = new ScriptExecutionHandler(httpServer);

  httpServer
    .once('error', (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`> Ready on http://${hostname}:${port}`);
      console.log(`> WebSocket server running on ws://${hostname}:${port}/ws/script-execution`);
    });
});
