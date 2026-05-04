import { NextResponse } from "next/server";
import { Client } from "@notionhq/client";

// Initialize Notion Client (Tokens will be taken from env later)
// const notion = new Client({ auth: process.env.NOTION_TOKEN });

export async function POST(request) {
  try {
    const body = await request.json();
    const { content } = body;

    if (!content) {
      return NextResponse.json({ error: "Content is required" }, { status: 400 });
    }

    // TODO: Connect to actual Notion API using notion.pages.create
    /*
    await notion.pages.create({
      parent: { database_id: process.env.NOTION_DATABASE_ID },
      properties: {
        Name: { title: [{ text: { content: "Log Entry" } }] },
        Date: { date: { start: new Date().toISOString() } },
      },
      children: [
        {
          object: 'block',
          type: 'paragraph',
          paragraph: {
            rich_text: [{ type: 'text', text: { content } }],
          },
        },
      ],
    });
    */

    return NextResponse.json({ success: true, message: "Log saved to Notion" }, { status: 200 });
  } catch (error) {
    console.error("Error saving to Notion:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
