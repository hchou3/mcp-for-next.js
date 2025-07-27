#!/usr/bin/env node

import { createInterface } from "readline";
import { googleAuthService } from "../app/auth/google-auth";
import { Logger } from "../app/utils/logger";

const logger = new Logger("Setup:Auth");

async function setupAuthentication() {
  console.log("Google Calendar Authentication Setup");
  console.log("=====================================");
  console.log();

  try {
    // Try to initialize with existing tokens
    const isAuthenticated = await googleAuthService.initialize();

    if (isAuthenticated) {
      console.log("Authentication already configured!");
      console.log("Your MCP server is ready to use Google Calendar features.");
      return;
    }

    // If not authenticated, prompt for new authentication
    console.log("No valid authentication found.");
    console.log("Let's set up Google Calendar authentication...");
    console.log();

    // Generate auth URL using the centralized service
    const authUrl = googleAuthService.generateAuthUrl();

    console.log("Please visit the following URL to authorize access:");
    console.log(authUrl);
    console.log(
      "\nAfter authorization, you'll receive a code. Please enter it below:"
    );

    const rl = createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    const code = await new Promise<string>((resolve) => {
      rl.question("Enter the authorization code from Google: ", resolve);
    });

    rl.close();

    const success = await googleAuthService.completeAuth(code);

    if (success) {
      console.log("\nSetup completed successfully!");
      console.log("You can now start your MCP server.");
    } else {
      console.log("\nSetup failed. Please try again.");
      process.exit(1);
    }
  } catch (error) {
    logger.error("Error during authentication setup", { error });
    console.error(
      "Setup failed:",
      error instanceof Error ? error.message : String(error)
    );
    process.exit(1);
  }
}

// Run the setup if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  setupAuthentication();
}

export { setupAuthentication };
