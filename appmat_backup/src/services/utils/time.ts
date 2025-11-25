export function formatTimestamp(ts: string) {
  return new Date(ts).toLocaleString("ms-MY");
}
