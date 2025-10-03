import { spawn } from 'child_process';
import { spawn as ptySpawn } from 'node-pty';


/**
 * @typedef {Object} Server
 * @property {string} ip - Server IP address
 * @property {string} user - Username
 * @property {string} password - Password
 * @property {string} name - Server name
 */

class SSHExecutionService {
  /**
   * Execute a script on a remote server via SSH
   * @param {Server} server - Server configuration
   * @param {string} scriptPath - Path to the script
   * @param {Function} onData - Callback for data output
   * @param {Function} onError - Callback for errors
   * @param {Function} onExit - Callback for process exit
   * @returns {Promise<Object>} Process information
   */
  async executeScript(server, scriptPath, onData, onError, onExit) {
    const { ip, user, password } = server;
    
    try {
      await this.transferScriptsFolder(server, onData, onError);
      
      return new Promise((resolve, reject) => {
        const relativeScriptPath = scriptPath.startsWith('scripts/') ? scriptPath.substring(8) : scriptPath;
        
        // Use ptySpawn for proper terminal emulation and color support
        const sshCommand = ptySpawn('sshpass', [
          '-p', password,
          'ssh',
          '-t',
          '-o', 'ConnectTimeout=10',
          '-o', 'StrictHostKeyChecking=no',
          '-o', 'UserKnownHostsFile=/dev/null',
          '-o', 'LogLevel=ERROR',
          '-o', 'PasswordAuthentication=yes',
          '-o', 'PubkeyAuthentication=no',
          '-o', 'RequestTTY=yes',
          '-o', 'SetEnv=TERM=xterm-256color',
          '-o', 'SetEnv=COLUMNS=120',
          '-o', 'SetEnv=LINES=30',
          '-o', 'SetEnv=COLORTERM=truecolor',
          '-o', 'SetEnv=FORCE_COLOR=1',
          '-o', 'SetEnv=NO_COLOR=0',
          '-o', 'SetEnv=CLICOLOR=1',
          '-o', 'SetEnv=CLICOLOR_FORCE=1',
          `${user}@${ip}`,
          `cd /tmp/scripts && chmod +x ${relativeScriptPath} && export TERM=xterm-256color && export COLUMNS=120 && export LINES=30 && export COLORTERM=truecolor && export FORCE_COLOR=1 && export NO_COLOR=0 && export CLICOLOR=1 && export CLICOLOR_FORCE=1 && bash ${relativeScriptPath}`
        ], {
          name: 'xterm-256color',
          cols: 120,
          rows: 30,
          cwd: process.cwd(),
          env: {
            ...process.env,
            TERM: 'xterm-256color',
            COLUMNS: '120',
            LINES: '30',
            SHELL: '/bin/bash',
            COLORTERM: 'truecolor',
            FORCE_COLOR: '1',
            NO_COLOR: '0',
            CLICOLOR: '1',
            CLICOLOR_FORCE: '1'
          }
        });

        // Use pty's onData method which handles both stdout and stderr combined
        sshCommand.onData((data) => {
          // pty handles encoding automatically and preserves ANSI codes
          onData(data);
        });

        sshCommand.onExit((e) => {
          onExit(e.exitCode);
        });

        resolve({
          process: sshCommand,
          kill: () => sshCommand.kill('SIGTERM')
        });
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      onError(`SSH execution failed: ${errorMessage}`);
      throw error;
    }
  }

  /**
   * Transfer the entire scripts folder to the remote server
   * @param {Server} server - Server configuration
   * @param {Function} onData - Callback for data output
   * @param {Function} onError - Callback for errors
   * @returns {Promise<void>}
   */
  async transferScriptsFolder(server, onData, onError) {
    const { ip, user, password } = server;
    
    return new Promise((resolve, reject) => {
      const rsyncCommand = spawn('rsync', [
        '-avz',
        '--delete',
        '--exclude=*.log',
        '--exclude=*.tmp',
        '--rsh=sshpass -p ' + password + ' ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null',
        'scripts/',
        `${user}@${ip}:/tmp/scripts/`
      ], {
        stdio: ['pipe', 'pipe', 'pipe']
      });

      rsyncCommand.stdout.on('data', (/** @type {Buffer} */ data) => {
        // Ensure proper UTF-8 encoding for ANSI colors
        const output = data.toString('utf8');
        onData(output);
      });

      rsyncCommand.stderr.on('data', (/** @type {Buffer} */ data) => {
        // Ensure proper UTF-8 encoding for ANSI colors
        const output = data.toString('utf8');
        onError(output);
      });

      rsyncCommand.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`rsync failed with code ${code}`));
        }
      });

      rsyncCommand.on('error', (error) => {
        reject(error);
      });
    });
  }

  /**
   * Execute a direct command on a remote server via SSH
   * @param {Server} server - Server configuration
   * @param {string} command - Command to execute
   * @param {Function} onData - Callback for data output
   * @param {Function} onError - Callback for errors
   * @param {Function} onExit - Callback for process exit
   * @returns {Promise<Object>} Process information
   */
  async executeCommand(server, command, onData, onError, onExit) {
    const { ip, user, password } = server;
    
    return new Promise((resolve, reject) => {
      // Use ptySpawn for proper terminal emulation and color support
      const sshCommand = ptySpawn('sshpass', [
        '-p', password,
        'ssh',
        '-t',
        '-o', 'ConnectTimeout=10',
        '-o', 'StrictHostKeyChecking=no',
        '-o', 'UserKnownHostsFile=/dev/null',
        '-o', 'LogLevel=ERROR',
        '-o', 'PasswordAuthentication=yes',
        '-o', 'PubkeyAuthentication=no',
        '-o', 'RequestTTY=yes',
        '-o', 'SetEnv=TERM=xterm-256color',
        '-o', 'SetEnv=COLUMNS=120',
        '-o', 'SetEnv=LINES=30',
        '-o', 'SetEnv=COLORTERM=truecolor',
        '-o', 'SetEnv=FORCE_COLOR=1',
        '-o', 'SetEnv=NO_COLOR=0',
        '-o', 'SetEnv=CLICOLOR=1',
        `${user}@${ip}`,
        command
      ], {
        name: 'xterm-color',
        cols: 120,
        rows: 30,
        cwd: process.cwd(),
        env: process.env
      });

      sshCommand.onData((data) => {
        onData(data);
      });

      sshCommand.onExit((e) => {
        onExit(e.exitCode);
      });

      resolve({ process: sshCommand });
    });
  }

}

// Singleton instance
/** @type {SSHExecutionService | null} */
let sshExecutionInstance = null;

export function getSSHExecutionService() {
  if (!sshExecutionInstance) {
    sshExecutionInstance = new SSHExecutionService();
  }
  return sshExecutionInstance;
}

export default SSHExecutionService;