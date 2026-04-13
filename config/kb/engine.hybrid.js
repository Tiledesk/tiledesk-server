module.exports = {
    name: process.env.VECTOR_STORE_NAME || 'pinecone',
    type: process.env.INDEX_TYPE_HYBRID || process.env.PINECONE_TYPE_HYBRID || 'serverless',
    apikey: process.env.VECTOR_STORE_APIKEY || '',
    vector_size: Number(process.env.VECTOR_SIZE_HYBRID) || 1536,
    index_name: process.env.INDEX_NAME_HYBRID || process.env.PINECONE_INDEX_HYBRID || 'llm-sample-hybrid-index',
    host: process.env.VECTOR_STORE_HOST,
    port: process.env.VECTOR_STORE_PORT ? Number(process.env.VECTOR_STORE_PORT) : undefined,
    deployment: process.env.VECTOR_STORE_DEPLOYMENT
  }