# Auction Scout


## Purpose & Audience
This project is designed for employers, clients, and open source contributors who want to evaluate my skills in building robust, scalable, and well-documented web applications. It demonstrates:
- Backend data aggregation, normalization, and API design
- Modern React frontend architecture
- Code quality, testing, and documentation best practices

## Tech Stack
- **Backend:** Node.js, Express, Cheerio (scraping), Axios
- **Frontend:** React, Tailwind CSS
- **Testing:** Jest
- **Build Tools:** Vite, Webpack, PostCSS

## Features
- Aggregates and normalizes auction/item data from third-party sources
- Unified backend API for frontend and AI services
- Resilient scraping with error handling and scheduled refresh
- AI-powered price estimation endpoint
- Automated tests for core endpoints
- Modular, maintainable codebase



## Overview
This project now uses a unified backend service to aggregate, normalize, and serve auction and item data to the frontend. The frontend is fully decoupled from third-party APIs for auctions/items, and all data flows through the backend.

This backend service aggregates and normalizes auction and item data from Dickensheet (https://www.dickensheet.com) and exposes a unified API for use by the frontend and AI valuation services. It includes resilient scraping, scheduled refresh, error handling, and health monitoring.

## Aggregation Flow
- Scrapes the main auction list from Dickensheet.
- For each auction, scrapes details and fetches all items (with images) from the Dickensheet live auction API.
- Normalizes and stores all auctions and items in memory.
- Refreshes data every 10 minutes (or on demand via API).
- Logs all progress and errors for observability.

## API Endpoints

### `GET /api/auctions`
Returns an array of all current auctions.

**Example response:**
```json
[
  {
    "id": "139759",
    "title": "VEHICLES ON BEHALF OF TOW CO",
    "date": "May 8 @ 2:00pm M",
    "end": null,
    "address": "1280 W 47th Ave, Denver, CO 80211, US (map)",
    "source": "https://www.dickensheet.com/auctions/detail/bw139759",
    "itemIds": ["19718080", ...]
  },
  ...
]
```

### `GET /api/items`
Returns an array of all items (optionally filter by `?auctionId=...`). Each item includes all available image URLs.

**Example response:**
```json
[
  {
    "id": "19718081",
    "auctionId": "139759",
    "name": "1998 Toyota Corolla, 1NXBR12E9WZ012755",
    "description": "...",
    "start_amount": 300,
    "api_bidding_state": { ... },
    "images": [
      {
        "id": 123918399,
        "web_large_url": "https://...",
        ...
      },
      ...
    ]
  },
  ...
]
```

### `POST /api/refresh-auctions`
Manually trigger a data refresh. Returns status and message.

### `GET /api/health`
Returns a health summary:
```json
{
  "auctions": 4,
  "items": 72,
  "lastAggregationTime": "2025-05-06T18:18:09.391Z"
}
```

### `POST /ai-estimation`
Request an AI-powered price estimation for an item. Pass `itemName`, `itemDescription`, and `imageLinks` (array of image URLs) in the request body.

**Example request:**
```json
{
  "itemName": "1998 Toyota Corolla, 1NXBR12E9WZ012755",
  "itemDescription": "...",
  "imageLinks": ["https://.../web_large_url.jpg", ...]
}
```

## Data Freshness & Resilience
- Data is refreshed every 10 minutes and can be manually refreshed.
- Errors in scraping or API calls are logged and do not crash the server.
- Health endpoint provides visibility into data status.



---

## How to Run

### 1. Start the Backend
```sh
node server.js
```
- Runs on port 3001 by default.
- Logs confirm server and data aggregation are running.

### 2. Start the Frontend
```sh
npm start
```
- Runs on port 3000 by default.
- The frontend fetches all auction/item data from the backend.

---


This project is licensed under the MIT License. See [LICENSE](./LICENSE) for details.

---

