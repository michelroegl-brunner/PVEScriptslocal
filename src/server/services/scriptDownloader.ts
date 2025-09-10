import { readFile, writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { env } from '~/env.js';
import type { Script } from '~/types/script';

export class ScriptDownloaderService {
  private scriptsDirectory: string;
  private repoUrl: string;

  constructor() {
    this.scriptsDirectory = join(process.cwd(), 'scripts');
    this.repoUrl = env.REPO_URL || '';
  }

  private async ensureDirectoryExists(dirPath: string): Promise<void> {
    try {
      await mkdir(dirPath, { recursive: true });
    } catch (error) {
      // Directory might already exist, ignore error
    }
  }

  private async downloadFileFromGitHub(filePath: string): Promise<string> {
    if (!this.repoUrl) {
      throw new Error('REPO_URL environment variable is not set');
    }

    const url = `https://raw.githubusercontent.com/${this.extractRepoPath()}/main/${filePath}`;
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to download ${filePath}: ${response.status} ${response.statusText}`);
    }

    return response.text();
  }

  private extractRepoPath(): string {
    const match = this.repoUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/);
    if (!match) {
      throw new Error('Invalid GitHub repository URL');
    }
    return `${match[1]}/${match[2]}`;
  }

  private modifyScriptContent(content: string): string {
    // Replace the build.func source line
    const oldPattern = /source <\(curl -fsSL https:\/\/raw\.githubusercontent\.com\/community-scripts\/ProxmoxVE\/main\/misc\/build\.func\)/g;
    const newPattern = 'SCRIPT_DIR="$(dirname "$0")" \nsource "$SCRIPT_DIR/../core/build.func"';
    
    return content.replace(oldPattern, newPattern);
    
  }

  async loadScript(script: Script): Promise<{ success: boolean; message: string; files: string[] }> {
    try {
      const files: string[] = [];
      
      // Ensure directories exist
      await this.ensureDirectoryExists(join(this.scriptsDirectory, 'ct'));
      await this.ensureDirectoryExists(join(this.scriptsDirectory, 'install'));

      // Download and save CT script
      if (script.install_methods && script.install_methods.length > 0) {
        for (const method of script.install_methods) {
          if (method.script && method.script.startsWith('ct/')) {
            const scriptPath = method.script;
            const fileName = scriptPath.split('/').pop();
            
            if (fileName) {
              // Download from GitHub
              const content = await this.downloadFileFromGitHub(scriptPath);
              
              // Modify the content
              const modifiedContent = this.modifyScriptContent(content);
              
              // Save to local directory
              const localPath = join(this.scriptsDirectory, 'ct', fileName);
              await writeFile(localPath, modifiedContent, 'utf-8');
              
              files.push(`ct/${fileName}`);
            }
          }
        }
      }

      // Download and save install script
      const installScriptName = `${script.slug}-install.sh`;
      try {
        const installContent = await this.downloadFileFromGitHub(`install/${installScriptName}`);
        const localInstallPath = join(this.scriptsDirectory, 'install', installScriptName);
        await writeFile(localInstallPath, installContent, 'utf-8');
        files.push(`install/${installScriptName}`);
      } catch (error) {
        // Install script might not exist, that's okay
        console.log(`Install script not found for ${script.slug}: ${error}`);
      }

      return {
        success: true,
        message: `Successfully loaded ${files.length} script(s) for ${script.name}`,
        files
      };
    } catch (error) {
      console.error('Error loading script:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to load script',
        files: []
      };
    }
  }

  async checkScriptExists(script: Script): Promise<{ ctExists: boolean; installExists: boolean; files: string[] }> {
    const files: string[] = [];
    let ctExists = false;
    let installExists = false;

    try {
      // Check CT script
      if (script.install_methods && script.install_methods.length > 0) {
        for (const method of script.install_methods) {
          if (method.script && method.script.startsWith('ct/')) {
            const fileName = method.script.split('/').pop();
            if (fileName) {
              const localPath = join(this.scriptsDirectory, 'ct', fileName);
              try {
                await readFile(localPath, 'utf-8');
                ctExists = true;
                files.push(`ct/${fileName}`);
              } catch {
                // File doesn't exist
              }
            }
          }
        }
      }

      // Check install script
      const installScriptName = `${script.slug}-install.sh`;
      const localInstallPath = join(this.scriptsDirectory, 'install', installScriptName);
      try {
        await readFile(localInstallPath, 'utf-8');
        installExists = true;
        files.push(`install/${installScriptName}`);
      } catch {
        // File doesn't exist
      }

      return { ctExists, installExists, files };
    } catch (error) {
      console.error('Error checking script existence:', error);
      return { ctExists: false, installExists: false, files: [] };
    }
  }
}

// Singleton instance
export const scriptDownloaderService = new ScriptDownloaderService();
