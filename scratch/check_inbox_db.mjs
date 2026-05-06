import { Client } from "@notionhq/client";
import { readFileSync } from "fs";

const envFile = readFileSync(".env.local", "utf-8");
const env = Object.fromEntries(
  envFile.split("\n")
    .filter(line => line.includes("=") && !line.startsWith("#"))
    .map(line => line.split("=").map(s => s.trim()))
);

const notion = new Client({ auth: env.NOTION_API_KEY });
const allDbId = env.NOTION_ALL_DB_ID;

console.log("=== ALL DB (Inbox) Properties ===");
const db = await notion.databases.retrieve({ database_id: allDbId });
console.log("Properties:", JSON.stringify(Object.keys(db.properties), null, 2));
console.log("\nProperty details:");
for (const [key, val] of Object.entries(db.properties)) {
  console.log(`  "${key}" -> type: ${val.type}`);
}
