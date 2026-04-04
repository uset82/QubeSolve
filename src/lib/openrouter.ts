import "server-only";

import { OpenRouter } from "@openrouter/sdk";

export const DEFAULT_OPENROUTER_MODEL = "qwen/qwen3.6-plus:free";

let client: OpenRouter | null = null;

function getRequiredEnv(name: string): string {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

export function getOpenRouterModel(): string {
  return process.env.OPENROUTER_MODEL?.trim() || DEFAULT_OPENROUTER_MODEL;
}

export function getOpenRouterClient(): OpenRouter {
  if (client) {
    return client;
  }

  client = new OpenRouter({
    apiKey: getRequiredEnv("OPENROUTER_API_KEY"),
    appTitle: process.env.OPENROUTER_APP_NAME?.trim() || "QubeSolve",
    httpReferer: process.env.OPENROUTER_SITE_URL?.trim(),
    timeoutMs: 30000,
  });

  return client;
}
