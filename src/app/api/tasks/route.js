import { NextResponse } from "next/server";
import { Client } from "@notionhq/client";

// Initialize Notion Client
const notion = new Client({ auth: process.env.NOTION_API_KEY });
const databaseId = process.env.NOTION_TASKS_DB_ID;

export async function GET() {
  if (!databaseId) return NextResponse.json({ error: "Missing DB ID" }, { status: 500 });

  try {
    const response = await notion.databases.query({
      database_id: databaseId,
      sorts: [{ timestamp: "created_time", direction: "descending" }],
    });

    const tasks = response.results.map((page) => {
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

    return NextResponse.json(tasks.reverse());
  } catch (error) {
    console.error("Error fetching tasks:", error);
    return NextResponse.json({ error: "Failed to fetch tasks" }, { status: 500 });
  }
}

export async function POST(request) {
  if (!databaseId) return NextResponse.json({ error: "Missing DB ID" }, { status: 500 });

  try {
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
    return NextResponse.json({ error: "Failed to create task" }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    const { id, status } = await request.json();
    let notionStatus = "未アサイン";
    if (status === "done") notionStatus = "完了";
    if (status === "todo") notionStatus = "未着手";

    await notion.pages.update({
      page_id: id,
      properties: {
        Status: { select: { name: notionStatus } },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating task:", error);
    return NextResponse.json({ error: "Failed to update task" }, { status: 500 });
  }
}
