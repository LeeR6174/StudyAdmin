import { NextResponse } from "next/server";
import { Client } from "@notionhq/client";

// Initialize Notion Client helper
const getNotionClient = () => new Client({ auth: process.env.NOTION_API_KEY });
const databaseId = process.env.NOTION_TASKS_DB_ID;

export async function GET() {
  if (!databaseId) {
    console.error("NOTION_TASKS_DB_ID is not defined in environment variables");
    return NextResponse.json({ error: "Configuration Error: Missing NOTION_TASKS_DB_ID" }, { status: 500 });
  }

  try {
    const notion = getNotionClient();
    let allResults = [];
    let hasMore = true;
    let cursor = undefined;

    while (hasMore) {
      const response = await notion.databases.query({
        database_id: databaseId,
        sorts: [{ timestamp: "created_time", direction: "ascending" }],
        start_cursor: cursor,
      });
      allResults = [...allResults, ...response.results];
      hasMore = response.has_more;
      cursor = response.next_cursor;
    }

    const tasks = allResults.map((page) => {
      const statusName = page.properties.Status?.select?.name;
      let internalStatus = "backlog"; // default
      if (statusName === "完了") internalStatus = "done";
      else if (statusName === "未着手") internalStatus = "todo";
      else if (statusName === "未アサイン") internalStatus = "backlog";

      return {
        id: page.id,
        title: page.properties.Name?.title[0]?.plain_text || "無題",
        status: internalStatus,
        project: page.properties.Project?.rich_text[0]?.plain_text || "",
      };
    });

    return NextResponse.json(tasks);
  } catch (error) {
    console.error("Error fetching tasks:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch tasks" }, { status: 500 });
  }
}

export async function POST(request) {
  if (!databaseId) {
    console.error("NOTION_TASKS_DB_ID is not defined in environment variables");
    return NextResponse.json({ error: "Configuration Error: Missing NOTION_TASKS_DB_ID" }, { status: 500 });
  }

  try {
    const notion = getNotionClient();
    const { title, project, status = "未アサイン" } = await request.json();

    const response = await notion.pages.create({
      parent: { database_id: databaseId },
      properties: {
        Name: { title: [{ text: { content: title } }] },
        Status: { select: { name: status } },
        Project: { rich_text: [{ text: { content: project || "" } }] },
      },
    });

    const newTask = {
      id: response.id,
      title,
      status: status === "未着手" ? "todo" : "backlog",
      project: project || "",
    };

    return NextResponse.json(newTask, { status: 201 });
  } catch (error) {
    console.error("Error creating task:", error);
    return NextResponse.json({ error: error.message || "Failed to create task" }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    const notion = getNotionClient();
    const { id, title, project, status } = await request.json();
    const properties = {};

    if (title) properties.Name = { title: [{ text: { content: title } }] };
    if (project) properties.Project = { rich_text: [{ text: { content: project } }] };
    if (status) {
      let notionStatus = "未アサイン";
      if (status === "done") notionStatus = "完了";
      if (status === "todo") notionStatus = "未着手";
      properties.Status = { select: { name: notionStatus } };
    }

    await notion.pages.update({
      page_id: id,
      properties,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating task:", error);
    return NextResponse.json({ error: error.message || "Failed to update task" }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const notion = getNotionClient();
    const { id } = await request.json();

    await notion.pages.update({
      page_id: id,
      archived: true,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting task:", error);
    return NextResponse.json({ error: error.message || "Failed to delete task" }, { status: 500 });
  }
}
