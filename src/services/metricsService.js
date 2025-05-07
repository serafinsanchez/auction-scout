// Simple in-memory metrics service for Redis and OpenAI usage/costs

const metrics = {
  redis: {
    hits: 0,
    misses: 0,
    errors: 0,
    evictions: 0, // Placeholder; requires Redis event integration
  },
  openai: {
    apiCalls: 0,
    errors: 0,
    estimatedCostUSD: 0, // Increment if cost can be estimated
  },
  lastReset: new Date().toISOString(),
};

function incRedisHit() { metrics.redis.hits++; }
function incRedisMiss() { metrics.redis.misses++; }
function incRedisError() { metrics.redis.errors++; }
function incRedisEviction() { metrics.redis.evictions++; }

function incOpenAICall() { metrics.openai.apiCalls++; }
function incOpenAIError() { metrics.openai.errors++; }
function addOpenAICost(usd) { metrics.openai.estimatedCostUSD += usd; }

function getMetrics() { return { ...metrics }; }
function resetMetrics() {
  metrics.redis = { hits: 0, misses: 0, errors: 0, evictions: 0 };
  metrics.openai = { apiCalls: 0, errors: 0, estimatedCostUSD: 0 };
  metrics.lastReset = new Date().toISOString();
}

module.exports = {
  incRedisHit,
  incRedisMiss,
  incRedisError,
  incRedisEviction,
  incOpenAICall,
  incOpenAIError,
  addOpenAICost,
  getMetrics,
  resetMetrics,
}; 