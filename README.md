# Healthcare MCP Server with Google Calendar Integration

**Uses `@vercel/mcp-adapter`**

This MCP server provides tools for managing medical appointments through Google Calendar integration.

## Setup

### 1. Environment Variables

Create a `.env` file with the following variables:

```env
REDIS_URL=your_redis_url
GOOGLE_CLOUD_KEY=your_google_cloud_api_key
GOOGLE_AUTH_CLIENT_ID=your_google_oauth_client_id
GOOGLE_AUTH_CLIENT_SECRET=your_google_oauth_client_secret
GOOGLE_REDIRECT_URI=your_redirect_uri
```

### 2. Google Calendar Authentication

Before using the calendar features, you need to authenticate with Google Calendar:

```bash
npm run setup-auth
```

This will guide you through the OAuth2 authentication process and save your tokens to environment variables.

### 3. Available Tools

The server provides the following tools:

- **`echo`**: Test tool that echoes back a message
- **`create_medical_appointment`**: Schedule medical appointments on Google Calendar
- **`list_upcoming_appointments`**: List upcoming appointments from Google Calendar

## Usage

This sample app uses the [Vercel MCP Adapter](https://www.npmjs.com/package/@vercel/mcp-adapter) that allows you to drop in an MCP server on a group of routes in any Next.js project.

Update `app/[transport]/route.ts` with your tools, prompts, and resources following the [MCP TypeScript SDK documentation](https://github.com/modelcontextprotocol/typescript-sdk/tree/main?tab=readme-ov-file#server).

## Notes for running on Vercel

- To use the SSE transport, requires a Redis attached to the project under `process.env.REDIS_URL`
- Make sure you have [Fluid compute](https://vercel.com/docs/functions/fluid-compute) enabled for efficient execution
- After enabling Fluid compute, open `app/route.ts` and adjust `maxDuration` to 800 if you using a Vercel Pro or Enterprise account
- [Deploy the Next.js MCP template](https://vercel.com/templates/next.js/model-context-protocol-mcp-with-next-js)

## Sample Client

`script/test-client.mjs` contains a sample client to try invocations.

```sh
node scripts/test-client.mjs https://mcp-for-next-js.vercel.app
```
