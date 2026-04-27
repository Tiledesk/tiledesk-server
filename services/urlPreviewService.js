const axios = require('axios');
const winston = require('../config/winston');

class UrlPreviewService {

  _extractMeta(html, url) {
    const getMeta = (name) => {
      const m = html.match(new RegExp(`<meta[^>]+(?:name|property)=["']${name}["'][^>]+content=["']([^"']+)["']`, 'i'))
               || html.match(new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+(?:name|property)=["']${name}["']`, 'i'));
      return m ? m[1] : null;
    };
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    return {
      url,
      title:              getMeta('og:title') || (titleMatch && titleMatch[1].trim()) || null,
      description:        getMeta('og:description') || getMeta('description') || null,
      image:              getMeta('og:image') || getMeta('twitter:image') || null,
      siteName:           getMeta('og:site_name') || null,
      type:               getMeta('og:type') || null,
      locale:             getMeta('og:locale') || null,
      author:             getMeta('author') || getMeta('article:author') || null,
      keywords:           getMeta('keywords') || null,
      twitterCard:        getMeta('twitter:card') || null,
      twitterTitle:       getMeta('twitter:title') || null,
      twitterDescription: getMeta('twitter:description') || null,
      twitterImage:       getMeta('twitter:image') || null,
    };
  }

  async fetchPagePreview(url) {
    const response = await axios.get(url, {
      timeout: 10000,
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; TiledeskBot/1.0)' },
      maxContentLength: 2000000,
    });
    return this._extractMeta(response.data, url);
  }

  async fetchPagesPreviews(urls) {
    const results = await Promise.allSettled(urls.map(url => this.fetchPagePreview(url)));
    return results.map((result, i) => {
      if (result.status === 'fulfilled') {
        return { url: urls[i], success: true, data: result.value };
      }
      return { url: urls[i], success: false, error: result.reason?.message || 'Failed to fetch' };
    });
  }
}

module.exports = new UrlPreviewService();
