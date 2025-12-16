# Claude Code Router for Local LLMs

[![Docker](https://img.shields.io/badge/Docker-Required-2496ED?logo=docker&logoColor=white)](https://www.docker.com/)
[![Ollama](https://img.shields.io/badge/Ollama-Compatible-black?logo=ollama)](https://ollama.ai/)
[![macOS](https://img.shields.io/badge/macOS-Apple%20Silicon-000000?logo=apple)](https://www.apple.com/macos/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

Run [Claude Code](https://claude.ai/code) with locally hosted LLMs via Ollama. The routing proxy runs in a Docker container for security isolation, transforming Anthropic API calls to OpenAI-compatible format.

---

## Table of Contents

- [Features](#features)
- [Architecture](#architecture)
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Installation](#installation)
  - [Install Claude Code](#step-1-install-claude-code)
  - [Install and Configure Ollama](#step-2-install-and-configure-ollama)
  - [Set Up the Docker Router](#step-3-set-up-the-docker-router)
  - [Configure Claude Code](#step-4-configure-claude-code)
- [Usage](#usage)
- [Configuration](#configuration)
- [Model Recommendations](#model-recommendations)
- [Security](#security)
- [Troubleshooting](#troubleshooting)
- [Performance Tuning](#performance-tuning)
- [Resources](#resources)
- [Contributing](#contributing)
- [License](#license)

---

## Features

- **Local LLM Inference** - Run Claude Code against Ollama models with native Metal GPU acceleration
- **Docker Isolation** - Secure API proxy running in an isolated container
- **No Cloud Traffic** - All LLM traffic stays on your local machine
- **Flexible Model Routing** - Configure different models for default, thinking, and background tasks
- **Easy Configuration** - Simple JSON-based configuration for models and providers

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│  Mac Host (Apple Silicon)                                       │
│                                                                 │
│  ┌──────────────┐         ┌───────────────────────────────────┐│
│  │ Claude Code  │────────▶│ Docker Container                  ││
│  │ (global npm) │  :3456  │ ┌───────────────────────────────┐ ││
│  └──────────────┘         │ │ Claude Code Router            │ ││
│        │                  │ │ - Request transformation      │ ││
│        │                  │ │ - Model routing               │ ││
│        │                  │ │ - Logging                     │ ││
│        │                  │ └───────────────────────────────┘ ││
│        │                  └──────────────┬────────────────────┘│
│        │                                 │                      │
│        │                                 │ host.docker.internal │
│        │                                 ▼ :11434               │
│        │                  ┌───────────────────────────────────┐│
│        │                  │ Ollama                            ││
│        │                  │ - Native Metal GPU Support        ││
│        │                  │ - OpenAI-compatible API           ││
│        │                  │ - Model: e.g. qwen3-coder         ││
│        ▼                  └───────────────────────────────────┘│
│  ┌──────────────┐                                               │
│  │ Working      │                                               │
│  │ Directory    │                                               │
│  └──────────────┘                                               │
└─────────────────────────────────────────────────────────────────┘
```

| Component | Location | Function |
|-----------|----------|----------|
| Claude Code | Mac Host (global) | Agentic coding CLI, interacts with codebase |
| Claude Code Router | Docker Container | API proxy, transforms Anthropic API to OpenAI format |
| Ollama | Mac Host | Local LLM inference with native Metal acceleration |

---

## Prerequisites

- **macOS** with Apple Silicon (M1/M2/M3/M4)
- **Docker Desktop** for Mac
- **Node.js** 18+
- **Ollama** ([ollama.ai](https://ollama.ai))
- A code-optimized model (recommended: `qwen3-coder`)

---

## Quick Start

```bash
# 1. Clone this repository
git clone https://github.com/your-username/ccr-local.git
cd ccr-local

# 2. Start Ollama with network access
export OLLAMA_HOST=0.0.0.0
ollama serve

# 3. Pull a code model
ollama pull qwen3-coder:30b-a3b

# 4. Create your config from the example and customize it
cp config.example.json config.json
# Edit config.json with your models (check available with: ollama list)

# 5. Start the Docker container
docker compose up -d --build

# 6. Set environment variables (add to ~/.zshrc for persistence)
export ANTHROPIC_BASE_URL=http://127.0.0.1:3456
export ANTHROPIC_AUTH_TOKEN=ccr-local-secret-change-me
export DISABLE_PROMPT_CACHING=1
export DISABLE_INTERLEAVED_THINKING=1
export CLAUDE_CODE_DISABLE_EXTENDED_THINKING=1

# 7. Run Claude Code in any project
cd /path/to/your/project
claude
```

---

## Installation

### Step 1: Install Claude Code

```bash
npm install -g @anthropic-ai/claude-code
```

Verify the installation:

```bash
claude --version
```

### Step 2: Install and Configure Ollama

#### Install Ollama

```bash
# Via Homebrew
brew install ollama

# Or download from https://ollama.ai
```

#### Download a Code Model

```bash
# Recommended: Qwen3-Coder (best tool-calling support)
ollama pull qwen3-coder:30b-a3b

# Alternative smaller variants
ollama pull qwen3-coder:8b
ollama pull qwen2.5-coder:14b
ollama pull deepseek-coder-v2:16b
```

#### Configure Ollama for Docker Access

Ollama must listen on all interfaces for Docker to reach it:

**Option A: Environment Variable (temporary)**

```bash
export OLLAMA_HOST=0.0.0.0
ollama serve
```

**Option B: Shell Profile (persistent)**

```bash
# Add to ~/.zshrc or ~/.bashrc
echo 'export OLLAMA_HOST=0.0.0.0' >> ~/.zshrc
source ~/.zshrc
ollama serve
```

**Option C: LaunchAgent (persists across reboots)**

```bash
pkill ollama
launchctl setenv OLLAMA_HOST 0.0.0.0
ollama serve
```

#### Verify Ollama

```bash
ollama list
curl http://localhost:11434/v1/models
```

### Step 3: Set Up the Docker Router

#### Configure Your Models

Copy the example config and customize it for your installed Ollama models:

```bash
# Create your local config
cp config.example.json config.json

# Check available models
ollama list

# Edit config.json with your preferred editor
```

Example `config.json`:

```json
{
  "LOG": true,
  "LOG_LEVEL": "info",
  "HOST": "0.0.0.0",
  "APIKEY": "your-secret-api-key-here",
  "API_TIMEOUT_MS": 600000,
  "Providers": [
    {
      "name": "ollama",
      "api_base_url": "http://host.docker.internal:11434/v1/chat/completions",
      "api_key": "ollama",
      "models": [
        "qwen3-coder:30b-a3b",
        "qwen3:8b"
      ]
    }
  ],
  "Router": {
    "default": "ollama,qwen3-coder:30b-a3b",
    "think": "",
    "background": "ollama,qwen3:8b"
  }
}
```

#### Build and Start

```bash
docker compose up -d --build
```

Verify the container:

```bash
docker ps --filter name=ccr
```

### Step 4: Configure Claude Code

Add to `~/.zshrc` or `~/.bashrc`:

```bash
# Claude Code Local LLM Configuration
export ANTHROPIC_BASE_URL=http://127.0.0.1:3456
export ANTHROPIC_AUTH_TOKEN=ccr-local-secret-change-me
export DISABLE_PROMPT_CACHING=1
export DISABLE_INTERLEAVED_THINKING=1
export CLAUDE_CODE_DISABLE_EXTENDED_THINKING=1
```

Reload your shell:

```bash
source ~/.zshrc
```

### Verify Everything Works

```bash
# Check Ollama
curl http://localhost:11434/v1/models

# Check router health
curl -H "Authorization: Bearer ccr-local-secret-change-me" \
     http://127.0.0.1:3456/health

# Test Docker to Ollama connection
docker exec ccr wget -qO- http://host.docker.internal:11434/v1/models

# Start Claude Code
claude
```

---

## Usage

### Starting a Session

```bash
# Ensure Ollama is running
pgrep ollama || ollama serve

# Ensure the Docker container is running
docker ps --filter name=ccr || docker compose up -d

# Start Claude Code
cd /path/to/your/project
claude
```

### Daily Workflow

```bash
# Start services
ollama serve &
docker compose up -d

# Work with Claude Code
cd ~/projects/my-app
claude

# Stop services (optional)
docker compose down
pkill ollama
```

### Switching Models

Edit `config.json`:

```json
"Router": {
  "default": "ollama,your-preferred-model",
  "think": "",
  "background": "ollama,smaller-faster-model"
}
```

Restart the container:

```bash
docker compose restart
```

### Viewing Logs

```bash
docker logs ccr -f
```

---

## Configuration

### Router Configuration (`config.json`)

> **Note:** Copy `config.example.json` to `config.json` before customizing. The `config.json` file is ignored by git to protect your API keys.

| Field | Description |
|-------|-------------|
| `LOG` | Enable/disable logging |
| `LOG_LEVEL` | Log verbosity: `debug`, `info`, `warn`, `error` |
| `HOST` | Listen address (use `0.0.0.0` for Docker) |
| `APIKEY` | Authentication token (must match `ANTHROPIC_AUTH_TOKEN`) |
| `API_TIMEOUT_MS` | Request timeout in milliseconds |
| `Providers` | Array of LLM provider configurations |
| `Router.default` | Model for standard requests |
| `Router.think` | Model for reasoning tasks (set to `""` for local models) |
| `Router.background` | Model for background/parallel tasks |

### Environment Variables

| Variable | Description |
|----------|-------------|
| `ANTHROPIC_BASE_URL` | Router endpoint (`http://127.0.0.1:3456`) |
| `ANTHROPIC_AUTH_TOKEN` | Must match `APIKEY` in config.json |
| `DISABLE_PROMPT_CACHING` | Required for local models |
| `DISABLE_INTERLEAVED_THINKING` | Required for local models |
| `CLAUDE_CODE_DISABLE_EXTENDED_THINKING` | Required for local models |
| `OLLAMA_HOST` | Ollama listen address (use `0.0.0.0`) |

---

## Model Recommendations

| Model | Size | RAM Required | Use Case |
|-------|------|--------------|----------|
| `qwen3-coder:30b-a3b` | 30B MoE (3B active) | ~18GB | Best quality for tool-calling |
| `qwen3-coder:8b` | 8B | ~6GB | Fast background tasks |
| `qwen2.5-coder:32b` | 32B | ~20GB | Alternative to Qwen3 |
| `qwen2.5-coder:14b` | 14B | ~10GB | Good compromise |
| `deepseek-coder-v2:16b` | 16B | ~12GB | Strong code completion |

### Create a Custom Model

```bash
cat << 'EOF' > Modelfile
FROM qwen3-coder:30b-a3b

PARAMETER temperature 0.7
PARAMETER num_ctx 32768
PARAMETER num_predict -1
EOF

ollama create qwen3-coder-custom -f Modelfile
```

---

## Security

### Architecture Benefits

| Aspect | Description |
|--------|-------------|
| Container Isolation | Router runs isolated, no access to host filesystem |
| Network Segmentation | Only port 3456 exposed on localhost |
| API Key Protection | Config mounted as read-only volume |
| Audit Logging | Logs in separate volume for monitoring |
| No Cloud Traffic | All LLM traffic stays local |

### Recommendations

1. **Change the default API key** - Replace `ccr-local-secret-change-me` with a secure value
2. **Monitor logs** - Check `./logs/` for unusual activity
3. **Keep updated** - Run `docker compose build --pull && docker compose up -d` regularly

---

## Troubleshooting

### Container Cannot Reach Ollama

```bash
# Check if Ollama is running
pgrep -l ollama
curl http://localhost:11434/v1/models

# Check OLLAMA_HOST
echo $OLLAMA_HOST  # Should be 0.0.0.0

# Test from Docker
docker exec ccr wget -qO- http://host.docker.internal:11434/v1/models
```

### Claude Code Won't Connect

```bash
# Check environment variables
echo $ANTHROPIC_BASE_URL
echo $ANTHROPIC_AUTH_TOKEN

# Check router logs
docker logs ccr -f
```

### "Model does not support thinking" Error

Set `think` to empty string in `config.json`:

```json
"Router": {
  "default": "ollama,qwen3-coder:30b-a3b",
  "think": "",
  "background": "ollama,qwen3:8b"
}
```

Then restart: `docker compose restart`

### Model Timeout

```bash
# Check RAM usage
top -l 1 | grep -E "PhysMem|ollama"

# Increase timeout in config.json
"API_TIMEOUT_MS": 900000
```

### Increase Context Limit

```bash
# At runtime
ollama run qwen3-coder:30b-a3b --num-ctx 32768

# Or in Modelfile
PARAMETER num_ctx 32768
```

---

## Performance Tuning

```bash
# Optimize GPU usage
export OLLAMA_GPU_LAYERS=999

# Run multiple models
export OLLAMA_MAX_LOADED_MODELS=2

# Keep model in RAM longer
export OLLAMA_KEEP_ALIVE=30m

ollama serve
```

---

## Known Limitations

- **No Extended Thinking** - Local models don't support Claude's Extended Thinking feature
- **Context Limits** - Ollama default is 2048 tokens; must be explicitly increased
- **Tool-Calling Quality** - Success rate for multi-step workflows is lower than Claude Opus
- **Cold Start** - First model load takes longer, then cached in RAM

---

## Resources

- [Claude Code Router](https://github.com/musistudio/claude-code-router) - API transformation proxy
- [Ollama Documentation](https://github.com/ollama/ollama/blob/main/docs/api.md) - API reference
- [Ollama OpenAI Compatibility](https://github.com/ollama/ollama/blob/main/docs/openai.md) - OpenAI-compatible endpoints
- [Qwen3-Coder](https://github.com/QwenLM/Qwen3-Coder) - Recommended model

---

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

<p align="center">
  <i>Tested with macOS Sonoma, Docker Desktop 4.x, Ollama 0.5.x, Claude Code Router 1.0.x</i>
</p>
