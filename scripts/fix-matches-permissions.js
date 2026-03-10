#!/usr/bin/env node
/**
 * One-off script to fix the matches collection permissions in Appwrite.
 *
 * Usage:
 *   APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1 \
 *   APPWRITE_PROJECT_ID=your-project-id \
 *   APPWRITE_API_KEY=your-api-key \
 *   node scripts/fix-matches-permissions.js
 */

const { Client, Databases } = require("node-appwrite");

const endpoint = process.env.APPWRITE_ENDPOINT;
const projectId = process.env.APPWRITE_PROJECT_ID;
const apiKey = process.env.APPWRITE_API_KEY;
const databaseId = process.env.APPWRITE_DATABASE_ID || "pool-league";
const collectionId = process.env.APPWRITE_MATCHES_COLLECTION_ID || "matches";

if (!endpoint || !projectId || !apiKey) {
  console.error(
    "Missing required env vars: APPWRITE_ENDPOINT, APPWRITE_PROJECT_ID, APPWRITE_API_KEY"
  );
  process.exit(1);
}

async function main() {
  const client = new Client()
    .setEndpoint(endpoint)
    .setProject(projectId)
    .setKey(apiKey);

  const db = new Databases(client);

  try {
    await db.updateCollection(databaseId, collectionId, "Matches", [
      'read("users")',
      'create("users")',
      'update("users")',
      'delete("users")',
    ]);
    console.log(
      `Successfully updated permissions for collection "${collectionId}" in database "${databaseId}".`
    );
  } catch (error) {
    console.error("Failed to update collection permissions:", error.message);
    process.exit(1);
  }
}

main();
