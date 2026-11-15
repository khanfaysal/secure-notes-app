const API_BASE = "http://localhost:5000/api";
const TOKEN_KEY = "secure-notes-token";
const USER_KEY = "secure-notes-user";

export function getSavedSession() {
  try {
    const user = JSON.parse(localStorage.getItem(USER_KEY) || "null");
    const token = localStorage.getItem(TOKEN_KEY) || "";
    return token && user ? { token, user } : null;
  } catch {
    return null;
  }
}

export function saveSession(session) {
  localStorage.setItem(TOKEN_KEY, session.token);
  localStorage.setItem(USER_KEY, JSON.stringify(session.user));
}

export function clearSavedSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export async function api(path, { method = "GET", body, auth = true } = {}) {
  const headers = { Accept: "application/json" };
  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
  }
  const token = auth ? localStorage.getItem(TOKEN_KEY) : null;
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const responseText = await response.text();
  let data = {};
  if (responseText) {
    try {
      data = JSON.parse(responseText);
    } catch {
      data = { message: responseText };
    }
  }

  if (!response.ok) {
    throw new Error(data.message || `Request failed (${response.status})`);
  }
  return data;
}
