import { google } from "googleapis";
import { env } from "@/app/config/env";
import { Logger } from "@/app/utils/logger";

const logger = new Logger("Auth:Google");

// Centralized configuration
const GOOGLE_CALENDAR_SCOPES = [
  "https://www.googleapis.com/auth/calendar",
  "https://www.googleapis.com/auth/calendar.events",
] as const;

export class GoogleAuthService {
  private oauth2Client: any;
  private calendar: any;

  constructor() {
    this.oauth2Client = new google.auth.OAuth2(
      env.GOOGLE_AUTH_CLIENT_ID,
      env.GOOGLE_AUTH_CLIENT_SECRET,
      env.GOOGLE_REDIRECT_URI
    );

    this.calendar = google.calendar({ version: "v3" });
  }

  /**
   * Get the OAuth2 client instance
   */
  getOAuth2Client() {
    return this.oauth2Client;
  }

  /**
   * Get the calendar scopes
   */
  getScopes() {
    return GOOGLE_CALENDAR_SCOPES;
  }

  /**
   * Generate authentication URL
   */
  generateAuthUrl(): string {
    return this.oauth2Client.generateAuthUrl({
      access_type: "offline",
      scope: GOOGLE_CALENDAR_SCOPES,
      prompt: "consent",
    });
  }

  /**
   * Initialize authentication with existing tokens or prompt for new ones
   */
  async initialize(): Promise<boolean> {
    try {
      // Check if we have existing tokens
      if (env.GOOGLE_REFRESH_TOKEN) {
        logger.info("Using existing refresh token for authentication");
        this.oauth2Client.setCredentials({
          refresh_token: env.GOOGLE_REFRESH_TOKEN,
        });

        // Try to refresh the access token
        try {
          const { credentials } = await this.oauth2Client.refreshAccessToken();
          this.oauth2Client.setCredentials(credentials);
          logger.info("Successfully refreshed access token");
          return true;
        } catch (refreshError) {
          logger.warn(
            "Failed to refresh access token, will need new authentication",
            { error: refreshError }
          );
          return false;
        }
      } else {
        logger.info("No existing tokens found");
        return false;
      }
    } catch (error) {
      logger.error("Error during authentication initialization", { error });
      return false;
    }
  }

  /**
   * Complete authentication with authorization code
   */
  async completeAuth(code: string): Promise<boolean> {
    try {
      const { tokens } = await this.oauth2Client.getToken(code);
      this.oauth2Client.setCredentials(tokens);

      logger.info("Authentication completed successfully");
      console.log("\n Authentication successful!");
      console.log("\nAdd these to your environment variables:");
      console.log(`GOOGLE_REFRESH_TOKEN=${tokens.refresh_token}`);
      if (tokens.access_token) {
        console.log(`GOOGLE_ACCESS_TOKEN=${tokens.access_token}`);
      }

      // Store tokens in environment for persistence
      if (tokens.refresh_token) {
        process.env.GOOGLE_REFRESH_TOKEN = tokens.refresh_token;
      }
      if (tokens.access_token) {
        process.env.GOOGLE_ACCESS_TOKEN = tokens.access_token;
      }

      return true;
    } catch (error) {
      logger.error("Error completing authentication", { error });
      return false;
    }
  }

  /**
   * Get the authenticated calendar instance
   */
  getCalendar() {
    return this.calendar;
  }

  /**
   * Check if authentication is valid
   */
  isAuthenticated(): boolean {
    return (
      this.oauth2Client.credentials &&
      (this.oauth2Client.credentials.access_token ||
        this.oauth2Client.credentials.refresh_token)
    );
  }
}

// Export a singleton instance
export const googleAuthService = new GoogleAuthService();
