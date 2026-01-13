const fetch = require("node-fetch");

/**
 * Migration function to assign leagueId to old matches that don't have one.
 *
 * Usage: Call with body { "defaultLeagueId": "your-league-id" }
 * This function is idempotent - safe to run multiple times.
 */
module.exports = async ({ req, res, log, error }) => {
  const endpoint = process.env.APPWRITE_ENDPOINT;
  const projectId = process.env.APPWRITE_PROJECT_ID;
  const apiKey = process.env.APPWRITE_API_KEY;
  const databaseId = process.env.APPWRITE_DATABASE_ID || "pool-league";
  const matchesCollection = process.env.APPWRITE_MATCHES_COLLECTION_ID || "matches";

  let body = {};
  try {
    body = JSON.parse(req.body || "{}");
  } catch (e) {
    body = req.body || {};
  }

  const defaultLeagueId = body.defaultLeagueId;

  if (!defaultLeagueId) {
    error("defaultLeagueId is required in request body");
    return res.json({
      success: false,
      error: "defaultLeagueId required in request body. Example: { \"defaultLeagueId\": \"your-league-id\" }"
    }, 400);
  }

  if (!endpoint || !projectId || !apiKey) {
    error("Missing required environment variables");
    return res.json({
      success: false,
      error: "Missing APPWRITE_ENDPOINT, APPWRITE_PROJECT_ID, or APPWRITE_API_KEY"
    }, 500);
  }

  const headers = {
    "X-Appwrite-Project": projectId,
    "X-Appwrite-Key": apiKey,
    "Content-Type": "application/json",
  };

  let offset = 0;
  let updated = 0;
  let skipped = 0;
  let errors = [];
  const LIMIT = 100;

  log(`Starting migration with defaultLeagueId: ${defaultLeagueId}`);

  try {
    while (true) {
      const listUrl = `${endpoint}/databases/${databaseId}/collections/${matchesCollection}/documents?queries[]=${encodeURIComponent(JSON.stringify({ method: "limit", values: [LIMIT] }))}&queries[]=${encodeURIComponent(JSON.stringify({ method: "offset", values: [offset] }))}`;

      const listRes = await fetch(listUrl, { headers });

      if (!listRes.ok) {
        const errText = await listRes.text();
        error(`Failed to list documents: ${errText}`);
        return res.json({ success: false, error: `Failed to list documents: ${errText}` }, 500);
      }

      const data = await listRes.json();

      if (!data.documents || data.documents.length === 0) {
        log("No more documents to process");
        break;
      }

      log(`Processing batch at offset ${offset}, found ${data.documents.length} documents`);

      for (const doc of data.documents) {
        if (!doc.leagueId) {
          try {
            const updateUrl = `${endpoint}/databases/${databaseId}/collections/${matchesCollection}/documents/${doc.$id}`;
            const updateRes = await fetch(updateUrl, {
              method: "PATCH",
              headers,
              body: JSON.stringify({ leagueId: defaultLeagueId }),
            });

            if (updateRes.ok) {
              updated++;
              log(`Updated match ${doc.$id} with leagueId`);
            } else {
              const errText = await updateRes.text();
              errors.push({ docId: doc.$id, error: errText });
              error(`Failed to update ${doc.$id}: ${errText}`);
            }
          } catch (updateErr) {
            errors.push({ docId: doc.$id, error: updateErr.message });
            error(`Error updating ${doc.$id}: ${updateErr.message}`);
          }
        } else {
          skipped++;
        }
      }

      if (data.documents.length < LIMIT) {
        break;
      }
      offset += LIMIT;
    }

    log(`Migration complete. Updated: ${updated}, Skipped: ${skipped}, Errors: ${errors.length}`);

    return res.json({
      success: true,
      matchesUpdated: updated,
      matchesSkipped: skipped,
      errors: errors.length > 0 ? errors : undefined,
    });

  } catch (err) {
    error(`Migration failed: ${err.message}`);
    return res.json({ success: false, error: err.message }, 500);
  }
};
