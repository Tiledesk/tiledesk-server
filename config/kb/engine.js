module.exports = {
    name: process.env.VECTOR_STORE_NAME || 'pinecone',
    type: process.env.INDEX_TYPE || process.env.PINECONE_TYPE || 'serverless',
    apikey: process.env.VECTOR_STORE_APIKEY || '',
    vector_size: Number(process.env.VECTOR_SIZE) || 1536,
    index_name: process.env.INDEX_NAME || process.env.PINECONE_INDEX || 'llm-sample-index',
    host: process.env.VECTOR_STORE_HOST,
    port: process.env.VECTOR_STORE_PORT ? Number(process.env.VECTOR_STORE_PORT) : undefined,
    deployment: process.env.VECTOR_STORE_DEPLOYMENT
  }