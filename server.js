import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { WebSocketServer } from 'ws';
import { spawn } from 'child_process';
import { join, resolve } from 'path';
import stripAnsi from 'strip-ansi';
import { spawn as ptySpawn } from 'node-pty';
import { getSSHExecutionService } from './src/server/ssh-execution-service.js';

const dev = process.env.NODE_ENV !== 'production';
const hostname = '0.0.0.0';
const port = parseInt(process.env.PORT || '3000', 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

// WebSocket handler for script execution
/**
 * @typedef {import('ws').WebSocket & {connectionTime?: number, clientIP?: string}} ExtendedWebSocket
 */

/**
 * @typedef {Object} Execution
 * @property {any} process
 * @property {ExtendedWebSocket} ws
 */

/**
 * @typedef {Object} ServerInfo
 * @property {string} name
 * @property {string} ip
 * @property {string} user
 * @property {string} password
 */

/**
 * @typedef {Object} ExecutionResult
 * @property {any} process
 * @property {Function} kill
 */

/**
 * @typedef {Object} WebSocketMessage
 * @property {string} action
 * @property {string} [scriptPath]
 * @property {string} [executionId]
 * @property {string} [input]
 * @property {string} [mode]
 * @property {ServerInfo} [server]
 */

class ScriptExecutionHandler {
  /**
   * @param {import('http').Server} server
   */
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
      
      // Set connection metadata
      /** @type {ExtendedWebSocket} */ (ws).connectionTime = Date.now();
      /** @type {ExtendedWebSocket} */ (ws).clientIP = request.socket.remoteAddress || 'unknown';
      
      ws.on('message', (data) => {
        try {
          const rawMessage = data.toString();
          console.log('Raw WebSocket message received:', rawMessage);
          const message = JSON.parse(rawMessage);
          console.log('Parsed WebSocket message:', message);
          this.handleMessage(/** @type {ExtendedWebSocket} */ (ws), message);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
          this.sendMessage(ws, {
            type: 'error',
            data: 'Invalid message format',
            timestamp: Date.now()
          });
        }
      });

      ws.on('close', (code, reason) => {
        this.cleanupActiveExecutions(/** @type {ExtendedWebSocket} */ (ws));
      });

      ws.on('error', (error) => {
        console.error('WebSocket error:', error);
        this.cleanupActiveExecutions(/** @type {ExtendedWebSocket} */ (ws));
      });
    });
  }

  /**
   * @param {ExtendedWebSocket} ws
   * @param {WebSocketMessage} message
   */
  async handleMessage(ws, message) {
    const { action, scriptPath, executionId, input, mode, server } = message;
    
    // Debug logging
    console.log('WebSocket message received:', { action, scriptPath, executionId, mode, server: server ? { name: server.name, ip: server.ip } : null });
    console.log('Full message object:', JSON.stringify(message, null, 2));

    switch (action) {
      case 'start':
        if (scriptPath && executionId) {
          await this.startScriptExecution(ws, scriptPath, executionId, mode, server);
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

      case 'input':
        if (executionId && input !== undefined) {
          this.sendInputToProcess(executionId, input);
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

  /**
   * @param {ExtendedWebSocket} ws
   * @param {string} scriptPath
   * @param {string} executionId
   * @param {string} mode
   * @param {ServerInfo|null} server
   */
  async startScriptExecution(ws, scriptPath, executionId, mode = 'local', server = null) {
    try {
      // Debug logging
      console.log('startScriptExecution called with:', { mode, server: server ? { name: server.name, ip: server.ip } : null });
      console.log('Full server object:', JSON.stringify(server, null, 2));
      
      // Check if execution is already running
      if (this.activeExecutions.has(executionId)) {
        this.sendMessage(ws, {
          type: 'error',
          data: 'Script execution already running',
          timestamp: Date.now()
        });
        return;
      }

      // Handle SSH execution
      if (mode === 'ssh' && server) {
        console.log('Starting SSH execution...');
        await this.startSSHScriptExecution(ws, scriptPath, executionId, server);
        return;
      }
      
      if (mode === 'ssh' && !server) {
        console.log('SSH mode requested but no server provided, falling back to local execution');
      }
      
      console.log('Starting local execution...');

      // Basic validation for local execution
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

      // Start script execution with pty for proper TTY support
      const childProcess = ptySpawn('bash', [resolvedPath], {
        cwd: scriptsDir,
        name: 'xterm-256color',
        cols: 80,
        rows: 24,
        env: {
          ...process.env,
          TERM: 'xterm-256color', // Enable proper terminal support
          FORCE_ANSI: 'true', // Allow ANSI codes for proper display
          COLUMNS: '80', // Set terminal width
          LINES: '24' // Set terminal height
        }
      });

      // pty handles encoding automatically
      
      // Store the execution
      this.activeExecutions.set(executionId, { process: childProcess, ws });

      // Send start message
      this.sendMessage(ws, {
        type: 'start',
        data: `Starting execution of ${scriptPath}`,
        timestamp: Date.now()
      });

      // Handle pty data (both stdout and stderr combined)
      childProcess.onData((data) => {
        this.sendMessage(ws, {
          type: 'output',
          data: data.toString(),
          timestamp: Date.now()
        });
      });

      // Handle process exit
      childProcess.onExit((e) => {
        this.sendMessage(ws, {
          type: 'end',
          data: `Script execution finished with code: ${e.exitCode}, signal: ${e.signal}`,
          timestamp: Date.now()
        });
        
        // Clean up
        this.activeExecutions.delete(executionId);
      });

    } catch (error) {
      this.sendMessage(ws, {
        type: 'error',
        data: `Failed to start script: ${error instanceof Error ? error.message : String(error)}`,
        timestamp: Date.now()
      });
    }
  }

  /**
   * Start SSH script execution
   * @param {ExtendedWebSocket} ws
   * @param {string} scriptPath
   * @param {string} executionId
   * @param {ServerInfo} server
   */
  async startSSHScriptExecution(ws, scriptPath, executionId, server) {
    console.log('startSSHScriptExecution called with server:', server);
    const sshService = getSSHExecutionService();

    // Send start message
    this.sendMessage(ws, {
      type: 'start',
      data: `Starting SSH execution of ${scriptPath} on ${server.name} (${server.ip})`,
      timestamp: Date.now()
    });

    try {
      const execution = /** @type {ExecutionResult} */ (await sshService.executeScript(
        server,
        scriptPath,
        /** @param {string} data */ (data) => {
          // Handle data output
          this.sendMessage(ws, {
            type: 'output',
            data: data,
            timestamp: Date.now()
          });
        },
        /** @param {string} error */ (error) => {
          // Handle errors
          this.sendMessage(ws, {
            type: 'error',
            data: error,
            timestamp: Date.now()
          });
        },
        /** @param {number} code */ (code) => {
          // Handle process exit
          this.sendMessage(ws, {
            type: 'end',
            data: `SSH script execution finished with code: ${code}`,
            timestamp: Date.now()
          });
          
          // Clean up
          this.activeExecutions.delete(executionId);
        }
      ));

      // Store the execution
      this.activeExecutions.set(executionId, { process: execution.process, ws });

    } catch (error) {
      this.sendMessage(ws, {
        type: 'error',
        data: `Failed to start SSH execution: ${error instanceof Error ? error.message : String(error)}`,
        timestamp: Date.now()
      });
    }
  }

  /**
   * @param {string} executionId
   */
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

  /**
   * @param {string} executionId
   * @param {string} input
   */
  sendInputToProcess(executionId, input) {
    const execution = this.activeExecutions.get(executionId);
    if (execution && execution.process.write) {
      execution.process.write(input);
    }
  }

  /**
   * @param {ExtendedWebSocket} ws
   * @param {any} message
   */
  sendMessage(ws, message) {
    if (ws.readyState === 1) { // WebSocket.OPEN
      ws.send(JSON.stringify(message));
    }
  }

  /**
   * @param {ExtendedWebSocket} ws
   */
  cleanupActiveExecutions(ws) {
    for (const [executionId, execution] of this.activeExecutions.entries()) {
      if (execution.ws === ws) {
        execution.process.kill('SIGTERM');
        this.activeExecutions.delete(executionId);
      }
    }
  }
}

// TerminalHandler removed - not used by current application

app.prepare().then(() => {
  const httpServer = createServer(async (req, res) => {
    try {
      // Be sure to pass `true` as the second argument to `url.parse`.
      // This tells it to parse the query portion of the URL.
      const parsedUrl = parse(req.url || '', true);
      const { pathname, query } = parsedUrl;

      if (pathname === '/ws/script-execution') {
        // WebSocket upgrade will be handled by the WebSocket server
        return;
      }

      // Let Next.js handle all other requests including HMR
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  });

  // Create WebSocket handlers
  const scriptHandler = new ScriptExecutionHandler(httpServer);
  // Note: TerminalHandler removed as it's not being used by the current application

  httpServer
    .once('error', (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, hostname, () => {
      console.log(`> Ready on http://${hostname}:${port}`);
      console.log(`> WebSocket server running on ws://${hostname}:${port}/ws/script-execution`);
    });
});
