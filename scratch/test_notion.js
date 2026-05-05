const { Client } = require("@notionhq/client");
require('dotenv').config({ path: '.env.local' });

const notion = new Client({ auth: process.env.NOTION_API_KEY });
console.log("Notion client keys:", Object.keys(notion));
console.log("Notion databases keys:", notion.databases ? Object.keys(notion.databases) : "undefined");

if (notion.databases && typeof notion.databases.query === 'function') {
    console.log("Success: notion.databases.query is a function");
} else {
    console.log("Failure: notion.databases.query is NOT a function");
}
