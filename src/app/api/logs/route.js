import { NextResponse } from "next/server";
import { Client } from "@notionhq/client";

// Initialize Notion Client
const notion = new Client({ auth: process.env.NOTION_API_KEY });
const databaseId = process.env.NOTION_LOGS_DB_ID;

export async function GET() {
  if (!databaseId) {
    console.error("NOTION_LOGS_DB_ID is not defined in environment variables");
    return NextResponse.json({ error: "Configuration Error: Missing NOTION_LOGS_DB_ID" }, { status: 500 });
  }

  try {
    const response = await notion.databases.query({
      database_id: databaseId,
      sorts: [{ property: "Date", direction: "descending" }],
    });

    const logs = response.results.map((page) => ({
      id: page.id,
      content: page.properties.Name?.title[0]?.plain_text || "無題",
      type: page.properties.Type?.select?.name || "壁打ち",
      date: page.properties.Date?.date?.start || page.created_time,
      isTeacherLog: page.properties.Type?.select?.name === "コーチメモ",
    }));

    return NextResponse.json(logs);
  } catch (error) {
    console.error("Error fetching logs:", error);
    return NextResponse.json({ error: "Failed to fetch logs" }, { status: 500 });
  }
}

export async function POST(request) {
  if (!databaseId) {
    console.error("NOTION_LOGS_DB_ID is not defined in environment variables");
    return NextResponse.json({ error: "Configuration Error: Missing NOTION_LOGS_DB_ID" }, { status: 500 });
  }

  try {
    const { content, isTeacherLog } = await request.json();
    const type = isTeacherLog ? "コーチメモ" : "壁打ち";
    const dateStr = new Date().toISOString(); // ISO-8601 format

    await notion.pages.create({
      parent: { database_id: databaseId },
      properties: {
        Name: { title: [{ text: { content: content } }] },
        Type: { select: { name: type } },
        Date: { date: { start: dateStr } },
      },
    });

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error("Error creating log:", error);
    return NextResponse.json({ error: "Failed to create log" }, { status: 500 });
  }
}
