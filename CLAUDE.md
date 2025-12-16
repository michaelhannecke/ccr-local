# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

This is a **documentation-only repository** containing setup instructions for running Claude Code with local LLMs via Ollama. There is no application code - only the README.md which serves as a setup guide.

## Purpose

The documentation describes how to:
- Run Claude Code against locally-hosted LLMs (Ollama) instead of Anthropic's API
- Use a Docker-isolated Claude Code Router as an API proxy
- Transform Anthropic API calls to OpenAI-compatible format for Ollama

## Architecture

```
Claude Code (Mac) → Docker Container (Claude Code Router :3456) → Ollama (Mac :11434)
```

## Key Configuration Values

| Setting | Value |
|---------|-------|
| Router Port | 3456 |
| Ollama Port | 11434 |
| Recommended Model | qwen3-coder:30b-a3b |

## When Editing This Repository

- The README.md is written in German
- All code blocks in the README are example configurations (Dockerfile, docker-compose.yml, config.json), not actual files in the repo
- Maintain consistency with the existing table formatting and architecture diagram style
