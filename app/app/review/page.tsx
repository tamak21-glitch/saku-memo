"use client";
import { useEffect, useMemo, useState } from "react";

type MemoItem = { id: string; text: string; ts: number };
const STORAGE_KEY = "saku-memo.logs.v1";

export default function ReviewPage() {
  const [logs, setLogs] = useState<MemoItem[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        setLogs(JSON.parse(raw));
      }
    } catch {}
  }, []);

  const formatted = useMemo(
    () =>
      logs.map((l) => ({
        ...l,
        date: new Date(l.ts).toLocaleString(),
      })),
    [logs]
  );

  return (
    <main className="min-h-dvh bg-white text-gray-800 flex flex-col items-center p-8">
      <h2 className="text-2xl font-bold mb-8 text-gray-700">振り返り一覧</h2>
      {formatted.length === 0 ? (
        <p className="text-sm text-gray-500">まだメモはありません。</p>
      ) : (
        <ul className="space-y-3 w-full max-w-xl">
          {formatted.map((l) => (
            <li key={l.id} className="rounded-xl p-4 bg-gray-50 shadow">
              <div className="mb-1 text-xs text-gray-400">{l.date}</div>
              <pre className="whitespace-pre-wrap font-sans text-[16px] leading-relaxed text-gray-700">
                {l.text}
              </pre>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}