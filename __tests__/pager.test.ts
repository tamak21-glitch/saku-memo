import splitLogsToPages from '../lib/pager';

const dummyMeasure = (text: string, contentWidth: number) => {
  // simplistic: height equals number of lines * 20
  const lines = text.split('\n').length;
  return lines * 20;
};

describe('splitLogsToPages', () => {
  it('splits logs into pages and returns oldest->newest', () => {
    // logs in newest->oldest
    const logs = [
      { uid: 'u', text: 'a', ts: 3 },
      { uid: 'u', text: 'b', ts: 2 },
      { uid: 'u', text: 'c', ts: 1 },
    ];
    const pages = splitLogsToPages(logs, dummyMeasure as any, 100, 40, 12, 16, 4, 0);
    // With small pageHeight, expect multiple pages; pages should be oldest->newest
    expect(pages.length).toBeGreaterThan(0);
    // oldest should contain ts:1
    const oldest = pages[0];
    expect(oldest.some((m) => m.ts === 1)).toBe(true);
    const newest = pages[pages.length - 1];
    expect(newest.some((m) => m.ts === 3)).toBe(true);
  });
});

import { appendLatestPages } from '../lib/pager';

describe('appendLatestPages', () => {
  it('appends latest logs as new pages without mutating lockedPages', () => {
    const locked = [[{ uid: 'u', text: 'old1', ts: 1 }], [{ uid: 'u', text: 'old2', ts: 2 }]];
    const logs = [
      { uid: 'u', text: 'new1', ts: 4 },
      { uid: 'u', text: 'new2', ts: 3 },
      { uid: 'u', text: 'old2', ts: 2 },
      { uid: 'u', text: 'old1', ts: 1 },
    ];
    const before = JSON.stringify(locked);
    const pages = appendLatestPages(locked, logs as any);
    expect(JSON.stringify(locked)).toBe(before); // not mutated
    expect(pages.length).toBe(locked.length + 2);
    expect(pages[pages.length - 1][0].text).toBe('new1');
  });
  it('given lockedPages produced by split, adding a new newest log does not shift locked pages', () => {
    // initial logs (newest->oldest)
    const initialLogs = [
      { uid: 'u', text: 'n3', ts: 6 },
      { uid: 'u', text: 'n2', ts: 5 },
      { uid: 'u', text: 'n1', ts: 4 },
      { uid: 'u', text: 'o2', ts: 3 },
      { uid: 'u', text: 'o1', ts: 2 },
    ];
    // use splitLogsToPages with a measure that makes 2 items per page
    const measure = (text: string) => 20; // small constant
    const locked = require('../lib/pager').default(initialLogs, measure, 100, 100, 12, 16, 4, 0);
    const lockedCopy = JSON.parse(JSON.stringify(locked));

    // now simulate logs with one new newest entry prepended
    const newLogs = [{ uid: 'u', text: 'newest', ts: 7 }, ...initialLogs];
    const pagesAfter = require('../lib/pager').appendLatestPages(locked, newLogs as any);

    // locked should be unchanged
    expect(JSON.stringify(locked)).toBe(JSON.stringify(lockedCopy));
    // pagesAfter should equal locked + one new page containing newest
    expect(pagesAfter.length).toBe(locked.length + 1);
    expect(pagesAfter[pagesAfter.length - 1][0].text).toBe('newest');
  });
});
