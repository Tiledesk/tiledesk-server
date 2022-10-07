module.exports = {
    defaultTTL: Number(process.env.CACHE_DEFAULT_TTL) || 300, //5 minutes   
    queryTTL: Number(process.env.CACHE_QUERY_TTL) || 30,    
    longTTL: Number(process.env.CACHE_LONG_TTL) || 3600,  //1 hour    
  };
  