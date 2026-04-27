const axios = require('axios');
const winston = require('../config/winston');
const Integration = require('../models/integrations');

const GOOGLE_SEARCH_BASE = 'https://www.googleapis.com/customsearch/v1';

class UrlPreviewService {

  async getCredentials(id_project) {
    const integration = await Integration.findOne({ id_project, name: 'google_search' });
    if (!integration?.value?.apikey || !integration?.value?.cx) {
      throw { code: 404, error: 'Google Search integration not configured for this project' };
    }
    return { apikey: integration.value.apikey, cx: integration.value.cx };
  }

  async fetchPagePreview(id_project, url) {
    const { apikey, cx } = await this.getCredentials(id_project);

    const response = await axios.get(GOOGLE_SEARCH_BASE, {
      params: { key: apikey, cx, q: url, num: 1 },
      timeout: 15000
    });

    const items = response.data?.items;
    if (!items?.length) {
      throw { code: 404, error: 'No results found for the given URL' };
    }

    const item = items[0];
    const pagemap = item.pagemap || {};
    const metatags = pagemap.metatags?.[0] || {};
    const cseImage = pagemap.cse_image?.[0];
    const cseThumb = pagemap.cse_thumbnail?.[0];

    return {
      url,
      title:              item.title,
      link:               item.link,
      snippet:            item.snippet,
      description:        metatags['og:description'] || metatags['description'] || item.snippet,
      image:              metatags['og:image'] || cseImage?.src || cseThumb?.src || null,
      siteName:           metatags['og:site_name'] || null,
      type:               metatags['og:type'] || null,
      locale:             metatags['og:locale'] || null,
      author:             metatags['author'] || metatags['article:author'] || null,
      keywords:           metatags['keywords'] || null,
      twitterCard:        metatags['twitter:card'] || null,
      twitterTitle:       metatags['twitter:title'] || null,
      twitterDescription: metatags['twitter:description'] || null,
      twitterImage:       metatags['twitter:image'] || null,
      pagemap
    };
  }
}

const urlPreviewService = new UrlPreviewService();
module.exports = urlPreviewService;
