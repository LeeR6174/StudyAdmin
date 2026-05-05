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
      filter: {
        and: [
          {
            property: "タグ",
            select: {
              equals: "タスク",
            },
          },
          {
            property: "完了",
            checkbox: {
              equals: false,
            },
          },
        ],
      },
      sorts: [{ property: "日付", direction: "descending" }],
    });

    const items = response.results.map((page) => ({
      id: page.id,
      name: page.properties.名前?.title[0]?.plain_text || "無題",
      tag: page.properties.タグ?.select?.name || "",
      reflection: page.properties.振り返り?.rich_text[0]?.plain_text || "",
      date: page.properties.日付?.date?.start || "",
      isCompleted: page.properties.完了?.checkbox || false,
    }));

    return NextResponse.json(items);
  } catch (error) {
    console.error("Error fetching ALL DB:", error);
    return NextResponse.json({ error: "Failed to fetch data" }, { status: 500 });
  }
}

export async function POST(request) {
  if (!databaseId) return NextResponse.json({ error: "Missing DB ID" }, { status: 500 });

  try {
    const { name, tag, reflection, date } = await request.json();

    const properties = {
      名前: { title: [{ text: { content: name || "無題" } }] },
      タグ: { select: { name: tag } },
      完了: { checkbox: false },
    };

    if (reflection) {
      properties.振り返り = { rich_text: [{ text: { content: reflection } }] };
    }

    if (date) {
      properties.日付 = { date: { start: date } };
    }

    const response = await notion.pages.create({
      parent: { database_id: databaseId },
      properties,
    });

    const newItem = {
      id: response.id,
      name,
      tag,
      reflection,
      date,
      isCompleted: false,
    };

    return NextResponse.json(newItem, { status: 201 });
  } catch (error) {
    console.error("Error creating entry in ALL DB:", error);
    return NextResponse.json({ error: "Failed to create entry" }, { status: 500 });
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
    console.error("Error updating ALL DB entry:", error);
    return NextResponse.json({ error: "Failed to update entry" }, { status: 500 });
  }
}
