import fs from 'fs/promises';
import path from 'path';
import os from 'os';

export const CONFIG_FILE_NAME = 'council.config.json';

// In a real extension, we might want to store this in a user-specific config dir,
// but for this extension, we'll store it in the current working directory or relative to the extension?
// The plan says "council.config.json: JSON store for the user's default model list."
// Usually extensions might want to store config globally.
// However, the prompt implies a file in the project or extension root.
// Given this is a local extension, let's assume it looks in the extension root first.
// But if installed globally, we can't write there easily.
// Let's use the current working directory for now as it's the safest assumption for a project-specific tool,
// OR use the user's home directory if we want global config.
// The plan says `council.config.json` is a file to create/modify in the file list, which implies it's in the repo.
// So I will read/write to the current working directory.

export const CONFIG_PATH = path.resolve(process.cwd(), CONFIG_FILE_NAME);

export interface CouncilConfig {
  default_models: string[];
}

export const AVAILABLE_MODELS = [
  { id: 'openai/gpt-5.2', name: 'GPT-5.2' },
  { id: 'openai/gpt-5.1-codex-max', name: 'GPT-5.1-Codex-Max' },
  { id: 'anthropic/claude-opus-4.5', name: 'Claude Opus 4.5' },
  { id: 'anthropic/claude-sonnet-4.5', name: 'Claude Sonnet 4.5' },
  { id: 'google/gemini-3-pro-preview', name: 'Gemini 3 Pro Preview' },
  { id: 'google/gemini-3-flash-preview', name: 'Gemini 3 Flash Preview' },
  { id: 'deepseek/deepseek-v3.2', name: 'DeepSeek V3.2' },
  { id: 'deepseek/deepseek-v3.2-speciale', name: 'DeepSeek V3.2 Speciale' },
  { id: 'z-ai/glm-4.7', name: 'GLM-4.7' },
  { id: 'minimax/minimax-m2.1', name: 'Minimax M2.1' },
  { id: 'moonshotai/kimi-k2-thinking', name: 'Kimi K2 Thinking' }
];

export async function getCouncilConfig(): Promise<CouncilConfig> {
  try {
    const data = await fs.readFile(CONFIG_PATH, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    // Return default if file doesn't exist
    return { default_models: [] };
  }
}

export async function saveCouncilConfig(models: string[]): Promise<void> {
  const config: CouncilConfig = { default_models: models };
  await fs.writeFile(CONFIG_PATH, JSON.stringify(config, null, 2));
}
