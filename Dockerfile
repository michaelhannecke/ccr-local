FROM node:20-alpine

# Claude Code Router installieren
RUN npm install -g @musistudio/claude-code-router@latest

# Config-Verzeichnis vorbereiten
RUN mkdir -p /root/.claude-code-router

# Port exponieren
EXPOSE 3456

# Router starten
CMD ["ccr", "start"]
