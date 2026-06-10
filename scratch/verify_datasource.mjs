import { Client } from "@notionhq/client";
import fs from "fs";
import path from "path";

// Read environment variables from .env.local manually
const envLocalPath = path.resolve(process.cwd(), ".env.local");
if (fs.existsSync(envLocalPath)) {
  const envConfig = fs.readFileSync(envLocalPath, "utf-8");
  for (const line of envConfig.split("\n")) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#")) {
      const parts = trimmed.split("=");
      if (parts.length >= 2) {
        const key = parts[0].trim();
        const val = parts.slice(1).join("=").trim();
        process.env[key] = val;
      }
    }
  }
}

const auth = process.env.NOTION_API_KEY;
const inboxDbId = process.env.NOTION_INBOX_DB_ID;

if (!auth || !inboxDbId) {
  console.error("Missing NOTION_API_KEY or NOTION_INBOX_DB_ID in .env.local");
  process.exit(1);
}

console.log("Using API Key prefix:", auth.substring(0, 10) + "...");
console.log("Using Database ID:", inboxDbId);

const notion = new Client({
  auth: auth,
  notionVersion: "2025-09-03"
});

try {
  console.log("1. Retrieving database container to find data sources...");
  const db = await notion.databases.retrieve({ database_id: inboxDbId });
  console.log("Retrieve Database Success!");
  console.log("Database Title:", db.title[0]?.plain_text || "No Title");
  
  if (!db.data_sources || db.data_sources.length === 0) {
    console.error("No data sources found in the database container!");
    process.exit(1);
  }
  
  console.log("Data Sources found:", db.data_sources);
  const dataSourceId = db.data_sources[0].id;
  console.log("Selected data_source_id:", dataSourceId);
  
  console.log("\n2. Querying data source...");
  const queryResponse = await notion.dataSources.query({
    data_source_id: dataSourceId,
    page_size: 5
  });
  
  console.log("Query Success! Found entries count:", queryResponse.results.length);
  for (const page of queryResponse.results) {
    console.log(`- Page ID: ${page.id}, Name: ${page.properties.名前?.title[0]?.plain_text || "無題"}`);
  }
} catch (error) {
  console.error("Error executing verification:", error);
}
