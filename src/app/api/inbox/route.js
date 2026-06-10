import { NextResponse } from "next/server";
import { getNotionClient, resolveDataSourceId } from "@/lib/notion";

export const dynamic = "force-dynamic";

const databaseId = process.env.NOTION_INBOX_DB_ID;

export async function GET() {
  if (!databaseId) {
    return NextResponse.json({ error: "Configuration Error: Missing NOTION_INBOX_DB_ID" }, { status: 500 });
  }

  try {
    const notion = getNotionClient();
    const dataSourceId = await resolveDataSourceId(notion, databaseId, "NOTION_INBOX_DATA_SOURCE_ID");
    let allResults = [];
    let hasMore = true;
    let cursor = undefined;

    while (hasMore) {
      const response = await notion.dataSources.query({
        data_source_id: dataSourceId,
        sorts: [{ timestamp: "created_time", direction: "ascending" }],
        start_cursor: cursor,
      });
      allResults = [...allResults, ...response.results];
      hasMore = response.has_more;
      cursor = response.next_cursor;
    }

    const items = allResults.map((page) => ({
      id: page.id,
      name: page.properties.名前?.title[0]?.plain_text || "無題",
      memo: page.properties.メモ?.rich_text[0]?.plain_text || "",
      deadline: page.properties.期限?.date?.start || null,
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
  if (!databaseId) {
    console.error("NOTION_INBOX_DB_ID is not defined in environment variables");
    return NextResponse.json({ error: "Configuration Error: Missing NOTION_INBOX_DB_ID" }, { status: 500 });
  }

  try {
    const notion = getNotionClient();
    const dataSourceId = await resolveDataSourceId(notion, databaseId, "NOTION_INBOX_DATA_SOURCE_ID");
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
      parent: { type: "data_source_id", data_source_id: dataSourceId },
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
    const notion = getNotionClient();
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

