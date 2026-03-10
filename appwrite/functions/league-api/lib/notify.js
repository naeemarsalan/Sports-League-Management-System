const fetch = require("node-fetch");

let _config = null;

const init = (endpoint, projectId, apiKey) => {
  _config = { endpoint, projectId, apiKey };
};

const sendNotification = async (type, userId, data, leagueId = null) => {
  try {
    const payload = { type, userId, data };
    if (leagueId) payload.leagueId = leagueId;

    const url = `${_config.endpoint}/functions/send-push/executions`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "X-Appwrite-Project": _config.projectId,
        "X-Appwrite-Key": _config.apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        body: JSON.stringify(payload),
        async: true,
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      console.warn(`Notification failed: ${text}`);
    }
  } catch (err) {
    console.warn(`Notification error: ${err.message}`);
  }
};

module.exports = { init, sendNotification };
