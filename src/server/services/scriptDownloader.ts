import { readFile, writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { env } from '~/env.js';
import type { Script } from '~/types/script';

export class ScriptDownloaderService {
  private scriptsDirectory: string;
  private repoUrl: string;

  constructor() {
    this.scriptsDirectory = join(process.cwd(), 'scripts');
    this.repoUrl = env.REPO_URL ?? '';
  }

  private async ensureDirectoryExists(dirPath: string): Promise<void> {
    try {
      await mkdir(dirPath, { recursive: true });
    } catch {
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
    const match = /github\.com\/([^\/]+)\/([^\/]+)/.exec(this.repoUrl);
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
      if (script.install_methods?.length) {
        for (const method of script.install_methods) {
          if (method.script?.startsWith('ct/')) {
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
      } catch {
        // Install script might not exist, that's okay
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
      if (script.install_methods?.length) {
        for (const method of script.install_methods) {
          if (method.script?.startsWith('ct/')) {
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

  async compareScriptContent(script: Script): Promise<{ hasDifferences: boolean; differences: string[] }> {
    const differences: string[] = [];
    let hasDifferences = false;

    try {
      // First check if any local files exist
      const localFilesExist = await this.checkScriptExists(script);
      if (!localFilesExist.ctExists && !localFilesExist.installExists) {
        // No local files exist, so no comparison needed
        return { hasDifferences: false, differences: [] };
      }

      // Compare CT script only if it exists locally
      if (localFilesExist.ctExists && script.install_methods?.length) {
        for (const method of script.install_methods) {
          if (method.script?.startsWith('ct/')) {
            const fileName = method.script.split('/').pop();
            if (fileName) {
              const localPath = join(this.scriptsDirectory, 'ct', fileName);
              try {
                // Read local content
                const localContent = await readFile(localPath, 'utf-8');
                
                // Download remote content
                const remoteContent = await this.downloadFileFromGitHub(method.script);
                
                // Apply the same modification that would be applied during load
                const modifiedRemoteContent = this.modifyScriptContent(remoteContent);
                
                // Compare content
                if (localContent !== modifiedRemoteContent) {
                  hasDifferences = true;
                  differences.push(`ct/${fileName}`);
                }
          } catch {
            // Don't add to differences if there's an error reading files
          }
            }
          }
        }
      }

      // Compare install script only if it exists locally
      if (localFilesExist.installExists) {
        const installScriptName = `${script.slug}-install.sh`;
        const localInstallPath = join(this.scriptsDirectory, 'install', installScriptName);
        try {
          // Read local content
          const localContent = await readFile(localInstallPath, 'utf-8');
          
          // Download remote content
          const remoteContent = await this.downloadFileFromGitHub(`install/${installScriptName}`);
          
          // Apply the same modification that would be applied during load
          const modifiedRemoteContent = this.modifyScriptContent(remoteContent);
          
          // Compare content
          if (localContent !== modifiedRemoteContent) {
            hasDifferences = true;
            differences.push(`install/${installScriptName}`);
          }
        } catch {
          // Don't add to differences if there's an error reading files
        }
      }

      return { hasDifferences, differences };
    } catch (error) {
      console.error('Error comparing script content:', error);
      return { hasDifferences: false, differences: [] };
    }
  }

  async getScriptDiff(script: Script, filePath: string): Promise<{ diff: string | null; localContent: string | null; remoteContent: string | null }> {
    try {
      let localContent: string | null = null;
      let remoteContent: string | null = null;

      if (filePath.startsWith('ct/')) {
        // Handle CT script
        const fileName = filePath.split('/').pop();
        if (fileName) {
          const localPath = join(this.scriptsDirectory, 'ct', fileName);
          try {
            localContent = await readFile(localPath, 'utf-8');
          } catch {
            // Error reading local CT script
          }

          try {
            // Find the corresponding script path in install_methods
            const method = script.install_methods?.find(m => m.script === filePath);
            if (method?.script) {
              const downloadedContent = await this.downloadFileFromGitHub(method.script);
              remoteContent = this.modifyScriptContent(downloadedContent);
            }
          } catch {
            // Error downloading remote CT script
          }
        }
      } else if (filePath.startsWith('install/')) {
        // Handle install script
        const localPath = join(this.scriptsDirectory, filePath);
        try {
          localContent = await readFile(localPath, 'utf-8');
        } catch {
          // Error reading local install script
        }

        try {
          remoteContent = await this.downloadFileFromGitHub(filePath);
        } catch {
          // Error downloading remote install script
        }
      }

      if (!localContent || !remoteContent) {
        return { diff: null, localContent, remoteContent };
      }

      // Generate diff using a simple line-by-line comparison
      const diff = this.generateDiff(localContent, remoteContent);
      return { diff, localContent, remoteContent };
    } catch (error) {
      console.error('Error getting script diff:', error);
      return { diff: null, localContent: null, remoteContent: null };
    }
  }

  private generateDiff(localContent: string, remoteContent: string): string {
    const localLines = localContent.split('\n');
    const remoteLines = remoteContent.split('\n');
    
    let diff = '';
    let i = 0;
    let j = 0;

    while (i < localLines.length || j < remoteLines.length) {
      const localLine = localLines[i];
      const remoteLine = remoteLines[j];

      if (i >= localLines.length) {
        // Only remote lines left
        diff += `+${j + 1}: ${remoteLine}\n`;
        j++;
      } else if (j >= remoteLines.length) {
        // Only local lines left
        diff += `-${i + 1}: ${localLine}\n`;
        i++;
      } else if (localLine === remoteLine) {
        // Lines are the same
        diff += ` ${i + 1}: ${localLine}\n`;
        i++;
        j++;
      } else {
        // Lines are different - find the best match
        let found = false;
        for (let k = j + 1; k < Math.min(j + 10, remoteLines.length); k++) {
          if (localLine === remoteLines[k]) {
            // Found match in remote, local line was removed
            for (let l = j; l < k; l++) {
              diff += `+${l + 1}: ${remoteLines[l]}\n`;
            }
            diff += ` ${i + 1}: ${localLine}\n`;
            i++;
            j = k + 1;
            found = true;
            break;
          }
        }
        
        if (!found) {
          for (let k = i + 1; k < Math.min(i + 10, localLines.length); k++) {
            if (remoteLine === localLines[k]) {
              // Found match in local, remote line was added
              diff += `-${i + 1}: ${localLine}\n`;
              for (let l = i + 1; l < k; l++) {
                diff += `-${l + 1}: ${localLines[l]}\n`;
              }
              diff += `+${j + 1}: ${remoteLine}\n`;
              i = k + 1;
              j++;
              found = true;
              break;
            }
          }
        }
        
        if (!found) {
          // No match found, lines are different
          diff += `-${i + 1}: ${localLine}\n`;
          diff += `+${j + 1}: ${remoteLine}\n`;
          i++;
          j++;
        }
      }
    }

    return diff;
  }
}

// Singleton instance
export const scriptDownloaderService = new ScriptDownloaderService();
