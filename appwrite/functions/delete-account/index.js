const fetch = require("node-fetch");

/**
 * Deletes a user's account and all associated data.
 *
 * This function:
 * 1. Deletes the user's profile document
 * 2. Deletes all league memberships (and updates member counts)
 * 3. Deletes the user's Appwrite account
 *
 * Security: Only the authenticated user can delete their own account.
 */
module.exports = async ({ req, res, log, error }) => {
  const endpoint = process.env.APPWRITE_ENDPOINT;
  const projectId = process.env.APPWRITE_PROJECT_ID;
  const apiKey = process.env.APPWRITE_API_KEY;
  const databaseId = process.env.APPWRITE_DATABASE_ID;
  const profilesCollectionId = process.env.APPWRITE_PROFILES_COLLECTION_ID;
  const leagueMembersCollectionId = process.env.APPWRITE_LEAGUE_MEMBERS_COLLECTION_ID;
  const leaguesCollectionId = process.env.APPWRITE_LEAGUES_COLLECTION_ID;

  if (!endpoint || !projectId || !apiKey || !databaseId) {
    error("Missing required environment variables");
    return res.json({ success: false, error: "Server configuration error" }, 500);
  }

  // Get the authenticated user's ID from the request header
  const userId = req.headers["x-appwrite-user-id"];
  if (!userId) {
    return res.json({ success: false, error: "Authentication required" }, 401);
  }

  const headers = {
    "X-Appwrite-Project": projectId,
    "X-Appwrite-Key": apiKey,
    "Content-Type": "application/json",
  };

  const errors = [];

  try {
    // 1. Delete the user's profile document
    if (profilesCollectionId) {
      try {
        const profilesUrl = `${endpoint}/databases/${databaseId}/collections/${profilesCollectionId}/documents?queries[]=${encodeURIComponent(JSON.stringify(["equal(\"userId\", [\"" + userId + "\"])"]))}`;
        const profilesRes = await fetch(profilesUrl, { headers });
        if (profilesRes.ok) {
          const profilesData = await profilesRes.json();
          for (const doc of profilesData.documents || []) {
            const delRes = await fetch(
              `${endpoint}/databases/${databaseId}/collections/${profilesCollectionId}/documents/${doc.$id}`,
              { method: "DELETE", headers }
            );
            if (delRes.ok) {
              log(`Deleted profile ${doc.$id}`);
            } else {
              const errText = await delRes.text();
              error(`Failed to delete profile ${doc.$id}: ${errText}`);
              errors.push(`profile:${doc.$id}`);
            }
          }
        }
      } catch (err) {
        error(`Error deleting profiles: ${err.message}`);
        errors.push("profiles");
      }
    }

    // 2. Delete league memberships and update member counts
    if (leagueMembersCollectionId) {
      try {
        const membersUrl = `${endpoint}/databases/${databaseId}/collections/${leagueMembersCollectionId}/documents?queries[]=${encodeURIComponent(JSON.stringify(["equal(\"userId\", [\"" + userId + "\"])"]))}`;
        const membersRes = await fetch(membersUrl, { headers });
        if (membersRes.ok) {
          const membersData = await membersRes.json();
          for (const membership of membersData.documents || []) {
            // If approved member, decrement league member count
            if (membership.status === "approved" && leaguesCollectionId && membership.leagueId) {
              try {
                // Get current league
                const leagueRes = await fetch(
                  `${endpoint}/databases/${databaseId}/collections/${leaguesCollectionId}/documents/${membership.leagueId}`,
                  { headers }
                );
                if (leagueRes.ok) {
                  const league = await leagueRes.json();
                  const newCount = Math.max(0, (league.memberCount || 1) - 1);
                  await fetch(
                    `${endpoint}/databases/${databaseId}/collections/${leaguesCollectionId}/documents/${membership.leagueId}`,
                    {
                      method: "PATCH",
                      headers,
                      body: JSON.stringify({ memberCount: newCount }),
                    }
                  );
                  log(`Updated member count for league ${membership.leagueId}: ${newCount}`);
                }
              } catch (err) {
                error(`Error updating league count: ${err.message}`);
              }
            }

            // Delete the membership document
            const delRes = await fetch(
              `${endpoint}/databases/${databaseId}/collections/${leagueMembersCollectionId}/documents/${membership.$id}`,
              { method: "DELETE", headers }
            );
            if (delRes.ok) {
              log(`Deleted membership ${membership.$id}`);
            } else {
              const errText = await delRes.text();
              error(`Failed to delete membership ${membership.$id}: ${errText}`);
              errors.push(`membership:${membership.$id}`);
            }
          }
        }
      } catch (err) {
        error(`Error deleting memberships: ${err.message}`);
        errors.push("memberships");
      }
    }

    // 3. Delete the user account
    try {
      const deleteUserRes = await fetch(`${endpoint}/users/${userId}`, {
        method: "DELETE",
        headers,
      });
      if (deleteUserRes.ok) {
        log(`Deleted user account ${userId}`);
      } else {
        const errText = await deleteUserRes.text();
        error(`Failed to delete user account: ${errText}`);
        return res.json({ success: false, error: "Failed to delete user account" }, 500);
      }
    } catch (err) {
      error(`Error deleting user account: ${err.message}`);
      return res.json({ success: false, error: err.message }, 500);
    }

    if (errors.length > 0) {
      log(`Account deleted with some data cleanup errors: ${errors.join(", ")}`);
    }

    return res.json({ success: true, errors: errors.length > 0 ? errors : undefined });

  } catch (err) {
    error(`Unexpected error: ${err.message}`);
    return res.json({ success: false, error: err.message }, 500);
  }
};
