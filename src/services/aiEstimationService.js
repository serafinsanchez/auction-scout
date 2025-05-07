const axios = require('axios');
const crypto = require('crypto');
const { createClient } = require('redis');
const metrics = require('./metricsService');

// In-memory cache: { hash: { result, timestamp } }
const cache = new Map();
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

// Redis setup
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
let redisClient;
let redisReady = false;

(async () => {
  try {
    redisClient = createClient({ url: REDIS_URL });
    redisClient.on('error', (err) => {
      console.error('[Redis] Error:', err.message);
      redisReady = false;
    });
    redisClient.on('connect', () => {
      console.log('[Redis] Connected');
      redisReady = true;
    });
    await redisClient.connect();
  } catch (err) {
    console.error('[Redis] Connection failed, using in-memory cache only:', err.message);
    redisReady = false;
  }
})();

function getItemHash(itemName, itemDescription, imageLinks) {
  const hash = crypto.createHash('sha256');
  hash.update(itemName + '|' + itemDescription + '|' + (imageLinks || []).join(','));
  return hash.digest('hex');
}

// Helper to build OpenAI Vision messages
function buildVisionMessages({ itemName, itemDescription, imageLinks }) {
  const promptText = `As an expert appraiser, analyze this auction item for resale value.
Use the attached images and description, paying close attention to condition, authenticity, unique features, and any visible flaws. Reference specific images or details where possible.

For "valueRange", provide a specific price range in USD, ideally no wider than 20% of the estimated midpoint, unless uncertainty is high. Avoid overly broad ranges. If you cannot be precise, explain why in "specialConsiderations".

If possible, cite comparable recent sales or typical auction results for similar items. Adjust your estimate for current market trends and demand.

Please provide a JSON response with the following fields:
{
  "valueRange": "$X–$Y USD",
  "context": "Brief analysis of condition, authenticity, and value factors, referencing the images and description. Mention any notable details seen in specific images.",
  "demand": "Current market demand and buyer insights.",
  "specialConsiderations": "Important notes or warnings, including if the images are unclear, insufficient, or if there is any uncertainty in the valuation."
}
If you cannot estimate, set "valueRange" to "Unknown" and explain why in "context". Keep each field under 100 words.

Example:
{
  "valueRange": "$120–$140 USD",
  "context": "The item is in excellent condition with a clear maker's mark in image 2. Recent sales of similar items average $130.",
  "demand": "High demand among collectors this season.",
  "specialConsiderations": "Estimate is precise due to clear images and recent comparable sales."
}`;

  const content = [
    { type: "text", text: promptText },
    { type: "text", text: `Item Name: ${itemName}\nDescription: ${itemDescription}` },
    ...(imageLinks || []).map(link => {
      if (typeof link === 'string' && link.startsWith('http')) {
        return { type: "image_url", image_url: { url: link } };
      } else if (typeof link === 'string' && link.startsWith('data:image/')) {
        // Extract base64 part
        const base64 = link.split(',')[1];
        return { type: "image", image: { base64 } };
      } else {
        // Unknown format, skip or log
        return null;
      }
    }).filter(Boolean)
  ];

  return [
    {
      role: "user",
      content
    }
  ];
}

async function fetchAIValuation({ itemName, itemDescription, imageLinks }, openaiApiKey) {
  const messages = buildVisionMessages({ itemName, itemDescription, imageLinks });

  // Optional: log what is being sent for debugging
  console.log('[AI Vision] Sending messages:', JSON.stringify(messages, null, 2));

  try {
    const response = await axios.post('https://api.openai.com/v1/chat/completions', {
      model: 'gpt-4o', // or 'gpt-4-vision-preview'
      messages,
      max_tokens: 1024,
      temperature: 0.2,
      response_format: { type: 'json_object' }
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiApiKey}`,
      },
    });

    // --- Cost Estimation Logic ---
    // GPT-4o pricing (June 2024): $2.50/million input tokens, $10.00/million output tokens
    // response.data.usage = { prompt_tokens, completion_tokens, total_tokens }
    if (response.data && response.data.usage) {
      const { prompt_tokens = 0, completion_tokens = 0 } = response.data.usage;
      const inputCost = (prompt_tokens / 1_000_000) * 2.5;
      const outputCost = (completion_tokens / 1_000_000) * 10.0;
      const totalCost = inputCost + outputCost;
      metrics.addOpenAICost(totalCost);
    }
    // --- End Cost Estimation ---

    const aiResponse = response.data.choices[0].message.content;
    
    try {
      return JSON.parse(aiResponse);
    } catch (parseError) {
      console.error('[AI Service] Failed to parse OpenAI response as JSON:', parseError.message);
      console.error('[AI Service] Response content:', aiResponse.substring(0, 200) + '...');
      
      // Return a formatted error object instead of throwing
      return {
        valueRange: "Unable to generate estimate",
        context: "The AI service returned an invalid response. This might be due to API limitations or the complexity of the item.",
        demand: "Unknown",
        specialConsiderations: "Please try again later or with more specific item details."
      };
    }
  } catch (requestError) {
    console.error('[AI Service] OpenAI API error:', requestError.message);
    if (requestError.response) {
      console.error('[AI Service] Response status:', requestError.response.status);
      console.error('[AI Service] Response data:', JSON.stringify(requestError.response.data));
    }
    
    throw requestError; // Rethrow to let the caller handle network/API errors
  }
}

async function getAIValuation({ itemName, itemDescription, imageLinks }, openaiApiKey) {
  const hash = getItemHash(itemName, itemDescription, imageLinks);
  const now = Date.now();

  // 1. Try Redis cache
  if (redisReady) {
    try {
      const redisVal = await redisClient.get(hash);
      if (redisVal) {
        const parsed = JSON.parse(redisVal);
        console.log(`[AI Cache][Redis] HIT for hash ${hash}`);
        metrics.incRedisHit();
        return parsed.result;
      }
      console.log(`[AI Cache][Redis] MISS for hash ${hash}`);
      metrics.incRedisMiss();
    } catch (err) {
      console.error('[Redis] Error during get:', err.message);
      metrics.incRedisError();
    }
  }

  // 2. Fallback to in-memory cache
  const cached = cache.get(hash);
  if (cached && (now - cached.timestamp < CACHE_TTL_MS)) {
    console.log(`[AI Cache][Memory] HIT for hash ${hash}`);
    // Not tracked in metrics (optional: add if desired)
    return cached.result;
  }
  console.log(`[AI Cache][Memory] MISS for hash ${hash}`);

  // 3. Fetch from OpenAI
  let result;
  try {
    metrics.incOpenAICall();
    result = await fetchAIValuation({ itemName, itemDescription, imageLinks }, openaiApiKey);
    // (Optional) Estimate cost here if token usage is available
  } catch (err) {
    metrics.incOpenAIError();
    throw err;
  }

  // 4. Set in Redis (with TTL)
  if (redisReady) {
    try {
      await redisClient.set(hash, JSON.stringify({ result, timestamp: now }), { EX: CACHE_TTL_MS / 1000 });
    } catch (err) {
      console.error('[Redis] Error during set:', err.message);
      metrics.incRedisError();
    }
  }
  // 5. Set in in-memory cache
  cache.set(hash, { result, timestamp: now });
  return result;
}

// Batch version: accepts array of items, returns array of results (uses cache for each)
async function getAIValuationsBatch(items, openaiApiKey) {
  const results = [];
  for (const item of items) {
    const result = await getAIValuation(item, openaiApiKey);
    results.push(result);
  }
  return results;
}

module.exports = {
  getAIValuation,
  getAIValuationsBatch,
  getItemHash, // for testing
  _cache: cache, // for testing/inspection
  fetchAIValuation, // for mocking in tests
  _redisClient: () => redisClient, // for testing/inspection
}; 