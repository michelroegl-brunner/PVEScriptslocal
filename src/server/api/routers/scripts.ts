import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { scriptManager } from "~/server/lib/scripts";
import { gitManager } from "~/server/lib/git";
import { githubService } from "~/server/services/github";

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

  // GitHub-based script routes
  // Get all script cards from GitHub repo
  getScriptCards: publicProcedure
    .query(async () => {
      try {
        const cards = await githubService.getScriptCards();
        return { success: true, cards };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to fetch script cards',
          cards: []
        };
      }
    }),

  // Get all scripts from GitHub repo
  getAllScripts: publicProcedure
    .query(async () => {
      try {
        const scripts = await githubService.getAllScripts();
        return { success: true, scripts };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to fetch scripts',
          scripts: []
        };
      }
    }),

  // Get script by slug from GitHub repo
  getScriptBySlug: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ input }) => {
      try {
        const script = await githubService.getScriptBySlug(input.slug);
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

  // Resync scripts from GitHub repo
  resyncScripts: publicProcedure
    .mutation(async () => {
      try {
        const scripts = await githubService.getAllScripts();
        return { 
          success: true, 
          message: `Successfully synced ${scripts.length} scripts`,
          count: scripts.length
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to resync scripts',
          count: 0
        };
      }
    })
});
