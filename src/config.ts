import fs from 'fs/promises';
import path from 'path';
import os from 'os';

export const CONFIG_DIR = '.gemini';
export const CONFIG_FILE_NAME = 'llm-council.json';
export const CONFIG_PATH = path.resolve(process.cwd(), CONFIG_DIR, CONFIG_FILE_NAME);

export interface CouncilConfig {
  default_models: string[];
  default_reasoning_effort?: "none" | "low" | "medium" | "high";
}

export interface CouncilStatus {
  models: string[];
  reasoning_effort: string;
  configPath: string;
  exists: boolean;
}

export const AVAILABLE_MODELS = [
  { id: 'openai/gpt-5.2', name: 'GPT-5.2', features: { reasoning: true, caching: true } },
  { id: 'openai/gpt-5.1-codex-max', name: 'GPT-5.1-Codex-Max', features: { caching: true } },
  { id: 'anthropic/claude-opus-4.5', name: 'Claude Opus 4.5', features: { reasoning: true, caching: true } },
  { id: 'anthropic/claude-sonnet-4.5', name: 'Claude Sonnet 4.5', features: { reasoning: true, caching: true } },
  { id: 'google/gemini-3-pro-preview', name: 'Gemini 3 Pro Preview', features: { caching: true } },
  { id: 'google/gemini-3-flash-preview', name: 'Gemini 3 Flash Preview', features: { caching: true } },
  { id: 'deepseek/deepseek-v3.2', name: 'DeepSeek V3.2', features: { reasoning: true, caching: true } },
  { id: 'deepseek/deepseek-v3.2-speciale', name: 'DeepSeek V3.2 Speciale', features: { reasoning: true, caching: true } },
  { id: 'z-ai/glm-4.7', name: 'GLM-4.7', features: {} },
  { id: 'minimax/minimax-m2.1', name: 'Minimax M2.1', features: {} },
  { id: 'moonshotai/kimi-k2-thinking', name: 'Kimi K2 Thinking', features: { reasoning: true, caching: true } }
];

export async function getCouncilConfig(): Promise<CouncilConfig> {
  try {
    const data = await fs.readFile(CONFIG_PATH, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    return { default_models: [], default_reasoning_effort: "none" };
  }
}

export async function getCouncilStatus(): Promise<CouncilStatus> {
  try {
    const data = await fs.readFile(CONFIG_PATH, 'utf-8');
    const config = JSON.parse(data);
    return {
      models: config.default_models || [],
      reasoning_effort: config.default_reasoning_effort || "none",
      configPath: CONFIG_PATH,
      exists: true
    };
  } catch (error) {
    return {
      models: [],
      reasoning_effort: "none",
      configPath: CONFIG_PATH,
      exists: false
    };
  }
}

export async function saveCouncilConfig(models: string[], reasoning_effort?: "none" | "low" | "medium" | "high"): Promise<void> {
  const config: CouncilConfig = { 
    default_models: models,
    default_reasoning_effort: reasoning_effort || "none"
  };
  const dir = path.dirname(CONFIG_PATH);
  
  // Ensure the directory exists
  try {
    await fs.mkdir(dir, { recursive: true });
  } catch (error) {
    // Ignore error if directory already exists
  }
  
  await fs.writeFile(CONFIG_PATH, JSON.stringify(config, null, 2));
}