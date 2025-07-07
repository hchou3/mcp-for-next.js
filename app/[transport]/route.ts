import { createMcpHandler } from "@vercel/mcp-adapter";
import { z } from "zod";
import { env, calendar, oauth2Client } from "@/app/config/env";
import { google } from "googleapis";

const handler = createMcpHandler(
  async (server) => {
    server.tool(
      "echo",
      "Echo a message for testing",
      {
        message: z.string(),
      },
      async ({ message }) => ({
        content: [{ type: "text", text: `Tool echo: ${message}` }],
      })
    );

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
          // Build comprehensive description
          let fullDescription = description || "";

          if (patientName) fullDescription += `\nPatient: ${patientName}`;
          if (doctorName) fullDescription += `\nDoctor: ${doctorName}`;
          if (appointmentType) fullDescription += `\nType: ${appointmentType}`;

          // Create the event with proper typing
          const eventResource = {
            summary,
            description: fullDescription.trim(),
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
                { method: "email" as const, minutes: 24 * 60 }, // 24 hours before
                { method: "popup" as const, minutes: 30 }, // 30 minutes before
              ],
            },
            colorId: "11", // Red color for medical appointments
          };
          const response = await calendar.events.insert({
            calendarId: "primary",
            requestBody: eventResource,
            sendNotifications: true, // Send email notifications
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

          // Handle specific Google API errors with proper typing
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
            .map((event, index) => {
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
        echo: {
          description: "Echo a message for testing",
        },
        create_medical_appointment: {
          description:
            "Create a medical appointment on Google Calendar with patient and doctor details",
        },
        list_upcoming_appointments: {
          description:
            "List upcoming medical appointments from Google Calendar",
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
