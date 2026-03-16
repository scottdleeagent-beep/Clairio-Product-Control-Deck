import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().optional(),
  CLICKUP_API_TOKEN: z.string().optional(),
  CLICKUP_WORKSPACE_ID: z.string().optional(),
  CLICKUP_TEAM_ID: z.string().optional(),
  CLICKUP_FOLDER_ID: z.string().optional(),
  CLICKUP_FOLDER_NAME: z.string().optional(),
  CLICKUP_CLIENT_ID: z.string().optional(),
  CLICKUP_CLIENT_SECRET: z.string().optional(),
  CLICKUP_REDIRECT_URI: z.string().optional(),
  NEXTAUTH_URL: z.string().url().optional(),
  NEXTAUTH_SECRET: z.string().optional()
});

export type AppEnv = z.infer<typeof envSchema>;

export function getEnv(): AppEnv {
  return envSchema.parse({
    DATABASE_URL: process.env.DATABASE_URL,
    CLICKUP_API_TOKEN: process.env.CLICKUP_API_TOKEN,
    CLICKUP_WORKSPACE_ID: process.env.CLICKUP_WORKSPACE_ID,
    CLICKUP_TEAM_ID: process.env.CLICKUP_TEAM_ID,
    CLICKUP_FOLDER_ID: process.env.CLICKUP_FOLDER_ID,
    CLICKUP_FOLDER_NAME: process.env.CLICKUP_FOLDER_NAME,
    CLICKUP_CLIENT_ID: process.env.CLICKUP_CLIENT_ID,
    CLICKUP_CLIENT_SECRET: process.env.CLICKUP_CLIENT_SECRET,
    CLICKUP_REDIRECT_URI: process.env.CLICKUP_REDIRECT_URI,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET
  });
}

export function getClickUpOAuthConfig() {
  const env = getEnv();

  return {
    clientId: env.CLICKUP_CLIENT_ID,
    clientSecret: env.CLICKUP_CLIENT_SECRET,
    redirectUri: env.CLICKUP_REDIRECT_URI
  };
}

export function getClickUpScopeConfig() {
  const env = getEnv();

  return {
    workspaceId: env.CLICKUP_WORKSPACE_ID,
    teamId: env.CLICKUP_TEAM_ID ?? env.CLICKUP_WORKSPACE_ID,
    folderId: env.CLICKUP_FOLDER_ID,
    folderName: env.CLICKUP_FOLDER_NAME ?? "Clairio Suite"
  };
}
