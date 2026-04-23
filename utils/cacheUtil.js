module.exports = {
    defaultTTL: Number(process.env.CACHE_DEFAULT_TTL) || 600, //10 minutes   
    queryTTL: Number(process.env.CACHE_QUERY_TTL) || 30,     // 30 seconds
    longTTL: Number(process.env.CACHE_LONG_TTL) || 7200 //2 hours     //3600,  //1 hour    
  };
  