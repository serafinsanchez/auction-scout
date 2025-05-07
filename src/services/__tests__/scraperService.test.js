global.TextEncoder = require('util').TextEncoder;
global.TextDecoder = require('util').TextDecoder;

global.ReadableStream = global.ReadableStream || function() {};

const { fetchAuctionData } = require('../scraperService');
const axios = require('axios');

jest.mock('axios');

describe('fetchAuctionData', () => {
  it('parses title from HTML', async () => {
    axios.get.mockResolvedValueOnce({ data: '<html><head><title>Test Auction</title></head><body></body></html>' });
    const result = await fetchAuctionData('http://example.com');
    expect(result.title).toBe('Test Auction');
    expect(result.items).toEqual([]);
    expect(result.source).toBe('http://example.com');
  });

  it('retries and throws after max attempts', async () => {
    axios.get.mockRejectedValue(new Error('Network error'));
    await expect(fetchAuctionData('http://fail.com')).rejects.toThrow('Failed to fetch data from http://fail.com');
  });
}); 