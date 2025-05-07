const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();
const cron = require('node-cron');
const { fetchAuctionData, fetchAuctionDataWithPuppeteer, fetchDickensheetAuctionList, fetchDickensheetAuctionDetails, fetchDickensheetAuctionItems } = require('./src/services/scraperService');
const { getAIValuation, getAIValuationsBatch } = require('./src/services/aiEstimationService');
const metrics = require('./src/services/metricsService');

const app = express();
const port = process.env.PORT || 3001;

// In-memory storage for auctions and items
let auctions = [];
let items = [];
let lastAggregationTime = null;

// Function to fetch and normalize auction data from Dickensheet
async function fetchAndAggregateAuctions() {
  try {
    console.log('[Aggregator] Fetching auction list...');
    const auctionList = await fetchDickensheetAuctionList();
    const auctionsData = [];
    const itemsData = [];

    for (const auction of auctionList) {
      try {
        console.log(`[Aggregator] Fetching details for auction ${auction.id}...`);
        const details = await fetchDickensheetAuctionDetails(auction.detailsUrl);
        console.log(`[Aggregator] Fetching items for auction ${auction.id}...`);
        const items = await fetchDickensheetAuctionItems(auction.id);
        // Normalize auction
        auctionsData.push({
          id: auction.id,
          title: details.title || auction.title,
          description: details.description || '',
          company_name: details.company_name || '',
          starts_at: details.starts_at || null,
          scheduled_end_time: details.scheduled_end_time || null,
          inspection_details: details.inspection_details || '',
          removal_details: details.removal_details || '',
          buyer_responsibilities: details.buyer_responsibilities || '',
          status: details.status || '',
          online_only: details.online_only || false,
          offline_only: details.offline_only || false,
          timezone: details.timezone || '',
          items_count: items.length,
          coord_first_name: details.coord_first_name || '',
          coord_last_name: details.coord_last_name || '',
          coord_email: details.coord_email || '',
          coord_phone: details.coord_phone || '',
          location: details.location || null,
          featured_images: details.featured_images || [],
          source: auction.detailsUrl,
          itemIds: items.map(i => String(i.id)),
        });
        // Normalize items (include all images)
        items.forEach(item => {
          itemsData.push({
            id: String(item.id),
            auctionId: auction.id,
            name: item.name,
            description: item.description,
            start_amount: item.start_amount,
            api_bidding_state: item.api_bidding_state,
            images: Array.isArray(item.images) ? item.images : [],
          });
        });
      } catch (err) {
        console.error(`[Aggregator] Error processing auction ${auction.id}:`, err.message);
      }
    }
    auctions = auctionsData;
    items = itemsData;
    lastAggregationTime = new Date().toISOString();
    console.log(`[Aggregator] Aggregation complete. ${auctions.length} auctions, ${items.length} items.`);
  } catch (error) {
    console.error('[Aggregator] Error aggregating auction data:', error.message);
    auctions = [];
    items = [];
    throw error;
  }
}

// Initial data fetch on server start
(async () => {
  try {
    await fetchAndAggregateAuctions();
  } catch (error) {
    // Already logged inside fetchAndAggregateAuctions
  }
})();

// Schedule data refresh every 10 minutes
cron.schedule('*/10 * * * *', async () => {
  console.log(`[Scheduler] Running scheduled auction data refresh at ${new Date().toISOString()}`);
  try {
    await fetchAndAggregateAuctions();
  } catch (error) {
    // Already logged inside fetchAndAggregateAuctions
  }
});

app.use(cors({
    origin: [
      'http://localhost:3000',
      'http://localhost:3002'
    ] // Allow requests from both React app ports
  }));
app.use(express.json());

app.post('/ai-estimation', async (req, res) => {
  try {
    const { itemName, itemDescription, imageLinks } = req.body;
    
    // Validate required fields
    if (!itemName || !itemDescription) {
      return res.status(400).json({ 
        error: 'Missing required fields', 
        details: 'Both itemName and itemDescription are required' 
      });
    }
    
    console.log(`[AI Estimation] Processing request for item: ${itemName.substring(0, 30)}...`);
    const result = await getAIValuation({ itemName, itemDescription, imageLinks }, process.env.OPENAI_API_KEY);
    
    // Log success
    console.log(`[AI Estimation] Successfully processed item: ${itemName.substring(0, 30)}...`);
    res.json(result);
  } catch (error) {
    // Detailed error logging
    console.error('[AI Estimation] Error occurred:');
    if (error.response) {
      // The request was made and the server responded with a status code outside of 2xx
      console.error(`[AI Estimation] Status: ${error.response.status}`);
      console.error('[AI Estimation] Response data:', error.response.data);
      console.error('[AI Estimation] Response headers:', error.response.headers);
    } else if (error.request) {
      // The request was made but no response was received
      console.error('[AI Estimation] No response received from OpenAI API');
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('[AI Estimation] Error message:', error.message);
    }
    
    // Send appropriate error response
    res.status(500).json({ 
      error: 'AI estimation failed',
      message: 'Unable to generate an estimate at this time',
      details: error.message
    });
  }
});

// Batch AI estimation endpoint
app.post('/ai-estimation/batch', async (req, res) => {
  try {
    const { items } = req.body; // items: array of { itemName, itemDescription, imageLinks }
    
    // Validate input
    if (!Array.isArray(items)) {
      return res.status(400).json({ 
        error: 'Invalid input format',
        details: 'items must be an array'
      });
    }
    
    // Validate each item
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (!item.itemName || !item.itemDescription) {
        return res.status(400).json({
          error: 'Invalid item data',
          details: `Item at index ${i} is missing required fields (itemName and itemDescription)`,
        });
      }
    }
    
    console.log(`[AI Batch] Processing batch of ${items.length} items`);
    const results = await getAIValuationsBatch(items, process.env.OPENAI_API_KEY);
    
    console.log(`[AI Batch] Successfully processed batch of ${items.length} items`);
    res.json(results);
  } catch (error) {
    // Detailed error logging
    console.error('[AI Batch] Error occurred:');
    if (error.response) {
      // The request was made and the server responded with a status code outside of 2xx
      console.error(`[AI Batch] Status: ${error.response.status}`);
      console.error('[AI Batch] Response data:', error.response.data);
      console.error('[AI Batch] Response headers:', error.response.headers);
    } else if (error.request) {
      // The request was made but no response was received
      console.error('[AI Batch] No response received from OpenAI API');
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('[AI Batch] Error message:', error.message);
    }
    
    // Send appropriate error response
    res.status(500).json({
      error: 'AI batch estimation failed',
      message: 'Unable to generate estimates at this time',
      details: error.message
    });
  }
});

// Endpoint: Get all auctions
app.get('/api/auctions', (req, res) => {
  try {
    res.json(auctions);
  } catch (error) {
    console.error('Error in /api/auctions:', error.message);
    res.status(500).json({ error: 'Failed to fetch auctions' });
  }
});

// Endpoint: Get all items (optionally filter by auctionId)
app.get('/api/items', (req, res) => {
  try {
    const { auctionId } = req.query;
    let filteredItems = items;
    if (auctionId) {
      filteredItems = items.filter(item => item.auctionId === auctionId);
    }
    res.json(filteredItems);
  } catch (error) {
    console.error('Error in /api/items:', error.message);
    res.status(500).json({ error: 'Failed to fetch items' });
  }
});

// Manual refresh endpoint for auctions
app.post('/api/refresh-auctions', async (req, res) => {
  try {
    console.log(`[Manual Refresh] Triggered at ${new Date().toISOString()}`);
    await fetchAndAggregateAuctions();
    res.json({ status: 'success', message: 'Auctions refreshed successfully.' });
  } catch (error) {
    console.error('[Manual Refresh] Error:', error.message);
    res.status(500).json({ status: 'error', message: 'Failed to refresh auctions.' });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    auctions: auctions.length,
    items: items.length,
    lastAggregationTime
  });
});

// Add /metrics endpoint
app.get('/metrics', (req, res) => {
  res.json(metrics.getMetrics());
});

// Add simple HTML dashboard at root
app.get('/', (req, res) => {
  const m = metrics.getMetrics();
  res.send(`
    <html>
      <head>
        <title>Auction Ninja Metrics Dashboard</title>
        <style>
          body { font-family: sans-serif; margin: 2rem; background: #f9f9f9; }
          h1 { color: #2d3748; }
          table { border-collapse: collapse; margin-top: 1rem; }
          th, td { border: 1px solid #ccc; padding: 0.5rem 1rem; }
          th { background: #e2e8f0; }
          .section { margin-bottom: 2rem; }
          .footer { margin-top: 2rem; color: #666; font-size: 0.95em; }
        </style>
      </head>
      <body>
        <h1>Auction Ninja Metrics Dashboard</h1>
        <div class="section">
          <h2>Redis Cache</h2>
          <table>
            <tr><th>Hits</th><th>Misses</th><th>Errors</th><th>Evictions</th></tr>
            <tr>
              <td>${m.redis.hits}</td>
              <td>${m.redis.misses}</td>
              <td>${m.redis.errors}</td>
              <td>${m.redis.evictions}</td>
            </tr>
          </table>
        </div>
        <div class="section">
          <h2>OpenAI API</h2>
          <table>
            <tr><th>API Calls</th><th>Errors</th><th>Estimated Cost (USD)</th></tr>
            <tr>
              <td>${m.openai.apiCalls}</td>
              <td>${m.openai.errors}</td>
              <td>$${m.openai.estimatedCostUSD.toFixed(6)}</td>
            </tr>
          </table>
        </div>
        <div class="section">
          <h2>Other</h2>
          <table>
            <tr><th>Last Reset</th></tr>
            <tr><td>${m.lastReset}</td></tr>
          </table>
        </div>
        <div class="footer">
          <strong>OpenAI GPT-4o Pricing (as of June 2024):</strong><br>
          $2.50 per 1M input tokens, $10.00 per 1M output tokens.<br>
          Cost is estimated from actual token usage per API call.<br>
          <a href="/metrics">View raw JSON</a>
        </div>
      </body>
    </html>
  `);
});

if (require.main === module) {
  app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });
}

module.exports = app;