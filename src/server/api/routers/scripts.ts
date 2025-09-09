import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { scriptManager } from "~/server/lib/scripts";
import { gitManager } from "~/server/lib/git";

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
    })
});
