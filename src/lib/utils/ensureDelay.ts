export async function ensureDelay(startMs: number, minDelayMs: number) {
  const elapsed = Date.now() - startMs;
  const remaining = Math.max(0, minDelayMs - elapsed);
  if (remaining > 0) {
    await new Promise((r) => setTimeout(r, remaining));
  }
}