"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { auth, login, logout } from "../lib/firebase";
import { onAuthStateChanged, type User } from "firebase/auth";

type MemoItem = { id: string; text: string; ts: number };

const STORAGE_KEY = "saku-memo.logs.v1";

export default function Page() {
  // --- 認証状態 ---
  const [user, setUser] = useState<User | null>(null);
  useEffect(() => onAuthStateChanged(auth, setUser), []);

  // --- メモ状態（ローカル保存のMVPそのまま） ---
  const [text, setText] = useState("");
  const [logs, setLogs] = useState<MemoItem[]>([]);
  const [showLog, setShowLog] = useState(false);
  const taRef = useRef<HTMLTextAreaElement | null>(null);

  // 起動時に localStorage から復元
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as MemoItem[];
        setLogs(parsed);
      }
    } catch {}
  }, []);

  // 保存のたびに localStorage へ反映
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(logs));
    } catch {}
  }, [logs]);

  // Enter = 保存 / Shift+Enter = 改行
  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      save();
    }
  };

  const save = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    const item: MemoItem = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      text: trimmed,
      ts: Date.now(),
    };
    setLogs((prev) => [item, ...prev]);
    setText("");
    // 入力欄にフォーカス戻す
    requestAnimationFrame(() => taRef.current?.focus());
  };

  const formatted = useMemo(
    () =>
      logs.map((l) => ({
        ...l,
        date: new Date(l.ts).toLocaleString(),
      })),
    [logs]
  );

  return (
    <main className="min-h-dvh bg-white text-gray-800">
      {/* ヘッダー（ログインUI＋履歴トグル） */}
      <header className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b bg-white/80 px-4 py-3 backdrop-blur">
        <div className="flex items-center gap-3">
          <span className="font-semibold">サクメモ</span>
          <button
            onClick={() => setShowLog((v) => !v)}
            className="rounded border px-3 py-1 text-sm hover:bg-gray-50"
            aria-pressed={showLog}
          >
            {showLog ? "入力へ" : "履歴"}
          </button>
        </div>

        <div className="flex items-center gap-3">
          {user ? (
            <>
              <span className="hidden text-sm md:inline">
                こんにちは、{user.displayName ?? user.email ?? "ユーザー"} さん
              </span>
              <button
                onClick={logout}
                className="rounded border px-3 py-1 text-sm hover:bg-gray-50"
              >
                ログアウト
              </button>
            </>
          ) : (
            <button
              onClick={login}
              className="rounded border px-3 py-1 text-sm hover:bg-gray-50"
            >
              Googleでログイン
            </button>
          )}
        </div>
      </header>

      {/* 本体 */}
      {!showLog ? (
        <section className="p-4">
          <div className="mx-auto max-w-3xl">
            <textarea
              ref={taRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder={"思ったことをすぐ書く。\nEnterで保存 / Shift+Enterで改行"}
              className="h-[70vh] w-full resize-none rounded-2xl border p-4 outline-none focus:ring"
              autoFocus
            />
            <div className="mt-3 flex items-center justify-between">
              <span className="text-xs text-gray-500">
                Enterで保存 / Shift+Enterで改行
              </span>
              <button
                onClick={save}
                className="rounded-xl border px-4 py-2 text-sm hover:bg-gray-50"
              >
                保存
              </button>
            </div>
          </div>
        </section>
      ) : (
        <section className="p-4">
          <div className="mx-auto max-w-3xl">
            {formatted.length === 0 ? (
              <p className="text-sm text-gray-500">まだメモはありません。</p>
            ) : (
              <ul className="space-y-3">
                {formatted.map((l) => (
                  <li
                    key={l.id}
                    className="rounded-2xl border p-4 hover:bg-gray-50"
                  >
                    <div className="mb-1 text-xs text-gray-500">{l.date}</div>
                    <pre className="whitespace-pre-wrap font-sans text-[15px] leading-relaxed">
                      {l.text}
                    </pre>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      )}
    </main>
  );
}
