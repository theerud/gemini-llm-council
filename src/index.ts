import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import axios from "axios";
import * as dotenv from "dotenv";
import { AVAILABLE_MODELS, getCouncilConfig, getCouncilStatus, saveCouncilConfig } from "./config.js";
import { DRAFTING_PROMPT, REVIEW_PROMPT, SYNTHESIS_PROMPT } from "./prompts.js";

dotenv.config();

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

if (!OPENROUTER_API_KEY) {
  console.warn("Warning: OPENROUTER_API_KEY is not set in .env file.");
}

const server = new McpServer({
  name: "gemini-llm-council",
  version: "0.1.0",
});

async function callLLM(model: string, messages: any[]) {
  try {
    const response = await axios.post(
      OPENROUTER_URL,
      {
        model: model,
        messages: messages,
      },
      {
        headers: {
          "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://geminicli.com", 
          "X-Title": "Gemini CLI Council Extension",
        },
      }
    );
    const data = response.data as any;
    return data.choices[0].message.content;
  } catch (error: any) {
    let errorMessage = error.message;
    if ((axios as any).isAxiosError?.(error) || error.isAxiosError) {
      if (error.response) {
        const status = error.response.status;
        if (status === 401) {
          errorMessage = "401 Unauthorized (Invalid API Key)";
        } else if (status === 402) {
          errorMessage = "402 Payment Required (Insufficient Credits)";
        } else if (status === 429) {
          errorMessage = "429 Too Many Requests (Rate Limit Exceeded)";
        } else {
          errorMessage = `${status} ${error.response.statusText}`;
        }
      }
    }
    return `[Error calling ${model}: ${errorMessage}]`;
  }
}

server.tool(
  "list_available_models",
  "List all available model IDs and names supported by the council via OpenRouter.",
  {},
  async () => {
    return {
      content: [{ type: "text", text: JSON.stringify(AVAILABLE_MODELS, null, 2) }],
    };
  }
);

server.tool(
  "consult_council",
  "Engage the LLM Council to answer a query using the 2-phase Drafting and Peer Review process.",
  {
    query: z.string().describe("The user's query to the council."),
    context: z.string().optional().describe("Additional context (file contents, search results) gathered by the Chairman."),
    models: z.array(z.string()).optional().describe("Specific models to consult. If omitted, uses defaults."),
  },
  async ({ query, context, models }) => {
    // 1. Check API Key
    if (!OPENROUTER_API_KEY) {
      return {
        content: [{ type: "text", text: JSON.stringify({
          error: "MISSING_KEY",
          message: "OpenRouter API Key is missing. Please check your .env file."
        }) }],
        isError: true,
      };
    }

    let selectedModels = models;

    // 2. Resolve Config
    if (!selectedModels || selectedModels.length === 0) {
      const config = await getCouncilConfig();
      selectedModels = config.default_models;
    }

    // 3. Strict No-Config Error
    if (!selectedModels || selectedModels.length === 0) {
      return {
        content: [{ type: "text", text: JSON.stringify({
          error: "NO_CONFIG",
          message: "Council members are not configured. Please run /council:setup."
        }) }],
        isError: true,
      };
    }

    // Phase 1: Drafting
    const draftingMessages = [
      { role: "system", content: DRAFTING_PROMPT },
      { role: "user", content: `Query: ${query}\n\nContext:\n${context || "None"}` },
    ];

    const draftPromises = selectedModels.map(async (model) => {
      const answer = await callLLM(model, draftingMessages);
      return { model, answer };
    });

    const drafts = await Promise.all(draftPromises);

    // Prepare Review Packet (Anonymized)
    let reviewPacket = "Here are the answers from other council members:\n\n";
    drafts.forEach((draft, index) => {
      reviewPacket += `--- Answer ${index + 1} ---\n${draft.answer}\n\n`;
    });

    // Phase 2: Peer Review
    const reviewPromises = selectedModels.map(async (model) => {
      const reviewMessages = [
        { role: "system", content: REVIEW_PROMPT },
        { role: "user", content: `Query: ${query}\n\n${reviewPacket}` },
      ];
      const critique = await callLLM(model, reviewMessages);
      return { model, critique };
    });

    const reviews = await Promise.all(reviewPromises);

    // Format Output
    const output = {
      drafts,
      reviews,
      synthesis_instructions: SYNTHESIS_PROMPT,
    };

    return {
      content: [{ type: "text", text: JSON.stringify(output, null, 2) }],
    };
  }
);

server.tool(
  "save_council_config",
  "Save the default list of model IDs for the council to a configuration file.",
  {
    models: z.array(z.string()).describe("The list of models to save as defaults."),
  },
  async ({ models }) => {
    await saveCouncilConfig(models);
    let message = `Configuration saved. Default models: ${models.join(", ")}`;
    if (models.length > 5) {
      message += "\n\nWarning: You have selected more than 5 models. This may result in higher latency and increased API costs.";
    }
    return {
      content: [{ type: "text", text: message }],
    };
  }
);

server.tool(
  "get_council_status",
  "Get the current council configuration status, including active models and the file path of the config file.",
  {},
  async () => {
    const status = await getCouncilStatus();
    return {
      content: [{ type: "text", text: JSON.stringify(status) }],
    };
  }
);

server.tool(
  "get_council_config",
  "Get the current council configuration (list of active models).",
  {},
  async () => {
    const config = await getCouncilConfig();
    return {
      content: [{ type: "text", text: JSON.stringify(config) }],
    };
  }
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Gemini LLM Council MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});