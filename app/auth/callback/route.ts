import { NextRequest, NextResponse } from "next/server";
import { googleAuthService } from "../google-auth";
import { Logger } from "../../utils/logger";

const logger = new Logger("Auth:Callback");

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    const error = searchParams.get("error");

    if (error) {
      logger.error("OAuth error received", { error });
      return NextResponse.redirect(
        new URL("/auth/error?error=" + encodeURIComponent(error), request.url)
      );
    }

    if (!code) {
      logger.error("No authorization code received");
      return NextResponse.redirect(
        new URL("/auth/error?error=no_code", request.url)
      );
    }

    logger.info("Received authorization code, completing authentication");

    // Complete the authentication
    const success = await googleAuthService.completeAuth(code);

    if (success) {
      logger.info("Authentication completed successfully");
      return NextResponse.redirect(new URL("/auth/success", request.url));
    } else {
      logger.error("Failed to complete authentication");
      return NextResponse.redirect(
        new URL("/auth/error?error=auth_failed", request.url)
      );
    }
  } catch (error) {
    logger.error("Error in callback handler", { error });
    return NextResponse.redirect(
      new URL("/auth/error?error=callback_error", request.url)
    );
  }
}
