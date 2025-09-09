import { simpleGit, SimpleGit } from 'simple-git';
import { env } from '~/env.js';
import { join } from 'path';

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
      if (!env.REPO_URL) {
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
      if (!env.REPO_URL) {
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
   * Clone the repository if it doesn't exist
   */
  private async cloneRepository(): Promise<{ success: boolean; message: string }> {
    try {
      if (!env.REPO_URL) {
        return { success: false, message: 'No repository URL configured' };
      }

      console.log(`Cloning repository from ${env.REPO_URL}...`);
      
      // Clone the repository
      await this.git.clone(env.REPO_URL, this.repoPath, {
        '--branch': env.REPO_BRANCH,
        '--single-branch': true,
        '--depth': 1
      });

      return {
        success: true,
        message: `Successfully cloned repository from ${env.REPO_URL}`
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
      if (!env.REPO_URL) {
        console.log('No remote repository configured, skipping initialization');
        return;
      }

      const isRepo = await this.git.checkIsRepo();
      if (!isRepo) {
        console.log('Repository not found, cloning...');
        const result = await this.cloneRepository();
        if (result.success) {
          console.log('Repository initialized successfully');
        } else {
          console.error('Failed to initialize repository:', result.message);
        }
      } else {
        console.log('Repository already exists, checking for updates...');
        const behind = await this.isBehindRemote();
        if (behind) {
          console.log('Repository is behind remote, pulling updates...');
          const result = await this.pullUpdates();
          if (result.success) {
            console.log('Repository updated successfully');
          } else {
            console.error('Failed to update repository:', result.message);
          }
        } else {
          console.log('Repository is up to date');
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
        lastCommit: log.latest?.hash,
        branch: status.current
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
