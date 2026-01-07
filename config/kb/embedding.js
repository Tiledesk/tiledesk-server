module.exports = {
    provider: process.env.EMBEDDINGS_PROVIDER || "openai",
    name: process.env.EMBEDDINGS_NAME || "text-embedding-ada-002",
    api_key: "",
    dimension: Number(process.env.EMBEDDINGS_DIMENSION) || 1536,
    url: process.env.EMBEDDINGS_URL
}