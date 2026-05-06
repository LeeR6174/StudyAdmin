import { Client } from "@notionhq/client";
import { readFileSync } from "fs";

// Load .env.local manually
const envFile = readFileSync(".env.local", "utf-8");
const env = Object.fromEntries(
  envFile.split("\n")
    .filter(line => line.includes("=") && !line.startsWith("#"))
    .map(line => line.split("=").map(s => s.trim()))
);

const notion = new Client({ auth: env.NOTION_API_KEY });
const logsDbId = env.NOTION_LOGS_DB_ID;
const tasksDbId = env.NOTION_TASKS_DB_ID;

console.log("=== LOGS DB Properties ===");
const logsDb = await notion.databases.retrieve({ database_id: logsDbId });
console.log(JSON.stringify(Object.keys(logsDb.properties), null, 2));

console.log("\n=== TASKS DB Properties ===");
const tasksDb = await notion.databases.retrieve({ database_id: tasksDbId });
console.log(JSON.stringify(Object.keys(tasksDb.properties), null, 2));
