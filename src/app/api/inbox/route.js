import { NextResponse } from "next/server";
import { Client } from "@notionhq/client";

// Initialize Notion Client
const notion = new Client({ auth: process.env.NOTION_API_KEY });
const databaseId = process.env.NOTION_ALL_DB_ID;

export async function GET() {
  if (!databaseId) return NextResponse.json({ error: "Missing DB ID" }, { status: 500 });

  try {
    const response = await notion.databases.query({
      database_id: databaseId,
      sorts: [{ timestamp: "created_time", direction: "descending" }],
    });

    const items = response.results.map((page) => ({
      id: page.id,
      name: page.properties.名前?.title[0]?.plain_text || "無題",
      memo: page.properties.メモ?.rich_text[0]?.plain_text || "",
      deadline: page.properties.期限?.date?.start || "",
      location: page.properties.場所?.rich_text[0]?.plain_text || "",
      isCompleted: page.properties.完了?.checkbox || false,
    }));

    return NextResponse.json(items);
  } catch (error) {
    console.error("Error fetching Inbox:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch data" }, { status: 500 });
  }
}

export async function POST(request) {
  if (!databaseId) return NextResponse.json({ error: "Missing DB ID" }, { status: 500 });

  try {
    const { name, memo, deadline, location } = await request.json();

    const properties = {
      名前: { title: [{ text: { content: name || "無題" } }] },
      完了: { checkbox: false },
    };

    if (memo) {
      properties.メモ = { rich_text: [{ text: { content: memo } }] };
    }

    if (deadline) {
      properties.期限 = { date: { start: deadline } };
    }

    if (location) {
      properties.場所 = { rich_text: [{ text: { content: location } }] };
    }

    const response = await notion.pages.create({
      parent: { database_id: databaseId },
      properties,
    });

    const newItem = {
      id: response.id,
      name,
      memo,
      deadline,
      location,
      isCompleted: false,
    };

    return NextResponse.json(newItem, { status: 201 });
  } catch (error) {
    console.error("Error creating entry in Inbox:", error);
    return NextResponse.json({ error: error.message || "Failed to create entry" }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    const { id, isCompleted } = await request.json();
    await notion.pages.update({
      page_id: id,
      properties: {
        完了: { checkbox: isCompleted },
      },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating Inbox entry:", error);
    return NextResponse.json({ error: error.message || "Failed to update entry" }, { status: 500 });
  }
}
