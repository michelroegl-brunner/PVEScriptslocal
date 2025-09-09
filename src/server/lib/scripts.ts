import { readdir, stat, access } from 'fs/promises';
import { join, resolve, extname } from 'path';
import { env } from '~/env.js';
import { spawn, ChildProcess } from 'child_process';

export interface ScriptInfo {
  name: string;
  path: string;
  extension: string;
  size: number;
  lastModified: Date;
  executable: boolean;
}

export class ScriptManager {
  private scriptsDir: string;
  private allowedExtensions: string[];
  private allowedPaths: string[];
  private maxExecutionTime: number;

  constructor() {
    this.scriptsDir = join(process.cwd(), env.SCRIPTS_DIRECTORY);
    this.allowedExtensions = env.ALLOWED_SCRIPT_EXTENSIONS.split(',').map(ext => ext.trim());
    this.allowedPaths = env.ALLOWED_SCRIPT_PATHS.split(',').map(path => path.trim());
    this.maxExecutionTime = parseInt(env.MAX_SCRIPT_EXECUTION_TIME, 10);
  }

  /**
   * Get all available scripts in the scripts directory
   */
  async getScripts(): Promise<ScriptInfo[]> {
    try {
      const files = await readdir(this.scriptsDir);
      const scripts: ScriptInfo[] = [];

      for (const file of files) {
        const filePath = join(this.scriptsDir, file);
        const stats = await stat(filePath);

        if (stats.isFile()) {
          const extension = extname(file);
          
          // Check if file extension is allowed
          if (this.allowedExtensions.includes(extension)) {
            // Check if file is executable
            const executable = await this.isExecutable(filePath);
            
            scripts.push({
              name: file,
              path: filePath,
              extension,
              size: stats.size,
              lastModified: stats.mtime,
              executable
            });
          }
        }
      }

      return scripts.sort((a, b) => a.name.localeCompare(b.name));
    } catch (error) {
      console.error('Error reading scripts directory:', error);
      return [];
    }
  }

  /**
   * Check if a file is executable
   */
  private async isExecutable(filePath: string): Promise<boolean> {
    try {
      const stats = await stat(filePath);
      // Check if file has execute permission for owner, group, or others
      const mode = stats.mode;
      const isExecutable = !!(mode & parseInt('111', 8));
      return isExecutable;
    } catch {
      return false;
    }
  }

  /**
   * Validate if a script path is allowed to be executed
   */
  validateScriptPath(scriptPath: string): { valid: boolean; message?: string } {
    const resolvedPath = resolve(scriptPath);
    const scriptsDirResolved = resolve(this.scriptsDir);

    // Check if the script is within the allowed directory
    if (!resolvedPath.startsWith(scriptsDirResolved)) {
      return {
        valid: false,
        message: 'Script path is not within the allowed scripts directory'
      };
    }

    // Check if the script path matches any allowed path pattern
    const relativePath = resolvedPath.replace(scriptsDirResolved, '').replace(/\\/g, '/');
    const isAllowed = this.allowedPaths.some(allowedPath => 
      relativePath.startsWith(allowedPath.replace(/\\/g, '/'))
    );

    if (!isAllowed) {
      return {
        valid: false,
        message: 'Script path is not in the allowed paths list'
      };
    }

    // Check file extension
    const extension = extname(scriptPath);
    if (!this.allowedExtensions.includes(extension)) {
      return {
        valid: false,
        message: `File extension '${extension}' is not allowed. Allowed extensions: ${this.allowedExtensions.join(', ')}`
      };
    }

    return { valid: true };
  }

  /**
   * Execute a script and return a child process
   */
  async executeScript(scriptPath: string): Promise<ChildProcess> {
    const validation = this.validateScriptPath(scriptPath);
    if (!validation.valid) {
      throw new Error(validation.message);
    }

    // Determine the command to run based on file extension
    const extension = extname(scriptPath);
    let command: string;
    let args: string[] = [];

    switch (extension) {
      case '.sh':
      case '.bash':
        command = 'bash';
        args = [scriptPath];
        break;
      case '.py':
        command = 'python';
        args = [scriptPath];
        break;
      case '.js':
        command = 'node';
        args = [scriptPath];
        break;
      case '.ts':
        command = 'npx';
        args = ['ts-node', scriptPath];
        break;
      default:
        // Try to execute directly (for files with shebang)
        command = scriptPath;
        args = [];
    }

    // Spawn the process
    const childProcess = spawn(command, args, {
      cwd: this.scriptsDir,
      stdio: ['pipe', 'pipe', 'pipe'],
      shell: true
    });

    // Set up timeout
    const timeout = setTimeout(() => {
      if (!childProcess.killed) {
        childProcess.kill('SIGTERM');
        console.log(`Script execution timed out after ${this.maxExecutionTime}ms`);
      }
    }, this.maxExecutionTime);

    // Clean up timeout when process exits
    childProcess.on('exit', () => {
      clearTimeout(timeout);
    });

    return childProcess;
  }

  /**
   * Get script content for display
   */
  async getScriptContent(scriptPath: string): Promise<string> {
    const validation = this.validateScriptPath(scriptPath);
    if (!validation.valid) {
      throw new Error(validation.message);
    }

    const { readFile } = await import('fs/promises');
    return await readFile(scriptPath, 'utf-8');
  }

  /**
   * Get scripts directory information
   */
  getScriptsDirectoryInfo(): {
    path: string;
    allowedExtensions: string[];
    allowedPaths: string[];
    maxExecutionTime: number;
  } {
    return {
      path: this.scriptsDir,
      allowedExtensions: this.allowedExtensions,
      allowedPaths: this.allowedPaths,
      maxExecutionTime: this.maxExecutionTime
    };
  }
}

// Export singleton instance
export const scriptManager = new ScriptManager();
