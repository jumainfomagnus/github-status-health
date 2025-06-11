/**
 * rssServer.js
 * Express server that displays GitHub RSS health/status feeds
 */

require('dotenv').config();
const express = require('express');
const path = require('path');
const morgan = require('morgan');
const RssReader = require('./rssReader');

// Initialize express app
const app = express();
const port = process.env.PORT || 3000;

// Initialize RSS reader with 5 second timeout and 5 minute cache
const reader = new RssReader({
  timeout: 5000,
  cacheTTL: 5 * 60 * 1000
});

// Configure express
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// Middleware
app.use(express.static(path.join(__dirname, '../public')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev')); // Request logging

/**
 * Helper function to determine status class based on feed item title
 * @param {string} title - The status item title
 * @returns {string} - CSS class name for styling
 */
function getStatusClass(title) {
  const lowerTitle = (title || '').toLowerCase();
  
  if (lowerTitle.includes('operational') || lowerTitle.includes('all systems go')) {
    return 'status-operational';
  } else if (lowerTitle.includes('degraded') || lowerTitle.includes('performance issues')) {
    return 'status-degraded';
  } else if (lowerTitle.includes('outage') || lowerTitle.includes('down') || lowerTitle.includes('unavailable')) {
    return 'status-outage';
  } else if (lowerTitle.includes('maintenance') || lowerTitle.includes('scheduled')) {
    return 'status-maintenance';
  } else {
    return 'status-unknown';
  }
}

// Routes
app.get('/', (req, res) => {
  res.redirect('/status');
});

app.get('/status', async (req, res) => {
  try {
    // Set up the GitHub Status RSS feed URL
    const feedUrl = 'https://www.githubstatus.com/history.rss';
    
    // Fetch the feed
    const feed = await reader.getFeed(feedUrl);
    
    // Render the status page
    res.render('status', {
      feed,
      getStatusClass,
      lastUpdated: new Date().toLocaleString(),
      error: null
    });
  } catch (error) {
    console.error('Error fetching GitHub status:', error.message);
    
    // Render the status page with error
    res.status(500).render('status', {
      feed: null,
      getStatusClass,
      lastUpdated: new Date().toLocaleString(),
      error: 'Failed to fetch GitHub status feed'
    });
  }
});

// Advanced: Get multiple feeds (GitHub, GitHub Pages, etc.)
app.get('/all-status', async (req, res) => {
  try {
    const urls = [
      'https://www.githubstatus.com/history.rss',
      'https://www.githubstatus.com/history.atom' // Another feed as an example
    ];
    
    const feeds = await reader.getFeeds(urls);
    
    res.render('all-status', {
      feeds,
      getStatusClass,
      lastUpdated: new Date().toLocaleString(),
      error: null
    });
  } catch (error) {
    console.error('Error fetching multiple status feeds:', error.message);
    
    res.status(500).render('all-status', {
      feeds: null,
      getStatusClass,
      lastUpdated: new Date().toLocaleString(),
      error: 'Failed to fetch status feeds'
    });
  }
});

// API route to get raw feed data as JSON
app.get('/api/status', async (req, res) => {
  try {
    const feed = await reader.getFeed('https://www.githubstatus.com/history.rss');
    res.json({ success: true, feed });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Error handling middleware
app.use((req, res, next) => {
  res.status(404).render('status', {
    feed: null,
    getStatusClass,
    lastUpdated: new Date().toLocaleString(),
    error: 'Page not found'
  });
});

app.use((err, req, res, next) => {
  console.error('Server error:', err.message);
  res.status(500).render('status', {
    feed: null,
    getStatusClass,
    lastUpdated: new Date().toLocaleString(),
    error: 'Internal server error'
  });
});

// Start server
const server = app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});

// Export for testing
module.exports = server;