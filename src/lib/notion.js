import { Client } from "@notionhq/client";

// Simple in-memory cache to avoid querying databases.retrieve repeatedly
const dataSourceIdCache = {};

export const getNotionClient = () => {
  return new Client({
    auth: process.env.NOTION_API_KEY,
    notionVersion: "2025-09-03",
  });
};

/**
 * Resolves the data source ID for a given database ID.
 * If the envVarName parameter is provided and process.env[envVarName] is defined,
 * it returns that value immediately.
 * Otherwise, it retrieves the database container from Notion dynamically,
 * extracts the first data source, caches the result, and returns it.
 */
export async function resolveDataSourceId(notion, databaseId, envVarName) {
  if (envVarName && process.env[envVarName]) {
    return process.env[envVarName];
  }

  if (dataSourceIdCache[databaseId]) {
    return dataSourceIdCache[databaseId];
  }

  try {
    console.log(`[Notion Integration] Resolving data source ID for database ${databaseId}...`);
    const db = await notion.databases.retrieve({ database_id: databaseId });
    if (db.data_sources && db.data_sources.length > 0) {
      const dataSourceId = db.data_sources[0].id;
      dataSourceIdCache[databaseId] = dataSourceId;
      console.log(`[Notion Integration] Resolved database ${databaseId} to data source ${dataSourceId}`);
      return dataSourceId;
    } else {
      throw new Error(`Database ${databaseId} has no data sources associated with it.`);
    }
  } catch (error) {
    console.error(`[Notion Integration] Failed to retrieve data source for database ${databaseId}:`, error);
    throw error;
  }
}
