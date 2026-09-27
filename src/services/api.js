export async function api(path, body, method) {
  const response = await fetch(`/api${path}`, {
    method: method || (body ? "POST" : "GET"),
    credentials: "same-origin",
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await response.json();
  if (!response.ok) {
    const error = Error(
      data.error || "The server could not complete this request.",
    );
    error.status = response.status;
    throw error;
  }
  return data;
}
