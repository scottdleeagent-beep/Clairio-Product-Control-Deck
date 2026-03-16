import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  CLICKUP_API_TOKEN: z.string().min(1, "CLICKUP_API_TOKEN is required"),
  CLICKUP_WORKSPACE_ID: z.string().min(1, "CLICKUP_WORKSPACE_ID is required"),
  CLICKUP_TEAM_ID: z.string().optional(),
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
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET
  });
}

