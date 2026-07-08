export function escapeHtml(value: unknown): string {
  if (value == null) {
    return "";
  }

  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function safeHttpUrl(value: unknown): string {
  if (value == null || value === "") {
    return "";
  }

  try {
    const parsed = new URL(String(value));
    if (parsed.protocol === "http:" || parsed.protocol === "https:") {
      return escapeHtml(parsed.toString());
    }
  } catch {
    return "";
  }

  return "";
}
