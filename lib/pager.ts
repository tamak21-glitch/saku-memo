type MemoItem = {
  uid: string;
  text: string;
  ts: number;
};

export type MeasureFn = (text: string, contentWidth: number, fontSize: number, lineHeight: number) => number;

/**
 * Split logs into pages. Returns pages in oldest->newest order (left->right).
 * measure is injected to allow deterministic tests.
 */
export function splitLogsToPages(
  logs: MemoItem[],
  measure: MeasureFn,
  contentWidth: number,
  pageHeight: number,
  FONT_SIZE: number,
  LINE_HEIGHT: number,
  ITEM_GAP: number,
  TOP_PADDING: number
): MemoItem[][] {
  if (!logs || logs.length === 0) return [];
  const arr: MemoItem[][] = [];
  let current: MemoItem[] = [];
  let currentHeight = TOP_PADDING;
  const formatTimestamp = (ts: number) =>
    `${new Date(ts).toLocaleDateString("ja-JP", { year: "numeric", month: "2-digit", day: "2-digit", weekday: "short" })} ${new Date(ts).toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" })}`;

  for (const l of logs) {
    const h = Math.ceil(measure(`${formatTimestamp(l.ts)}\n${l.text}`, contentWidth, FONT_SIZE, LINE_HEIGHT));
    const totalH = h + ITEM_GAP;
    if (currentHeight + totalH > pageHeight && current.length > 0) {
      arr.push(current);
      current = [];
      currentHeight = TOP_PADDING;
    }
    current.push(l);
    currentHeight += totalH;
  }
  if (current.length > 0) arr.push(current);

  // logs are expected in descending order (newest first). We want pages oldest->newest.
  return arr.slice().reverse();
}

export default splitLogsToPages;

/**
 * Given lockedPages (oldest->newest) and logs (newest->oldest), produce pages = lockedPages + latestPages
 * lockedPages must not be mutated.
 */
export function appendLatestPages(
  lockedPages: MemoItem[][],
  logs: MemoItem[]
): MemoItem[][] {
  const lockedCount = lockedPages.reduce((s, p) => s + p.length, 0);
  // logs: newest->oldest. lockedPages contains oldest->newest entries (a suffix of logs).
  // latestLogs must be the prefix of logs not included in lockedPages.
  const latestCount = Math.max(0, logs.length - lockedCount);
  const latestLogs = logs.slice(0, latestCount);
  const latestPages: MemoItem[][] = [];
  // latestLogs is newest->oldest; convert to oldest->newest when creating pages
  for (const l of latestLogs.slice().reverse()) latestPages.push([l]);
  return [...lockedPages, ...latestPages];
}
