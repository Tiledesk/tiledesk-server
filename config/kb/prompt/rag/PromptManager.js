const fs = require('fs');
const path = require('path');

const modelMap = {
    "gpt-3.5-turbo":        "gpt-3.5.txt",
    "gpt-4":                "gpt-4.txt",
    "gpt-4-turbo-preview":  "gpt-4.txt",
    "gpt-4o":               "gpt-4o.txt",
    "gpt-4o-mini":          "gpt-4o.txt",
    "gpt-4.1":              "gpt-4.1.txt",
    "gpt-4.1-mini":         "gpt-4.1.txt",
    "gpt-4.1-nano":         "gpt-4.1.txt",
    "gpt-5":                "gpt-5.txt",
    "gpt-5-mini":           "gpt-5.txt",
    "gpt-5-nano":           "gpt-5.txt",
    "gpt-5.1":              "gpt-5.x.txt",
    "gpt-5.2":              "gpt-5.x.txt",
    "gpt-5.3-chat-latest":  "gpt-5.x.txt",
    "gpt-5.4":              "gpt-5.x.txt",
    "gpt-5.4-mini":         "gpt-5.x.txt",
    "gpt-5.4-nano":         "gpt-5.x.txt",
    "general":              "general.txt"
}


class PromptManager {
  
    constructor(basePath) {
    this.basePath = basePath;
    this.cache = new Map();
  }

  getPrompt(name) {
    if (this.cache.has(name)) {
      return this.cache.get(name);
    }

    const fileName = modelMap[name] || modelMap["general"];
    const filePath = path.join(this.basePath, fileName);

    let content;
    try {
      content = fs.readFileSync(filePath, 'utf-8');
    } catch (err) {
      content = fs.readFileSync(
        path.join(this.basePath, modelMap["general"]),
        'utf-8'
      );
    }

    this.cache.set(name, content);
    return content;
  }
}

PromptManager.modelMap = modelMap;
module.exports = PromptManager;