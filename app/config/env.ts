import dotenv from "dotenv";
dotenv.config();
import { z } from "zod";
import { Logger } from "@/app/utils/logger";
import { google } from "googleapis";

const logger = new Logger("Config:Env");

export const calendar = google.calendar("v3");

// Configure OAuth2 client
export const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_AUTH_CLIENT_ID,
  process.env.GOOGLE_AUTH_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

// In-memory token storage
let tokens: {
  access_token?: string | null;
  refresh_token?: string | null;
  expiry_date?: number | null;
} = {
  access_token: process.env.GOOGLE_ACCESS_TOKEN,
  refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
};

// Token exchange function (for initial setup)
export async function getTokens(code: string) {
  try {
    logger.info("Exchanging authorization code for tokens");
    const { tokens: newTokens } = await oauth2Client.getToken(code);

    // Store tokens in memory
    tokens = newTokens;

    // Set credentials on the client
    oauth2Client.setCredentials(tokens);

    logger.info("Tokens obtained successfully");
    console.log("Access Token:", newTokens.access_token);
    console.log("Refresh Token:", newTokens.refresh_token);

    return newTokens;
  } catch (error) {
    logger.error("Error getting tokens", { error });
    throw error;
  }
}

// Function to refresh access token
export async function refreshAccessToken() {
  try {
    if (!tokens.refresh_token) {
      throw new Error("No refresh token available");
    }

    logger.info("Refreshing access token");
    oauth2Client.setCredentials({
      refresh_token: tokens.refresh_token,
    });

    const { credentials } = await oauth2Client.refreshAccessToken();

    // Update stored tokens
    tokens = {
      ...tokens,
      access_token: credentials.access_token || null,
      expiry_date: credentials.expiry_date || null,
    };

    // Set the new credentials
    oauth2Client.setCredentials(tokens);

    logger.info("Access token refreshed successfully");
    return tokens;
  } catch (error) {
    logger.error("Error refreshing access token", { error });
    throw error;
  }
}

// Function to ensure valid token
export async function ensureValidToken() {
  try {
    // Check if we have an access token
    if (!tokens.access_token) {
      if (tokens.refresh_token) {
        logger.info("No access token found, attempting to refresh");
        await refreshAccessToken();
      } else {
        throw new Error(
          "No access token or refresh token available. Please authorize the application first."
        );
      }
    }

    // Check if token is expired (with 5 minute buffer)
    if (tokens.expiry_date && tokens.expiry_date < Date.now() + 5 * 60 * 1000) {
      logger.info("Access token is expired or expiring soon, refreshing");
      await refreshAccessToken();
    }

    return tokens;
  } catch (error) {
    logger.error("Error ensuring valid token", { error });
    throw error;
  }
}

// Function to get authenticated calendar client
export async function getCalendarClient() {
  try {
    await ensureValidToken();
    return calendar;
  } catch (error) {
    logger.error("Error getting calendar client", { error });
    throw error;
  }
}

// Initialize credentials if available
if (tokens.access_token || tokens.refresh_token) {
  oauth2Client.setCredentials(tokens);
}

// Generate auth URL for initial setup
export function generateAuthUrl() {
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: ["https://www.googleapis.com/auth/calendar"],
    prompt: "consent", // Force consent screen to get refresh token
  });

  logger.info("Generated authorization URL");
  return authUrl;
}

// Only show auth URL in development or if tokens are missing
if (
  process.env.NODE_ENV === "development" &&
  (!tokens.access_token || !tokens.refresh_token)
) {
  const authUrl = generateAuthUrl();
  console.log("Visit this URL to authorize the application:");
  console.log(authUrl);
}

// Schema for environment variables
const envSchema = z.object({
  REDIS_URL: z.string(),
  GOOGLE_CLOUD_KEY: z.string(),
  GOOGLE_AUTH_CLIENT_ID: z.string(),
  GOOGLE_AUTH_CLIENT_SECRET: z.string(),
});

// Function to validate environment variables
const validateEnv = () => {
  try {
    logger.info("Validating environment variables");
    const env = {
      REDIS_URL: process.env.REDIS_URL,
      GOOGLE_CLOUD_KEY: process.env.GOOGLE_CLOUD_KEY,
      GOOGLE_AUTH_CLIENT_ID: process.env.GOOGLE_AUTH_CLIENT_ID,
      GOOGLE_AUTH_CLIENT_SECRET: process.env.GOOGLE_AUTH_CLIENT_SECRET,
    };
    const parsed = envSchema.parse(env);
    logger.info("Environment variables validated successfully");
    return parsed;
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.errors.map((err) => err.path.join("."));
      logger.error("Invalid environment variables", { error: { missingVars } });
      throw new Error(
        `❌ Invalid environment variables: ${missingVars.join(
          ", "
        )}. Please check your .env file`
      );
    }
    throw error;
  }
};

export const env = validateEnv();

// Token status check function
export function getTokenStatus() {
  return {
    hasAccessToken: !!tokens.access_token,
    hasRefreshToken: !!tokens.refresh_token,
    isExpired: tokens.expiry_date ? tokens.expiry_date < Date.now() : false,
    expiryDate: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
  };
}
