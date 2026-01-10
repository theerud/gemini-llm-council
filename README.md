# Gemini LLM Council Extension

This extension enables the "LLM Council" workflow in Gemini CLI, allowing you to consult multiple top-tier LLMs simultaneously, with peer review and synthesis.

## Setup

1.  **Link the extension**:
    ```bash
    gemini extensions link .
    ```

2.  **Configure API Key**:
    Copy `.env.example` to `.env` and add your OpenRouter API key.
    ```bash
    cp .env.example .env
    # Edit .env and add OPENROUTER_API_KEY=sk-or-...
    ```

3.  **Configure Council Members**:
    Run the setup command to select your preferred models.
    ```bash
    /council:setup
    ```
    > **Note**: For the best setup experience (interactive selection), this extension supports the `ask_user_question` tool. This tool is inspired by Claude Code's AskUserQuestion and is available in the [develop branch of this Gemini CLI fork](https://github.com/theerud/gemini-cli/tree/develop). If not available, setup will fall back to a text-based workflow.

## Usage

**Ask the Council**:
```bash
/council:ask "What is the best way to implement a singleton in TypeScript?"
```

**Contextual Review**:
The Council can review files or research topics if you ask the Chairman to do so.
```bash
/council:ask "Review src/index.ts and suggest improvements."
```
(The Chairman will read the file first, then pass it to the Council).

## Architecture

*   **Drafting Phase**: Selected models provide independent answers.
*   **Peer Review Phase**: Models critique each other's anonymized answers.
*   **Synthesis**: The Gemini CLI Agent synthesizes the drafts and reviews into a final consensus answer.

## Inspiration

This project was inspired by Andrej Karpathy's [LLM council](https://github.com/karpathy/llm-council) project, as shared in his [Twitter (X) post](https://x.com/karpathy/status/1992381094667411768).
