global.ReadableStream = global.ReadableStream || function() {};
const request = require('supertest');
const app = require('./server');
const { _cache } = require('./src/services/aiEstimationService');

let firstAuctionId = null;

// Helper to wait for data to be available
async function waitForData(endpoint, minLength = 1, maxRetries = 10, delayMs = 1000) {
  for (let i = 0; i < maxRetries; i++) {
    const res = await request(app).get(endpoint);
    if (Array.isArray(res.body) && res.body.length >= minLength) {
      return res;
    }
    await new Promise(r => setTimeout(r, delayMs));
  }
  throw new Error(`Timeout waiting for data at ${endpoint}`);
}

describe('Auction Ninja API Endpoints', () => {
  describe('GET /api/auctions', () => {
    it('should return all auctions with correct structure', async () => {
      const res = await waitForData('/api/auctions');
      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
      const auction = res.body[0];
      expect(auction).toHaveProperty('id');
      expect(auction).toHaveProperty('title');
      expect(auction).toHaveProperty('date');
      expect(auction).toHaveProperty('source');
      expect(Array.isArray(auction.itemIds)).toBe(true);
      firstAuctionId = auction.id;
    });
  });

  describe('GET /api/items', () => {
    it('should return all items with correct structure and images', async () => {
      const res = await waitForData('/api/items');
      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
      const item = res.body[0];
      expect(item).toHaveProperty('id');
      expect(item).toHaveProperty('name');
      expect(item).toHaveProperty('description');
      expect(item).toHaveProperty('auctionId');
      expect(Array.isArray(item.images)).toBe(true);
      if (item.images.length > 0) {
        expect(item.images[0]).toHaveProperty('web_large_url');
      }
    });

    it('should filter items by auctionId (dynamic)', async () => {
      // Use a real auctionId from the previous test
      if (!firstAuctionId) {
        const auctionsRes = await waitForData('/api/auctions');
        firstAuctionId = auctionsRes.body[0].id;
      }
      const res = await waitForData(`/api/items?auctionId=${firstAuctionId}`);
      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
      res.body.forEach(item => {
        expect(item.auctionId).toBe(firstAuctionId);
      });
    });
  });

  describe('GET /api/health', () => {
    it('should return health info with auctions, items, and lastAggregationTime', async () => {
      const res = await request(app).get('/api/health');
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('auctions');
      expect(res.body).toHaveProperty('items');
      expect(res.body).toHaveProperty('lastAggregationTime');
      expect(typeof res.body.auctions).toBe('number');
      expect(typeof res.body.items).toBe('number');
      expect(typeof res.body.lastAggregationTime).toBe('string');
    });
  });

  describe('POST /api/refresh-auctions', () => {
    it('should trigger a refresh and return success', async () => {
      const res = await request(app).post('/api/refresh-auctions');
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('status', 'success');
      expect(res.body).toHaveProperty('message');
    });
  });
});

describe('AI Estimation Endpoints', () => {
  const mockResult = {
    valueRange: '$100-$200',
    context: 'Test context',
    demand: 'Test demand',
    specialConsiderations: 'Test notes'
  };
  let originalEnv;

  beforeAll(() => {
    // Save and set dummy API key
    originalEnv = process.env.ANTHROPIC_API_KEY;
    process.env.ANTHROPIC_API_KEY = 'test-key';
  });
  afterAll(() => {
    process.env.ANTHROPIC_API_KEY = originalEnv;
  });

  beforeEach(() => {
    _cache.clear();
  });

  it('should return AI estimation for a single item (cache miss)', async () => {
    jest.spyOn(require('./src/services/aiEstimationService'), 'fetchAIValuation').mockResolvedValueOnce(mockResult);
    const res = await request(app).post('/ai-estimation').send({
      itemName: 'Test Item',
      itemDescription: 'A rare collectible',
      imageLinks: ['http://img.com/1.jpg']
    });
    expect(res.statusCode).toBe(200);
    expect(res.body).toMatchObject(mockResult);
    jest.restoreAllMocks();
  });

  it('should return cached result for repeated single item request (cache hit)', async () => {
    jest.spyOn(require('./src/services/aiEstimationService'), 'fetchAIValuation').mockResolvedValueOnce(mockResult);
    const payload = {
      itemName: 'Test Item',
      itemDescription: 'A rare collectible',
      imageLinks: ['http://img.com/1.jpg']
    };
    // First request (cache miss)
    await request(app).post('/ai-estimation').send(payload);
    // Second request (should hit cache, so fetchAIValuation not called again)
    const res = await request(app).post('/ai-estimation').send(payload);
    expect(res.statusCode).toBe(200);
    expect(res.body).toMatchObject(mockResult);
    jest.restoreAllMocks();
  });

  it('should return AI estimations for a batch of items', async () => {
    jest.spyOn(require('./src/services/aiEstimationService'), 'fetchAIValuation').mockResolvedValue(mockResult);
    const items = [
      { itemName: 'Item 1', itemDescription: 'Desc 1', imageLinks: [] },
      { itemName: 'Item 2', itemDescription: 'Desc 2', imageLinks: [] }
    ];
    const res = await request(app).post('/ai-estimation/batch').send({ items });
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(2);
    expect(res.body[0]).toMatchObject(mockResult);
    expect(res.body[1]).toMatchObject(mockResult);
    jest.restoreAllMocks();
  });

  it('should return 400 for invalid batch input', async () => {
    const res = await request(app).post('/ai-estimation/batch').send({ items: 'not-an-array' });
    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('error');
  });
}); 