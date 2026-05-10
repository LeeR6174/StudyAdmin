import { NextResponse } from "next/server";
import { Client } from "@notionhq/client";

export const dynamic = "force-dynamic";

const getNotionClient = () => new Client({ auth: process.env.NOTION_API_KEY });
const databaseId = process.env.NOTION_ROLE_LETTERING_DB_ID;

export async function GET() {
  if (!databaseId) {
    return NextResponse.json({ error: "Missing NOTION_ROLE_LETTERING_DB_ID" }, { status: 500 });
  }

  try {
    const notion = getNotionClient();
    
    // Get the most recent entry to find "Last Week's Trouble"
    const response = await notion.databases.query({
      database_id: databaseId,
      sorts: [{ timestamp: "created_time", direction: "descending" }],
      page_size: 5,
    });

    const items = response.results.map(page => ({
      id: page.id,
      date: page.created_time,
      answer: page.properties.先週のお悩み回答?.rich_text[0]?.plain_text || "",
      threeThings: page.properties.今週の3つのコト?.rich_text[0]?.plain_text || "",
      thisWeekTrouble: page.properties.今週のお悩み?.rich_text[0]?.plain_text || "",
    }));

    // The "Last Week's Trouble" for a NEW entry is the "This Week's Trouble" of the LATEST entry
    const lastTrouble = items.length > 0 ? items[0].thisWeekTrouble : "（履歴なし）";

    return NextResponse.json({ items, lastTrouble });
  } catch (error) {
    console.error("Error fetching Role Lettering:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  if (!databaseId) {
    return NextResponse.json({ error: "Missing NOTION_ROLE_LETTERING_DB_ID" }, { status: 500 });
  }

  try {
    const notion = getNotionClient();
    const { answer, threeThings, thisWeekTrouble } = await request.json();

    const properties = {
      名前: { title: [{ text: { content: `${new Date().toLocaleDateString()} のレター` } }] },
      先週のお悩み回答: { rich_text: [{ text: { content: answer || "" } }] },
      今週の3つのコト: { rich_text: [{ text: { content: threeThings || "" } }] },
      今週のお悩み: { rich_text: [{ text: { content: thisWeekTrouble || "" } }] },
    };

    await notion.pages.create({
      parent: { database_id: databaseId },
      properties,
    });

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error("Error creating Role Lettering:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
