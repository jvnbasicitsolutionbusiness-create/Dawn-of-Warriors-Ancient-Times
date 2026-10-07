export async function api(path, body, method) {
  let response;
  try {
    response = await fetch(`/api${path}`, {
      method: method || (body ? "POST" : "GET"),
      credentials: "same-origin",
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch (error) {
    const message =
      "The campaign server is offline. Start it with npm run dev, then reload the game.";
    const wrapped = Error(message);
    wrapped.cause = error;
    throw wrapped;
  }

  const text = await response.text();
  let data = null;

  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      const htmlHint = text.includes("<!doctype") || text.includes("<html");
      const message = htmlHint
        ? "The campaign server did not respond with JSON. Make sure the frontend and /api are served by the game server."
        : "The server returned an invalid response.";
      const error = Error(message);
      error.status = response.status;
      throw error;
    }
  }

  if (!response.ok) {
    const error = Error(
      data?.error || "The server could not complete this request.",
    );
    error.status = response.status;
    error.code = data?.code;
    throw error;
  }

  return data;
}
