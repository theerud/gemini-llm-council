import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import axios from "axios";
import * as dotenv from "dotenv";
import { getCouncilConfig, saveCouncilConfig } from "./config.js";
import { DRAFTING_PROMPT, REVIEW_PROMPT } from "./prompts.js";

dotenv.config();

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

if (!OPENROUTER_API_KEY) {
  console.warn("Warning: OPENROUTER_API_KEY is not set in .env file.");
}

const server = new McpServer({
  name: "gemini-llm-council",
  version: "1.0.0",
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
    console.error(`Error calling model ${model}:`, error.response?.data || error.message);
    return `[Error calling ${model}: ${error.message}]`;
  }
}

server.tool(
  "consult_council",
  {
    query: z.string().describe("The user's query to the council."),
    context: z.string().optional().describe("Additional context (file contents, search results) gathered by the Chairman."),
    models: z.array(z.string()).optional().describe("Specific models to consult. If omitted, uses defaults."),
  },
  async ({ query, context, models }) => {
    let selectedModels = models;

    if (!selectedModels || selectedModels.length === 0) {
      const config = await getCouncilConfig();
      selectedModels = config.default_models;
    }

    if (!selectedModels || selectedModels.length === 0) {
      return {
        content: [{ type: "text", text: "No council members selected. Please run /council:setup or provide models." }],
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
      reviewPacket += `--- Answer ${index + 1} ---
${draft.answer}\n\n`;
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
    };

    return {
      content: [{ type: "text", text: JSON.stringify(output, null, 2) }],
    };
  }
);

server.tool(
  "save_council_config",
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
  "get_council_config",
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
