import { NextResponse } from "next/server";
import { Client } from "@notionhq/client";

export const dynamic = "force-dynamic";

const getNotionClient = () => new Client({ auth: process.env.NOTION_API_KEY });
const databaseId = process.env.NOTION_NOTES_DB_ID;

export async function GET() {
  if (!databaseId) {
    return NextResponse.json({ error: "Configuration Error: Missing NOTION_NOTES_DB_ID" }, { status: 500 });
  }

  try {
    const notion = getNotionClient();
    let allResults = [];
    let hasMore = true;
    let cursor = undefined;

    while (hasMore) {
      const response = await notion.databases.query({
        database_id: databaseId,
        sorts: [
          {
            timestamp: "created_time",
            direction: "descending",
          }
        ],
        start_cursor: cursor,
      });
      allResults = [...allResults, ...response.results];
      hasMore = response.has_more;
      cursor = response.next_cursor;
    }

    const items = allResults.map((page) => ({
      id: page.id,
      name: page.properties.名前?.title[0]?.plain_text || "無題",
      category: page.properties.カテゴリ?.select?.name || "未分類",
      content: page.properties.内容?.rich_text[0]?.plain_text || "",
      // Fallback to system created_time if the custom property is empty
      createdAt: page.properties.作成日時?.created_time || page.created_time,
    }));

    return NextResponse.json(items);
  } catch (error) {
    console.error("Error fetching Notes:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch data" }, { status: 500 });
  }
}

export async function POST(request) {
  if (!databaseId) {
    return NextResponse.json({ error: "Configuration Error: Missing NOTION_NOTES_DB_ID" }, { status: 500 });
  }

  try {
    const notion = getNotionClient();
    const { name, category, content } = await request.json();

    const properties = {
      名前: { title: [{ text: { content: name || "無題" } }] },
      カテゴリ: { select: { name: category } },
      内容: { rich_text: [{ text: { content: content || "" } }] },
    };

    const response = await notion.pages.create({
      parent: { database_id: databaseId },
      properties,
    });

    return NextResponse.json({ id: response.id }, { status: 201 });
  } catch (error) {
    console.error("Error creating Note:", error);
    return NextResponse.json({ error: error.message || "Failed to create entry" }, { status: 500 });
  }
}
