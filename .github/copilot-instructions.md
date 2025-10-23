# GitHub Copilot Instructions for Bot Bybit AWS

## Project Overview

This is a trading bot dashboard for Bybit exchange, built as a full-stack web application. The project provides a web interface to monitor and interact with Bybit's API (both testnet and production).

### Tech Stack

- **Frontend**: React 18 with TypeScript
- **Build Tool**: Vite 5.0
- **Backend**: Node.js with Express 4.18
- **Deployment**: Render.com
- **API Integration**: Bybit API v5

## Architecture

### Project Structure

```
bot_bybit.aws/
├── .github/               # GitHub configuration and workflows
├── server.js              # Express backend server (proxy and API endpoints)
├── index.tsx              # React frontend application
├── index.html             # HTML entry point
├── vite.config.ts         # Vite build configuration
├── tsconfig.json          # TypeScript configuration
├── package.json           # Dependencies and scripts
├── test-api.js            # API testing script
├── render.yaml            # Render deployment configuration
└── dist/                  # Production build output (generated)
```

### Key Components

1. **Express Server** (`server.js`):
   - Serves static files from `dist/`
   - Provides proxy endpoint for Bybit public API
   - Handles authenticated requests to Bybit API
   - Uses HMAC-SHA256 for API authentication

2. **React Frontend** (`index.tsx`):
   - Dashboard for monitoring Bybit market data
   - Interface for testing API endpoints
   - Health check monitoring

## Build and Development

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
# Runs Vite dev server on http://localhost:3000
```

### Build

```bash
npm run build
# Generates production files in dist/ directory
```

### Production Server

```bash
npm start
# Runs Express server on port 10000 (or PORT env var)
```

### Testing

```bash
node test-api.js http://localhost:10000
# Tests all API endpoints
```

## Coding Standards

### TypeScript/JavaScript

- Use TypeScript for frontend code (`.tsx`, `.ts` files)
- Use CommonJS for Node.js backend (`require()`, `module.exports`)
- Use ES2022+ features where supported
- Enable strict type checking in TypeScript
- Use `async/await` for asynchronous operations

### React

- Use functional components with hooks
- Use `useState` for local state management
- Type all component props and state
- Use React 18's `createRoot` API

### Code Style

- Use 2 spaces for indentation
- Prefer const over let, avoid var
- Use descriptive variable names
- Add error handling for all async operations
- Include loading states for API calls

### Security

- **NEVER** commit API keys or secrets to the repository
- Store sensitive data in environment variables
- Use `.env.local` for local development (already in `.gitignore`)
- Mask API keys in logs (show only first 4 and last 4 characters)
- Remove debug endpoints before production deployment

## Environment Variables

### Required for Development

- `GEMINI_API_KEY`: Gemini API key (for AI features)

### Optional (for Bybit authentication)

- `BYBIT_KEY`: Bybit API key
- `BYBIT_SECRET`: Bybit API secret

### Production

- `PORT`: Server port (auto-set by Render)
- `NODE_ENV`: Set to "production"

## API Endpoints

### Public Endpoints

- `GET /health` - Health check endpoint
- `GET /api/bybit-proxy?symbol=BTCUSDT` - Proxy for Bybit public market data

### Debug Endpoints (Remove before production)

- `GET /bybit-auth-debug` - Tests Bybit API authentication

## Deployment

### Render.com Deployment

1. Build command: `npm install && npm run build`
2. Start command: `npm start`
3. Environment: Node
4. Configure environment variables in Render dashboard

See `RENDER_DEPLOYMENT.md` for detailed deployment instructions.

## Important Notes

- The project uses Bybit **testnet** by default (`api-testnet.bybit.com`)
- Switch to production API carefully and only after thorough testing
- The `/bybit-auth-debug` endpoint is for debugging only - remove it in production
- All Bybit API requests use HMAC-SHA256 signature authentication
- Request timeout is set to 10 seconds for Bybit API calls

## Dependencies Management

- Keep dependencies up to date
- Test after updating major versions
- Use exact versions for production dependencies
- DevDependencies are not installed in production builds

## File Modifications

When making changes:

1. **Frontend changes** (`index.tsx`, React components):
   - Run `npm run dev` to test changes
   - Ensure TypeScript types are correct
   - Test in browser

2. **Backend changes** (`server.js`):
   - Restart the server after changes
   - Test API endpoints with `test-api.js` or cURL
   - Verify error handling

3. **Build configuration** (`vite.config.ts`, `tsconfig.json`):
   - Test build with `npm run build`
   - Verify output in `dist/` directory
   - Test production server with `npm start`

## Common Tasks

### Adding a new API endpoint

1. Add route handler in `server.js`
2. Implement error handling and timeouts
3. Add corresponding frontend call in `index.tsx`
4. Update `test-api.js` with new test case
5. Update documentation

### Adding new dependencies

1. Install with `npm install <package>`
2. Ensure it's added to `package.json`
3. Test build and production server
4. Document any required environment variables

### Updating Bybit API integration

1. Check Bybit API documentation for changes
2. Update signature generation if needed
3. Test with testnet first
4. Update error handling for new response formats

## Portuguese Language Note

This project includes documentation and UI text in Portuguese (Brazilian). When modifying user-facing text or documentation, maintain consistency with the existing Portuguese language usage.
