import { createMcpHandler } from "@vercel/mcp-adapter";
import { z } from "zod";
import { env } from "@/app/config/env";
import { googleAuthService } from "../auth/google-auth";
import { Logger } from "../utils/logger";

const logger = new Logger("MCP:Server");

const handler = createMcpHandler(
  async (server) => {
    // Initialize Google Calendar authentication on server startup
    logger.info("Initializing Google Calendar authentication...");
    const isAuthenticated = await googleAuthService.initialize();

    if (!isAuthenticated) {
      logger.warn(
        "Google Calendar token is currently not authenticated. Some tools may not work properly."
      );
    } else {
      logger.info("Google Calendar authentication initialized successfully");
    }
    server.tool(
      "create_medical_appointment",
      "Schedule a medical appointment on Google Calendar",
      {
        summary: z.string().describe("Title of the medical appointment"),
        description: z
          .string()
          .optional()
          .describe("Additional details about the appointment"),
        start: z
          .string()
          .describe(
            "Start time in ISO format (e.g., '2024-07-08T14:00:00-04:00')"
          ),
        end: z
          .string()
          .describe(
            "End time in ISO format (e.g., '2024-07-08T15:00:00-04:00')"
          ),
        location: z
          .string()
          .optional()
          .describe("Medical facility address or room number"),
        attendees: z
          .array(z.string().email())
          .optional()
          .describe("List of attendee emails (patient, doctor, etc.)"),
        patientName: z.string().optional().describe("Patient's name"),
        doctorName: z.string().optional().describe("Doctor's name"),
        appointmentType: z
          .string()
          .optional()
          .describe("Type of appointment (consultation, follow-up, etc.)"),
        timeZone: z
          .string()
          .default("America/New_York")
          .describe("Time zone for the appointment"),
      },
      async ({
        summary,
        description,
        start,
        end,
        location,
        attendees,
        patientName,
        doctorName,
        appointmentType,
        timeZone,
      }) => {
        try {
          // Check if authentication is available
          if (!googleAuthService.isAuthenticated()) {
            throw new Error(
              "Your Google Calendar token was not processed. Please run the authentication setup first."
            );
          }

          const calendar = googleAuthService.getCalendar();
          const oauth2Client = googleAuthService.getOAuth2Client();

          let details = description || "";
          if (patientName) details += `\nPatient: ${patientName}`;
          if (doctorName) details += `\nDoctor: ${doctorName}`;
          if (appointmentType) details += `\nType: ${appointmentType}`;

          // Create the event with proper typing
          const eventResource = {
            summary,
            description: details.trim(),
            location,
            start: {
              dateTime: start,
              timeZone,
            },
            end: {
              dateTime: end,
              timeZone,
            },
            attendees: attendees?.map((email) => ({ email })),
            reminders: {
              useDefault: false,
              overrides: [
                { method: "email" as const, minutes: 24 * 60 },
                { method: "popup" as const, minutes: 30 },
              ],
            },
            colorId: "11", //TODO: Cycle colors
          };

          const response = await calendar.events.insert({
            calendarId: "primary",
            requestBody: eventResource,
            sendNotifications: true,
            auth: oauth2Client,
          });

          return {
            content: [
              {
                type: "text",
                text:
                  `Medical appointment "${summary}" created successfully!\n` +
                  `Event ID: ${response.data.id}\n` +
                  `Event Link: ${response.data.htmlLink}\n` +
                  `Start: ${start}\n` +
                  `End: ${end}` +
                  (location ? `\nLocation: ${location}` : "") +
                  (attendees?.length
                    ? `\nAttendees: ${attendees.join(", ")}`
                    : ""),
              },
            ],
          };
        } catch (error: unknown) {
          console.error("Error creating medical appointment:", error);
          if (error && typeof error === "object" && "code" in error) {
            const apiError = error as { code: number; message: string };
            if (apiError.code === 401) {
              throw new Error(
                "Authentication failed. Please check your Google Calendar credentials."
              );
            } else if (apiError.code === 403) {
              throw new Error(
                "Insufficient permissions. Please check your Google Calendar API access."
              );
            } else if (apiError.code === 400) {
              throw new Error(`Invalid request: ${apiError.message}`);
            }
          }

          const errorMessage =
            error instanceof Error ? error.message : "Unknown error occurred";
          throw new Error(
            `Failed to create medical appointment: ${errorMessage}`
          );
        }
      }
    );

    server.tool(
      "list_upcoming_appointments",
      "List upcoming medical appointments from Google Calendar",
      {
        maxResults: z
          .number()
          .default(10)
          .describe("Maximum number of appointments to return"),
        timeMin: z
          .string()
          .optional()
          .describe("Start time filter in ISO format"),
        timeMax: z
          .string()
          .optional()
          .describe("End time filter in ISO format"),
      },
      async ({ maxResults, timeMin, timeMax }) => {
        try {
          // Check if authentication is available
          if (!googleAuthService.isAuthenticated()) {
            throw new Error(
              "Your Google Calendar token was not processed. Please run the authentication setup first."
            );
          }

          const calendar = googleAuthService.getCalendar();
          const oauth2Client = googleAuthService.getOAuth2Client();

          const response = await calendar.events.list({
            calendarId: "primary",
            timeMin: timeMin || new Date().toISOString(),
            timeMax: timeMax,
            maxResults,
            singleEvents: true,
            orderBy: "startTime",
            auth: oauth2Client,
          });

          const events = response.data.items || [];

          if (events.length === 0) {
            return {
              content: [
                {
                  type: "text",
                  text: "No upcoming appointments found.",
                },
              ],
            };
          }

          const appointmentsList = events
            .map((event: any, index: number) => {
              const start =
                event.start?.dateTime ||
                event.start?.date ||
                "No time specified";
              const end =
                event.end?.dateTime || event.end?.date || "No end time";
              return (
                `${index + 1}. ${event.summary || "No title"}\n` +
                `   Time: ${start} - ${end}\n` +
                `   Location: ${event.location || "Not specified"}\n` +
                `   Description: ${event.description || "No description"}`
              );
            })
            .join("\n\n");

          return {
            content: [
              {
                type: "text",
                text: `Upcoming appointments:\n\n${appointmentsList}`,
              },
            ],
          };
        } catch (error: unknown) {
          console.error("Error listing appointments:", error);
          const errorMessage =
            error instanceof Error ? error.message : "Unknown error occurred";
          throw new Error(`Failed to list appointments: ${errorMessage}`);
        }
      }
    );
  },
  {
    capabilities: {
      tools: {
        create_medical_appointment: {
          description:
            "Create a medical appointment on Google Calendar with patient and doctor details",
        },
        list_upcoming_appointments: {
          description: "List upcoming appointments from Google Calendar",
        },
      },
    },
  },
  {
    redisUrl: env.REDIS_URL,
    basePath: "",
    verboseLogs: true,
    maxDuration: 60,
  }
);

export { handler as GET, handler as POST, handler as DELETE };
