import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { scriptManager } from "~/server/lib/scripts";
import { gitManager } from "~/server/lib/git";
import { githubService } from "~/server/services/github";
import { localScriptsService } from "~/server/services/localScripts";
import { scriptDownloaderService } from "~/server/services/scriptDownloader";

export const scriptsRouter = createTRPCRouter({
  // Get all available scripts
  getScripts: publicProcedure
    .query(async () => {
      const scripts = await scriptManager.getScripts();
      return {
        scripts,
        directoryInfo: scriptManager.getScriptsDirectoryInfo()
      };
    }),

  // Get repository status
  getRepoStatus: publicProcedure
    .query(async () => {
      const status = await gitManager.getStatus();
      return status;
    }),

  // Update repository
  updateRepo: publicProcedure
    .mutation(async () => {
      const result = await gitManager.pullUpdates();
      return result;
    }),

  // Get script content
  getScriptContent: publicProcedure
    .input(z.object({ scriptPath: z.string() }))
    .query(async ({ input }) => {
      try {
        const content = await scriptManager.getScriptContent(input.scriptPath);
        return { success: true, content };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    }),

  // Validate script path
  validateScript: publicProcedure
    .input(z.object({ scriptPath: z.string() }))
    .query(async ({ input }) => {
      const validation = scriptManager.validateScriptPath(input.scriptPath);
      return validation;
    }),

  // Get directory information
  getDirectoryInfo: publicProcedure
    .query(async () => {
      return scriptManager.getScriptsDirectoryInfo();
    }),

  // Local script routes (using scripts/json directory)
  // Get all script cards from local directory
  getScriptCards: publicProcedure
    .query(async () => {
      try {
        const cards = await localScriptsService.getScriptCards();
        return { success: true, cards };
      } catch (error) {
        console.error('Error in getScriptCards:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to fetch script cards',
          cards: []
        };
      }
    }),

  // Get all scripts from local directory
  getAllScripts: publicProcedure
    .query(async () => {
      try {
        const scripts = await localScriptsService.getAllScripts();
        return { success: true, scripts };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to fetch scripts',
          scripts: []
        };
      }
    }),

  // Get script by slug from local directory
  getScriptBySlug: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ input }) => {
      try {
        const script = await localScriptsService.getScriptBySlug(input.slug);
        if (!script) {
          return {
            success: false,
            error: 'Script not found',
            script: null
          };
        }
        return { success: true, script };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to fetch script',
          script: null
        };
      }
    }),

  // Resync scripts from GitHub repo to local directory
  resyncScripts: publicProcedure
    .mutation(async () => {
      try {
        // First, try to get scripts from GitHub
        const githubScripts = await githubService.getAllScripts();
        
        // Save scripts to local directory
        await localScriptsService.saveScriptsFromGitHub(githubScripts);
        
        return { 
          success: true, 
          message: `Successfully synced ${githubScripts.length} scripts from GitHub to local directory`,
          count: githubScripts.length
        };
      } catch (error) {
        console.error('Error in resyncScripts:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to resync scripts. Make sure REPO_URL is set.',
          count: 0
        };
      }
    }),

  // Load script files from GitHub
  loadScript: publicProcedure
    .input(z.object({ slug: z.string() }))
    .mutation(async ({ input }) => {
      try {
        // Get the script details
        const script = await localScriptsService.getScriptBySlug(input.slug);
        if (!script) {
          return {
            success: false,
            error: 'Script not found',
            files: []
          };
        }

        // Load the script files
        const result = await scriptDownloaderService.loadScript(script);
        return result;
      } catch (error) {
        console.error('Error in loadScript:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to load script',
          files: []
        };
      }
    }),

  // Check if script files exist locally
  checkScriptFiles: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ input }) => {
      try {
        const script = await localScriptsService.getScriptBySlug(input.slug);
        if (!script) {
          return {
            success: false,
            error: 'Script not found',
            ctExists: false,
            installExists: false,
            files: []
          };
        }

        const result = await scriptDownloaderService.checkScriptExists(script);
        return {
          success: true,
          ...result
        };
      } catch (error) {
        console.error('Error in checkScriptFiles:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to check script files',
          ctExists: false,
          installExists: false,
          files: []
        };
      }
    })
});
