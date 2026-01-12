# Gemini LLM Council Extension

Consult multiple top-tier LLMs simultaneously with automated peer review and synthesis. Leverage the "Wisdom of the Crowd" to get high-confidence answers for complex architectural and debugging tasks.

Inspired by Andrej Karpathy's [llm-council](https://github.com/karpathy/llm-council).

## Prerequisites

- [Gemini CLI](https://github.com/theerud/gemini-cli) installed.
- An **OpenRouter API Key**.

## Setup

1.  **Link the extension**:
    ```bash
    gemini extensions link .
    ```

2.  **Configure API Key**:
    Use the Gemini CLI to set your OpenRouter API key securely. 
    *(Note: This requires Gemini CLI v0.24.0-preview or later)*
    ```bash
    gemini extensions config gemini-llm-council "OpenRouter API Key"
    ```

3.  **Build the extension**:
    ```bash
    npm install
    npm run build
    ```

4.  **Configure Council Members**:
    Run the setup command in your project workspace.
    ```bash
    /council:setup
    ```
    > **Note**: For the best setup experience (interactive selection), this extension supports the `ask_user_question` tool. This tool is inspired by Claude Code's AskUserQuestion and is available in the [develop branch of this Gemini CLI fork](https://github.com/theerud/gemini-cli/tree/develop). If not available, setup will fall back to a text-based workflow.

## Commands

| Command | Description |
| :--- | :--- |
| `/council:setup` | Select and save your preferred models for the current workspace. |
| `/council:ask` | Consult the Council on a specific query or task. |
| `/council:status` | Show active council members and the configuration file path. |

## Usage

### Workspace Isolation
Configurations are project-specific and stored in `.gemini/llm-council.json` within your project root. This allows you to have a "Fast & Cheap" council for one project and a "God Mode" council for another.

### Ask the Council
```bash
/council:ask "What is the best way to implement a singleton in TypeScript?"
```

### Contextual Review
The Council can review files or research topics if you ask the Chairman to do so.
```bash
/council:ask "Review src/index.ts and suggest improvements."
```
(The Chairman will read the file first, then pass it to the Council).

## Architecture

*   **Drafting Phase**: Selected models provide independent answers.
*   **Peer Review Phase**: Models critique each other's anonymized answers.
*   **Synthesis**: The Gemini CLI Agent (Chairman) synthesizes the drafts and reviews into a final consensus answer, prioritizing catches made during peer review.

## Inspiration

This project was inspired by Andrej Karpathy's [LLM council](https://github.com/karpathy/llm-council) project, as shared in his [Twitter (X) post](https://x.com/karpathy/status/1992381094667411768).

## License

MIT