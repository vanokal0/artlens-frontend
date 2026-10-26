export const apiBase = (
  import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8000"
).replace(/\/$/, "");

type ValidationError = {
  loc?: unknown;
  msg?: unknown;
};

function validationMessage(detail: unknown[]): string {
  const messages = detail.flatMap((value) => {
    if (!value || typeof value !== "object") return [];
    const error = value as ValidationError;
    if (typeof error.msg !== "string") return [];
    const location = Array.isArray(error.loc)
      ? error.loc.filter((part) => part !== "body").join(".")
      : "";
    return [location ? `${location}: ${error.msg}` : error.msg];
  });
  return messages.length
    ? messages.join(" ")
    : "The submitted values are invalid. Please review them and try again.";
}

async function errorMessage(response: Response): Promise<string> {
  try {
    const body: unknown = await response.json();
    if (body && typeof body === "object" && "detail" in body) {
      const detail = (body as { detail: unknown }).detail;
      if (typeof detail === "string") return detail;
      if (Array.isArray(detail)) return validationMessage(detail);
    }
  } catch {
    // Fall through to the status-based message when the response is not JSON.
  }
  return `The backend could not process the request (${response.status}). Please try again.`;
}

export async function requestJson<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${apiBase}${path}`, init);
  } catch (cause) {
    if (cause instanceof DOMException && cause.name === "AbortError") throw cause;
    throw new Error("Could not connect to the ArtLens backend.", { cause });
  }
  if (!response.ok) throw new Error(await errorMessage(response));
  try {
    return (await response.json()) as T;
  } catch {
    throw new Error("The backend returned an unreadable response.");
  }
}
