const fetch = require("node-fetch");

let _config = null;

const init = (endpoint, projectId, apiKey, databaseId) => {
  _config = { endpoint, projectId, apiKey, databaseId };
};

const headers = () => ({
  "X-Appwrite-Project": _config.projectId,
  "X-Appwrite-Key": _config.apiKey,
  "Content-Type": "application/json",
});

const baseUrl = () =>
  `${_config.endpoint}/databases/${_config.databaseId}/collections`;

const getDocument = async (collection, docId) => {
  const res = await fetch(`${baseUrl()}/${collection}/documents/${docId}`, {
    headers: headers(),
  });
  if (!res.ok) {
    const text = await res.text();
    const err = new Error(`Failed to get document: ${text}`);
    err.status = res.status;
    throw err;
  }
  return res.json();
};

const createDocument = async (collection, data, docId = null) => {
  const body = {
    documentId: docId || require("crypto").randomUUID(),
    data,
  };
  const res = await fetch(`${baseUrl()}/${collection}/documents`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    const err = new Error(`Failed to create document: ${text}`);
    err.status = res.status;
    throw err;
  }
  return res.json();
};

const updateDocument = async (collection, docId, data) => {
  const res = await fetch(`${baseUrl()}/${collection}/documents/${docId}`, {
    method: "PATCH",
    headers: headers(),
    body: JSON.stringify({ data }),
  });
  if (!res.ok) {
    const text = await res.text();
    const err = new Error(`Failed to update document: ${text}`);
    err.status = res.status;
    throw err;
  }
  return res.json();
};

const deleteDocument = async (collection, docId) => {
  const res = await fetch(`${baseUrl()}/${collection}/documents/${docId}`, {
    method: "DELETE",
    headers: headers(),
  });
  if (!res.ok) {
    const text = await res.text();
    const err = new Error(`Failed to delete document: ${text}`);
    err.status = res.status;
    throw err;
  }
  return true;
};

/**
 * Convert a legacy SDK-style query string like `equal("field", ["val"])`
 * into the JSON object format expected by Appwrite REST API 1.4+.
 * If the query is already a JSON object string, it is returned as-is.
 */
const toJsonQuery = (q) => {
  if (q.startsWith("{")) return q; // already JSON
  const match = q.match(/^(\w+)\("([^"]+)",\s*\[(.+)\]\)$/);
  if (!match) return q;
  const [, method, attribute, rawValues] = match;
  // Parse the values array — handles strings and numbers
  const values = rawValues.split(",").map((v) => {
    v = v.trim();
    if (v.startsWith('"') && v.endsWith('"')) return v.slice(1, -1);
    if (v === "true") return true;
    if (v === "false") return false;
    const n = Number(v);
    return Number.isNaN(n) ? v : n;
  });
  return JSON.stringify({ method, attribute, values });
};

const listDocuments = async (collection, queries = []) => {
  const params = queries
    .map((q) => `queries[]=${encodeURIComponent(toJsonQuery(q))}`)
    .join("&");
  const url = `${baseUrl()}/${collection}/documents${params ? `?${params}` : ""}`;
  const res = await fetch(url, { headers: headers() });
  if (!res.ok) {
    const text = await res.text();
    const err = new Error(`Failed to list documents: ${text}`);
    err.status = res.status;
    throw err;
  }
  return res.json();
};

module.exports = { init, getDocument, createDocument, updateDocument, deleteDocument, listDocuments };
