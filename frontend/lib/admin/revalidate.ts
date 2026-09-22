export async function revalidateTags(tags: string[]): Promise<void> {
  try {
    await fetch("/api/revalidate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tags }),
    });
  } catch {
    // Best-effort; public pages still refresh via the time-based ISR window.
  }
}
