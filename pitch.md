# Pitch: Auction Ninja Core Efficiency & Results Overhaul

## Problem
Auction Ninja currently fetches auction and item data directly from third-party APIs on the frontend, with no backend aggregation, caching, or normalization. AI-powered item valuation is handled by a backend endpoint that simply proxies requests to Anthropic Claude. This architecture leads to inefficiencies, fragility, and limited scalability:
- Redundant and bandwidth-heavy data fetching on the client
- No resilience to API changes, downtime, or anti-bot measures
- No cross-auction aggregation or deduplication
- No caching or batching for AI estimations
- Duplicated data-fetching logic and lack of modularity

## Appetite
Open (no fixed time limit, but focus on delivering a robust, extensible foundation in a single cycle)

## Solution Outline
### 1. Move Data Aggregation to Backend
- Implement backend services to fetch, aggregate, and normalize auction data from multiple sources
- Expose a unified API for the frontend
- Add caching (in-memory or Redis) for speed and efficiency

### 2. Resilient Scraping & Data Fetching
- Use libraries like axios, cheerio, or puppeteer for scraping when APIs are unavailable
- Add retry logic, rate limiting, and error handling
- Schedule background jobs to keep auction data fresh

### 3. AI/ML Optimization
- Add request deduplication and caching for AI estimations
- Support batching of AI requests for bulk evaluation
- (Optional) Explore local ML inference for basic valuation

### 4. Code Quality & Modularity
- Refactor frontend to use reusable data-fetching services and shared state
- Modularize backend for easy extension (e.g., new auction sources, user auth)
- Add automated tests and monitoring

## Boundaries
**In:**
- Backend aggregation, normalization, and caching of auction data
- Robust scraping/fetching logic
- AI estimation optimization (caching, batching)
- Refactoring for modularity and maintainability

**Out:**
- UI/UX and design improvements (to be addressed in a future cycle)
- User authentication and advanced personalization
- Payment or transactional features

## Risks & Rabbit Holes
- Scraping may be blocked or require anti-bot workarounds
- Third-party API changes could require rapid adaptation
- AI API costs and rate limits
- Overengineering: keep the first iteration simple and extensible

## Success Criteria
- Faster, more reliable auction/item data for users
- Reduced redundant API calls and bandwidth
- More accurate, cost-effective AI estimations
- Codebase is modular, maintainable, and ready for future features

# Milestone 3: AI/ML Estimation Optimization

## Problem

**Current State:**  
- The backend provides normalized auction/item data, including images, for AI price estimation.
- Each AI estimation request (to Claude/OpenAI/etc.) is made individually, even for duplicate or batch requests.
- This leads to unnecessary API costs, slower response times, and potential rate limiting.

**Why Now:**  
- As usage grows, AI estimation costs and latency will increase.
- Users expect fast, cost-effective, and reliable price estimates.
- Optimizing this workflow will improve user experience and reduce operational costs.

**For Whom:**  
- End users seeking instant price estimates.
- Developers/maintainers managing API costs and performance.

---

## Appetite

**Fixed Time:** 1 week  
- This milestone should be achievable in a focused 1-week cycle.

---

## Scope Boundaries

**In Scope:**
- Add caching for AI estimation requests (avoid duplicate calls for the same item).
- Support batching of AI requests for bulk item evaluation.
- (Optional, stretch) Prototype local ML inference for basic valuation.

**Out of Scope:**
- UI/UX changes.
- New AI models or providers (unless trivial).
- Payment, authentication, or user features.

---

## Key Risks & Rabbit Holes

- **Cache invalidation:** Must ensure cache is correct and not stale if item data changes.
- **Batching complexity:** Need to maintain compatibility with single-item requests.
- **Local ML inference:** Only if time allows; may require model selection and extra dependencies.

---

## Pitched Solution

### Architecture

- **AI Estimation Cache:**  
  - Store AI estimation results keyed by a hash of item name, description, and image URLs.
  - On request, check cache before making an external API call.

- **Batch Estimation Endpoint:**  
  - Add a new endpoint (e.g., `/ai-estimation/batch`) that accepts an array of items.
  - Batch requests to the AI API where possible, or process sequentially with caching.

- **(Optional) Local ML Inference:**  
  - Prototype a simple local model (e.g., scikit-learn, TensorFlow.js) for basic price estimation.
  - Use as a fallback or for cost-saving on common items.

### Key Workflows

1. **Single Item Estimation:**  
   - On request, check cache. If hit, return cached result. If miss, call AI API, cache, and return.

2. **Batch Estimation:**  
   - For each item, check cache. For misses, batch call AI API if supported, cache results, and return all.

3. **Cache Management:**  
   - Use in-memory cache (or Redis if available).  
   - Optionally, add TTL (time-to-live) for cache entries.

---

## Implementation Boundaries

- All caching and batching logic must be modular and testable.
- No changes to frontend or API contract except for the new batch endpoint.
- Logging must capture cache hits/misses and batch operations.
- Local ML inference is optional and should not block delivery.

---

## Success Criteria

- AI estimations are faster and less costly.
- Duplicate requests do not trigger duplicate AI calls.
- Batch endpoint works and is covered by tests.
- (Optional) Local ML fallback is available for basic use cases.

# Milestone 4: Monitoring Redis and OpenAI API Usage/Costs

## Problem
As Auction Ninja usage grows, infrastructure and API costs (especially for OpenAI) can become significant and unpredictable. There is currently no built-in way to monitor cache efficiency, API usage, or cost trends, making it hard for maintainers to optimize or detect anomalies early.

## Appetite
Fixed: 1 week

## Scope Boundaries
**In Scope:**
- Track Redis cache usage (hits, misses, evictions, errors)
- Track OpenAI API usage (number of calls, estimated cost, errors)
- Expose metrics via a simple dashboard or API endpoint
- (Optional) Send alerts for anomalies (e.g., high error rate, cost spike)

**Out of Scope:**
- Full-featured analytics UI
- Integration with third-party monitoring platforms (unless trivial)
- Monitoring for other services

## Risks & Rabbit Holes
- OpenAI cost estimation may require parsing API responses or using their dashboard
- Redis usage stats may require additional libraries or Redis config
- Alerting can get complex—keep it simple for this cycle

## Pitched Solution
### Architecture
- Instrument Redis and OpenAI API calls in the backend
- Collect stats: cache hits/misses, API calls, errors, estimated cost
- Expose a `/metrics` API endpoint (JSON or Prometheus format)
- (Optional) Simple HTML dashboard for quick viewing
- (Optional) Log warnings or send alerts for anomalies

### Key Workflows
1. Backend records metrics on each Redis/OpenAI interaction
2. Metrics are aggregated in memory (or Redis) and exposed via endpoint
3. (Optional) Alerts are triggered if thresholds are exceeded

## Implementation Boundaries
- No changes to core business logic
- No frontend changes except (optional) dashboard
- Keep code modular and testable

## Success Criteria
- Maintainers can view up-to-date Redis and OpenAI usage/cost metrics
- Anomalies are detectable via logs or alerts
- Solution is easy to extend for future monitoring needs

# Auction Ninja UI Redesign Pitch

## Problem
The current UI of Auction Ninja lacks a modern, cohesive, and professional design. Users expect a visually appealing, consistent, and accessible interface that enhances usability and trust. The app's current look and feel may hinder user engagement and satisfaction.

## Appetite
**2 weeks** (full redesign of all core screens and components)

## Solution
- Redesign the entire application using [shadcn/ui](https://ui.shadcn.com/) component library for all UI primitives (buttons, cards, modals, etc.).
- Apply the Tailwind `slate` color palette (as shown in the provided reference) for a sleek, professional, and consistent look.
- Refactor or replace all components in `src/components/` to use shadcn/ui and the new color theme.
- Prioritize the following must-have screens:
  1. Main dashboard page
  2. Item details page (`/auction/[id]/items`) in both card and list view
  3. View estimation areas
- Ensure mobile responsiveness and accessibility throughout.

## Boundaries
**In:**
- All core screens/components refactored to use shadcn/ui and the slate palette
- Responsive and accessible design
- Consistent use of new design system

**Out:**
- Backend/business logic changes
- New features not related to UI redesign
- Custom animations or advanced theming beyond the slate palette

## Risks & Rabbit Holes
- Ensuring all legacy styles/components are replaced
- Integration issues with shadcn/ui
- Time management for full coverage
- Over-customization or scope creep

## Success Criteria
- Improved user experience and satisfaction
- Enhanced usability and trust
- Consistent and professional design
- Mobile responsiveness and accessibility

# Professional Portfolio-Ready Codebase

## Problem
The current project needs to be organized and documented to a professional standard, suitable for presentation to potential employers and clients. The goal is to make the codebase easy to understand, run, and extend, while showcasing best practices in code quality and documentation.

## Appetite
As much time as necessary to deliver a thorough, high-quality result, with a focus on clarity and professionalism.

## Solution
- Audit and clean up the directory structure.
- Update or create a professional `README.md` (project overview, setup, usage, tech stack, contribution, etc.).
- Add or update supporting docs: `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`, etc.
- Add comments and docstrings to key files/components.
- Ensure code style consistency (e.g., Prettier, ESLint).
- Add or update basic tests and usage examples.
- Remove unnecessary files (e.g., `.DS_Store`, unused configs).
- Add a `delivery.md` for deployment/run instructions.

## Scope Boundaries
**In:**
- Documentation and structure improvements
- Code style and formatting
- Basic tests and usage examples
- Removal of clutter

**Out:**
- Major new features or rewrites
- Full test coverage
- Deployment automation

## Risks & Rabbit Holes
- Outdated or missing documentation
- Unclear project structure
- Unused or legacy files causing confusion
- Inconsistent code style 