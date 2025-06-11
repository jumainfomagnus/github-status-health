/**
 * rssReader.js
 * A module for fetching and parsing RSS feeds with caching capability
 */

const axios = require('axios');
const xml2js = require('xml2js');

/**
 * RssReader class for fetching and parsing RSS feeds
 */
class RssReader {
  /**
   * Create a new RssReader instance
   * @param {Object} options - Configuration options
   * @param {number} options.timeout - Request timeout in milliseconds (default: 5000)
   * @param {number} options.cacheTTL - Cache time-to-live in milliseconds (default: 5 minutes)
   */
  constructor(options = {}) {
    this.options = {
      timeout: options.timeout || 5000,
      cacheTTL: options.cacheTTL || 5 * 60 * 1000 // 5 minutes default
    };
    
    this.parser = new xml2js.Parser({
      explicitArray: false,
      trim: true
    });
    
    // Initialize cache
    this.cache = new Map();
  }

  /**
   * Get a single RSS feed by URL
   * @param {string} url - The RSS feed URL
   * @returns {Promise<Object>} - Parsed feed object
   * @throws {Error} - If fetch or parse fails
   */
  async getFeed(url) {
    // Check cache first
    const cachedFeed = this.getCachedFeed(url);
    if (cachedFeed) {
      return cachedFeed;
    }

    try {
      // Fetch the feed
      const response = await axios.get(url, {
        timeout: this.options.timeout,
        responseType: 'text'
      });
      
      // Parse XML to JS object
      const parsedFeed = await this.parseFeed(response.data);
      
      // Store in cache
      this.cacheFeed(url, parsedFeed);
      
      return parsedFeed;
    } catch (error) {
      if (error.code === 'ECONNABORTED') {
        throw new Error(`Feed request timeout: ${url}`);
      } else if (error.response) {
        throw new Error(`Failed to fetch feed (${error.response.status}): ${url}`);
      } else {
        throw new Error(`Error fetching or parsing feed: ${error.message}`);
      }
    }
  }

  /**
   * Get multiple RSS feeds by URLs
   * @param {string[]} urls - Array of RSS feed URLs
   * @returns {Promise<Object[]>} - Array of parsed feed objects
   */
  async getFeeds(urls) {
    return Promise.all(urls.map(url => this.getFeed(url)))
      .catch(error => {
        throw new Error(`Failed to fetch multiple feeds: ${error.message}`);
      });
  }

  /**
   * Parse XML feed data into a usable format
   * @param {string} xmlData - Raw XML feed data
   * @returns {Promise<Object>} - Parsed feed object
   * @throws {Error} - If parsing fails
   */
  async parseFeed(xmlData) {
    try {
      const result = await this.parser.parseStringPromise(xmlData);
      
      // Transform into a more usable format
      if (!result.rss || !result.rss.channel) {
        throw new Error('Invalid RSS format');
      }
      
      const channel = result.rss.channel;
      
      // Normalize items to always be an array
      const items = channel.item 
        ? (Array.isArray(channel.item) ? channel.item : [channel.item]) 
        : [];
      
      return {
        title: channel.title || '',
        link: channel.link || '',
        description: channel.description || '',
        lastBuildDate: channel.lastBuildDate || '',
        items: items.map(item => ({
          title: item.title || '',
          link: item.link || '',
          pubDate: item.pubDate || '',
          description: item.description || '',
          guid: item.guid || ''
        }))
      };
    } catch (error) {
      throw new Error(`Failed to parse XML: ${error.message}`);
    }
  }

  /**
   * Get a feed from cache if available and not expired
   * @param {string} url - The feed URL to check in cache
   * @returns {Object|null} - Cached feed or null if not found/expired
   * @private
   */
  getCachedFeed(url) {
    if (!this.cache.has(url)) {
      return null;
    }
    
    const { timestamp, data } = this.cache.get(url);
    const now = Date.now();
    
    // Check if cache has expired
    if (now - timestamp > this.options.cacheTTL) {
      this.cache.delete(url);
      return null;
    }
    
    return data;
  }

  /**
   * Store a feed in cache
   * @param {string} url - The feed URL
   * @param {Object} data - The parsed feed data
   * @private
   */
  cacheFeed(url, data) {
    this.cache.set(url, {
      timestamp: Date.now(),
      data
    });
  }

  /**
   * Clear the entire cache or for a specific URL
   * @param {string} [url] - Optional URL to clear from cache
   */
  clearCache(url) {
    if (url) {
      this.cache.delete(url);
    } else {
      this.cache.clear();
    }
  }

  /**
   * Refresh all cached feeds or a specific URL
   * @param {string} [url] - Optional URL to refresh
   * @returns {Promise<void>}
   */
  async refreshCache(url) {
    if (url) {
      // Refresh specific URL if it's in cache
      if (this.cache.has(url)) {
        this.cache.delete(url);
        await this.getFeed(url);
      }
    } else {
      // Refresh all URLs in cache
      const urls = Array.from(this.cache.keys());
      this.cache.clear();
      
      for (const feedUrl of urls) {
        try {
          await this.getFeed(feedUrl);
        } catch (error) {
          console.error(`Failed to refresh feed ${feedUrl}:`, error.message);
        }
      }
    }
  }
}

module.exports = RssReader;