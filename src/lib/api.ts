export async function apiFetch<T>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(url, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers ?? {}),
    },
  });

  let body: unknown = null;

  try {
    body = await response.json();
  } catch {
    // Response does not contain JSON.
  }

  if (!response.ok) {
    const message =
      body &&
      typeof body === "object" &&
      "error" in body
        ? String((body as { error: unknown }).error)
        : "Request failed";

    if (
      response.status === 401 &&
      typeof window !== "undefined"
    ) {
      window.location.href = "/login";
    }

    throw new Error(message);
  }

  return body as T;
}
