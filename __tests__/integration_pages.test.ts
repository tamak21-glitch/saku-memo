import splitLogsToPages, { appendLatestPages } from '../lib/pager';

describe('integration: initial split and subsequent additions', () => {
  it('locks initial pages and appends new logs without shifting locked pages', () => {
    // initial logs (newest->oldest)
    const initialLogs = [] as any[];
    // create 10 logs with ts descending
    for (let i = 10; i >= 1; i--) {
      initialLogs.push({ uid: 'u', text: `log${i}`, ts: i });
    }

    // measure function: simulate height so that each page fits 3 items
    const measure = (text: string) => 30; // constant small height
    const contentWidth = 200;
    const pageHeight = 100; // so roughly 3 items per page

    const locked = splitLogsToPages(initialLogs, measure as any, contentWidth, pageHeight, 12, 16, 4, 0);
    expect(locked.length).toBeGreaterThan(1);
    const lockedCopy = JSON.parse(JSON.stringify(locked));

    // simulate adding 1 newest log
    const newLog = { uid: 'u', text: 'newest', ts: 11 };
    const logsWithNew = [newLog, ...initialLogs];

    const pagesAfter = appendLatestPages(locked, logsWithNew as any);

    // locked should be unchanged
    expect(JSON.stringify(locked)).toBe(JSON.stringify(lockedCopy));

    // pagesAfter should be locked + one new page containing newest
    expect(pagesAfter.length).toBe(locked.length + 1);
    const lastPage = pagesAfter[pagesAfter.length - 1];
    expect(lastPage.length).toBe(1);
    expect(lastPage[0].text).toBe('newest');
  });
});
