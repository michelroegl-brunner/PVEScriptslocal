import { simpleGit, type SimpleGit } from 'simple-git';
import { env } from '~/env.js';
import { join } from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export class GitManager {
  private git: SimpleGit;
  private repoPath: string;
  private scriptsDir: string;

  constructor() {
    this.repoPath = process.cwd();
    this.scriptsDir = join(this.repoPath, env.SCRIPTS_DIRECTORY);
    this.git = simpleGit(this.repoPath);
  }

  /**
   * Check if the repository is behind the remote
   */
  async isBehindRemote(): Promise<boolean> {
    try {
      if (!env.ORIGINAL_REPO_URL) {
        return false; // No remote configured
      }

      // Fetch latest changes without merging
      await this.git.fetch();
      
      // Check if local branch is behind remote
      const status = await this.git.status();
      const behind = status.behind > 0;
      
      return behind;
    } catch (error) {
      console.error('Error checking repo status:', error);
      return false;
    }
  }

  /**
   * Pull updates from remote repository
   */
  async pullUpdates(): Promise<{ success: boolean; message: string }> {
    try {
      if (!env.ORIGINAL_REPO_URL) {
        return { success: false, message: 'No remote repository configured' };
      }

      // Check if we're in a git repository
      const isRepo = await this.git.checkIsRepo();
      if (!isRepo) {
        // Clone the repository if it doesn't exist
        return await this.cloneRepository();
      }

      // Pull latest changes
      const result = await this.git.pull(env.REPO_BRANCH);
      
      return {
        success: true,
        message: `Successfully pulled updates. ${result.summary.changes} changes, ${result.summary.insertions} insertions, ${result.summary.deletions} deletions`
      };
    } catch (error) {
      console.error('Error pulling updates:', error);
      return {
        success: false,
        message: `Failed to pull updates: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Full update process: git pull, npm install, and restart server
   */
  async fullUpdate(): Promise<{ success: boolean; message: string; steps: string[] }> {
    const steps: string[] = [];
    
    try {
      if (!env.ORIGINAL_REPO_URL) {
        return { 
          success: false, 
          message: 'No remote repository configured',
          steps: ['❌ No remote repository configured']
        };
      }

      // Step 1: Git pull
      steps.push('🔄 Pulling latest changes from repository...');
      const pullResult = await this.pullUpdates();
      if (!pullResult.success) {
        return {
          success: false,
          message: pullResult.message,
          steps: [...steps, `❌ ${pullResult.message}`]
        };
      }
      steps.push(`✅ ${pullResult.message}`);

      // Step 2: npm install
      steps.push('📦 Installing/updating dependencies...');
      try {
        const { stderr } = await execAsync('npm install', { cwd: this.repoPath });
        if (stderr && !stderr.includes('npm WARN')) {
          console.warn('npm install warnings:', stderr);
        }
        steps.push('✅ Dependencies updated successfully');
      } catch (error) {
        const errorMsg = `Failed to install dependencies: ${error instanceof Error ? error.message : 'Unknown error'}`;
        steps.push(`❌ ${errorMsg}`);
        return {
          success: false,
          message: errorMsg,
          steps
        };
      }

      // Step 3: Build the application
      steps.push('🔨 Building application...');
      try {
        const { stderr } = await execAsync('npm run build', { cwd: this.repoPath });
        if (stderr && !stderr.includes('npm WARN')) {
          console.warn('npm build warnings:', stderr);
        }
        steps.push('✅ Application built successfully');
      } catch (error) {
        const errorMsg = `Failed to build application: ${error instanceof Error ? error.message : 'Unknown error'}`;
        steps.push(`❌ ${errorMsg}`);
        return {
          success: false,
          message: errorMsg,
          steps
        };
      }

      // Step 4: Restart server (this will be handled by the process manager)
      steps.push('🔄 Server restart required - please restart manually or use a process manager');
      steps.push('✅ Update process completed successfully');

      return {
        success: true,
        message: 'Repository updated successfully. Please restart the server to apply changes.',
        steps
      };

    } catch (error) {
      const errorMsg = `Update failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
      steps.push(`❌ ${errorMsg}`);
      return {
        success: false,
        message: errorMsg,
        steps
      };
    }
  }

  /**
   * Clone the repository if it doesn't exist
   */
  private async cloneRepository(): Promise<{ success: boolean; message: string }> {
    try {
      if (!env.ORIGINAL_REPO_URL) {
        return { success: false, message: 'No repository URL configured' };
      }

      
      // Clone the repository
      await this.git.clone(env.ORIGINAL_REPO_URL, this.repoPath, [
        '--branch', env.REPO_BRANCH,
        '--single-branch',
        '--depth', '1'
      ]);

      return {
        success: true,
        message: `Successfully cloned repository from ${env.ORIGINAL_REPO_URL}`
      };
    } catch (error) {
      console.error('Error cloning repository:', error);
      return {
        success: false,
        message: `Failed to clone repository: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Initialize repository on startup if needed
   */
  async initializeRepository(): Promise<void> {
    try {
      if (!env.ORIGINAL_REPO_URL) {
        return;
      }

      const isRepo = await this.git.checkIsRepo();
      if (!isRepo) {
        const result = await this.cloneRepository();
        if (result.success) {
        } else {
        }
      } else {
        const behind = await this.isBehindRemote();
        if (behind) {
          const result = await this.pullUpdates();
          if (result.success) {
          } else {
          }
        } else {
        }
      }
    } catch (error) {
      console.error('Error initializing repository:', error);
    }
  }

  /**
   * Get repository status information
   */
  async getStatus(): Promise<{
    isRepo: boolean;
    isBehind: boolean;
    lastCommit?: string;
    branch?: string;
  }> {
    try {
      const isRepo = await this.git.checkIsRepo();
      if (!isRepo) {
        return { isRepo: false, isBehind: false };
      }

      const isBehind = await this.isBehindRemote();
      const log = await this.git.log({ maxCount: 1 });
      const status = await this.git.status();

      return {
        isRepo: true,
        isBehind,
        lastCommit: log.latest?.hash ?? undefined,
        branch: status.current ?? undefined
      };
    } catch (error) {
      console.error('Error getting repository status:', error);
      return { isRepo: false, isBehind: false };
    }
  }
}

// Export singleton instance
export const gitManager = new GitManager();

// Initialize repository on module load
gitManager.initializeRepository().catch(console.error);
