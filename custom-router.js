// Custom router to strip thinking parameters for Ollama
module.exports = {
  transformRequest: (request, provider) => {
    // Remove thinking-related parameters
    if (request.thinking) {
      delete request.thinking;
    }
    if (request.extended_thinking) {
      delete request.extended_thinking;
    }
    if (request.thinking_budget) {
      delete request.thinking_budget;
    }
    // Remove from metadata if present
    if (request.metadata && request.metadata.thinking) {
      delete request.metadata.thinking;
    }
    return request;
  }
};
