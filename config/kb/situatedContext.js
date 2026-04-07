module.exports = {
    enable: process.env.SITUATED_CONTEXT_ENABLE === "true",
    provider: process.env.SITUATED_CONTEXT_PROVIDER || "openai",
    model: process.env.SITUATED_CONTEXT_MODEL || "gpt-4o",
    api_key: ""
}