const axios = require('axios');
const cheerio = require('cheerio');
const { DateTime } = require('luxon');
// const puppeteer = require('puppeteer'); // Uncomment when needed

/**
 * Rate limiter state (simple in-memory, per source)
 */
const lastRequestTimestamps = {};
const RATE_LIMIT_MS = 2000; // 1 request per 2 seconds per source
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

/**
 * Fetch auction data from a given URL using axios + cheerio.
 * Retries and rate limits requests per source.
 * @param {string} url - The URL to fetch data from
 * @param {object} options - Optional config (future: use for puppeteer, etc.)
 * @returns {Promise<object>} Normalized auction data
 */
async function fetchAuctionData(url, options = {}) {
  // Rate limiting
  const now = Date.now();
  if (lastRequestTimestamps[url] && now - lastRequestTimestamps[url] < RATE_LIMIT_MS) {
    const wait = RATE_LIMIT_MS - (now - lastRequestTimestamps[url]);
    await new Promise(res => setTimeout(res, wait));
  }
  lastRequestTimestamps[url] = Date.now();

  let attempt = 0;
  while (attempt < MAX_RETRIES) {
    try {
      const response = await axios.get(url);
      const $ = cheerio.load(response.data);
      // TODO: Customize parsing logic for each auction site
      // Example: Extract auction title and items
      const title = $('title').text() || 'Auction';
      const items = [];
      // ...parse items from HTML...
      return { title, items, source: url };
    } catch (error) {
      attempt++;
      console.error(`[Scraper] Error fetching ${url} (attempt ${attempt}):`, error.message);
      if (attempt < MAX_RETRIES) {
        await new Promise(res => setTimeout(res, RETRY_DELAY_MS * attempt));
      } else {
        throw new Error(`Failed to fetch data from ${url} after ${MAX_RETRIES} attempts.`);
      }
    }
  }
}

/**
 * Stub for future puppeteer-based scraping (for JS-heavy sites)
 */
async function fetchAuctionDataWithPuppeteer(url, options = {}) {
  // Placeholder for future implementation
  throw new Error('Puppeteer scraping not implemented yet.');
}

/**
 * Fetch and parse the main auction list from Dickensheet.
 * @returns {Promise<Array>} Array of auctions with {id, title, detailsUrl}
 */
async function fetchDickensheetAuctionList() {
  const url = 'https://www.dickensheet.com/#auctions-start';
  const response = await axios.get(url);
  const $ = cheerio.load(response.data);
  const auctions = [];

  // The auction list is in a section after the #auctions-start anchor
  // Each auction is typically in a div or table row with a link to /auctions/detail/bwXXXXX
  // We'll look for links matching that pattern
  $('a[href^="/auctions/detail/bw"]').each((_, el) => {
    const detailsPath = $(el).attr('href');
    const detailsUrl = `https://www.dickensheet.com${detailsPath}`;
    const title = $(el).text().trim();
    // Extract the auction ID from the URL (e.g., bw139759)
    const idMatch = detailsPath.match(/bw(\d+)/);
    const id = idMatch ? idMatch[1] : null;
    if (id && title) {
      auctions.push({ id, title, detailsUrl });
    }
  });

  return auctions;
}

/**
 * Fetch and parse auction details from a Dickensheet auction details page.
 * @param {string} detailsUrl - The URL of the auction details page
 * @returns {Promise<object>} Auction metadata (id, title, start/end, address, etc)
 */
async function fetchDickensheetAuctionDetails(detailsUrl) {
  const response = await axios.get(detailsUrl);
  const $ = cheerio.load(response.data);

  // Title
  const title = $('h1').first().text().trim();

  // Description: try to get the main auction content
  let description = '';
  // Try to find a main content div or section
  const descSection = $('div:contains("Details")').next('div');
  if (descSection.length) {
    description = descSection.html();
  } else {
    // Fallback: get the first large block of text after the title
    description = $('h1').first().nextAll('div, p').first().html() || '';
  }

  // Company name: look for 'On Behalf Of' or similar
  let company_name = '';
  const behalfMatch = response.data.match(/On Behalf Of:? ([^<\n]+)/i);
  if (behalfMatch) company_name = behalfMatch[1].trim();

  // Helper to parse Dickensheet date strings like 'Apr 29 @ 9:47am MDT'
  function parseDickensheetDate(str) {
    if (!str) return null;
    
    try {
      // Clean the string
      const cleaned = str.replace('@', '').replace(/\s+/g, ' ').trim();
      
      // Extract components with regex
      // Format example: "Apr 29 9:47am MDT"
      const match = cleaned.match(/([A-Za-z]+) (\d{1,2}) (\d{1,2}):(\d{2})([ap])m ([A-Z]+)/i);
      if (!match) {
        console.warn(`[Scraper] Could not extract date components: '${str}'`);
        return null;
      }
      
      const [_, month, day, hour, minute, ampm, timezone] = match;
      const year = new Date().getFullYear();
      
      // Convert to 24-hour format
      let hours = parseInt(hour, 10);
      if (ampm.toLowerCase() === 'p' && hours < 12) hours += 12;
      if (ampm.toLowerCase() === 'a' && hours === 12) hours = 0;
      
      // Map month name to number
      const monthNames = {
        'jan': 1, 'feb': 2, 'mar': 3, 'apr': 4, 'may': 5, 'jun': 6,
        'jul': 7, 'aug': 8, 'sep': 9, 'oct': 10, 'nov': 11, 'dec': 12
      };
      const monthNum = monthNames[month.toLowerCase().substring(0, 3)];
      
      if (!monthNum) {
        console.warn(`[Scraper] Invalid month: '${month}'`);
        return null;
      }
      
      // Create DateTime object
      const dt = DateTime.fromObject({
        year,
        month: monthNum,
        day: parseInt(day, 10),
        hour: hours,
        minute: parseInt(minute, 10)
      }, { zone: 'America/Denver' }); // Use Denver timezone for MDT
      
      if (!dt.isValid) {
        console.warn(`[Scraper] Invalid DateTime object for: '${str}'`);
        return null;
      }
      
      return dt.toUTC().toISO();
    } catch (err) {
      console.warn(`[Scraper] Error parsing date: '${str}', error: ${err.message}`);
      return null;
    }
  }

  // Dates
  let starts_at = null, scheduled_end_time = null;
  // Match e.g. 'Apr 29 @ 9:47am MDT (Start)'
  const startMatch = response.data.match(/([A-Za-z]{3} \d{1,2} @ [\d:apm]+ [A-Za-z]{2,4}) ?\(Start\)/i);
  if (startMatch) {
    starts_at = parseDickensheetDate(startMatch[1]);
  }
  // Match e.g. 'May 8 @ 2:00pm MDT (End)'
  const endMatch = response.data.match(/([A-Za-z]{3} \d{1,2} @ [\d:apm]+ [A-Za-z]{2,4}) ?\(End\)/i);
  if (endMatch) {
    scheduled_end_time = parseDickensheetDate(endMatch[1]);
  }

  // Inspection details
  let inspection_details = '';
  const inspectionMatch = response.data.match(/INSPECTION:? ([^<\n]+)/i);
  if (inspectionMatch) inspection_details = inspectionMatch[1].trim();

  // Removal details
  let removal_details = '';
  const removalMatch = response.data.match(/REMOVAL:? ([^<\n]+)/i);
  if (removalMatch) removal_details = removalMatch[1].trim();

  // Buyer responsibilities
  let buyer_responsibilities = '';
  const buyerRespMatch = response.data.match(/Buyer Responsibilities:? ([^<\n]+)/i);
  if (buyerRespMatch) buyer_responsibilities = buyerRespMatch[1].trim();

  // Status (not always available)
  let status = '';
  // Online/offline
  let online_only = false, offline_only = false;
  if (/online only/i.test(response.data)) online_only = true;
  if (/offline only/i.test(response.data)) offline_only = true;

  // Timezone (best guess)
  let timezone = '';
  const tzMatch = response.data.match(/MT|MST|MDT|US\/Mountain/i);
  if (tzMatch) timezone = 'US/Mountain';

  // Coordinator info (not always available)
  let coord_first_name = '', coord_last_name = '', coord_email = '', coord_phone = '';
  const emailMatch = response.data.match(/[\w.-]+@[\w.-]+\.[A-Za-z]{2,6}/);
  if (emailMatch) coord_email = emailMatch[0];
  const phoneMatch = response.data.match(/\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
  if (phoneMatch) coord_phone = phoneMatch[0];
  // Names: try to extract from email or fallback
  if (coord_email) {
    const nameParts = coord_email.split('@')[0].split('.');
    if (nameParts.length >= 2) {
      coord_first_name = nameParts[0].charAt(0).toUpperCase() + nameParts[0].slice(1);
      coord_last_name = nameParts[1].charAt(0).toUpperCase() + nameParts[1].slice(1);
    }
  }

  // Location: try to extract address block
  let location = null;
  const addressBlock = $('a[href*="maps.google.com"], a[href*="map"]').parent().text().trim();
  if (addressBlock) {
    // Try to parse address components
    const addressMatch = addressBlock.match(/(\d{3,5} [\w .]+), ([\w .]+), ([A-Z]{2}) (\d{5})/);
    if (addressMatch) {
      location = {
        street: addressMatch[1],
        city: addressMatch[2],
        state: addressMatch[3],
        zip: addressMatch[4],
        country: 'US',
        lat: null,
        lng: null
      };
    } else {
      location = { street: addressBlock, city: '', state: '', zip: '', country: 'US', lat: null, lng: null };
    }
  }

  // Featured images (already scraped)
  let featured_images = [];
  $('img').each((_, el) => {
    const src = $(el).attr('src');
    if (src && !src.startsWith('data:')) {
      let url = src;
      if (src.startsWith('/')) {
        url = `https://www.dickensheet.com${src}`;
      } else if (!src.startsWith('http')) {
        url = `https://www.dickensheet.com/${src}`;
      }
      featured_images.push({ url });
    }
  });

  return {
    id: null, // set by caller
    title,
    description,
    company_name,
    starts_at,
    scheduled_end_time,
    inspection_details,
    removal_details,
    buyer_responsibilities,
    status,
    online_only,
    offline_only,
    timezone,
    coord_first_name,
    coord_last_name,
    coord_email,
    coord_phone,
    location,
    featured_images
  };
}

/**
 * Fetch items for a given Dickensheet auction ID from the live auction API.
 * @param {string} auctionId - The auction ID (e.g., '139759')
 * @returns {Promise<Array>} Array of item objects
 */
async function fetchDickensheetAuctionItems(auctionId) {
  const url = `https://bid.dickensheet.com/api/auctions/${auctionId}/items`;
  const response = await axios.get(url);
  // The response is likely { items: [...] }
  if (response.data && Array.isArray(response.data.items)) {
    return response.data.items;
  }
  // Fallback: if response is an array
  if (Array.isArray(response.data)) {
    return response.data;
  }
  throw new Error('Unexpected response format from Dickensheet items API');
}

module.exports = {
  fetchAuctionData,
  fetchAuctionDataWithPuppeteer,
  fetchDickensheetAuctionList,
  fetchDickensheetAuctionDetails,
  fetchDickensheetAuctionItems,
}; 