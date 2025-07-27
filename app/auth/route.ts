import { NextRequest, NextResponse } from "next/server";
import { googleAuthService } from "./google-auth";
import { Logger } from "../utils/logger";

const logger = new Logger("Auth:Route");

export async function GET(request: NextRequest) {
  try {
    // Check if already authenticated
    const isAuthenticated = await googleAuthService.initialize();

    if (isAuthenticated) {
      return NextResponse.json({
        status: "authenticated",
        message: "Already authenticated with Google Calendar",
      });
    }

    // Generate auth URL for new authentication
    const authUrl = googleAuthService.generateAuthUrl();

    logger.info("Generated authentication URL for new setup");

    return NextResponse.json({
      status: "needs_auth",
      authUrl,
      message: "Authentication required",
    });
  } catch (error) {
    logger.error("Error in auth route", { error });
    return NextResponse.json(
      {
        status: "error",
        message: "Failed to generate authentication URL",
      },
      { status: 500 }
    );
  }
}
