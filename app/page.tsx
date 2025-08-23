"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { auth, login, logout } from "../lib/firebase";
import { onAuthStateChanged, type User } from "firebase/auth";

type MemoItem = { id: string; text: string; ts: number };

const STORAGE_KEY = "saku-memo.logs.v1";

export default function Page() {
  // --- メモ状態（ローカル保存のMVPそのまま） ---
  const [text, setText] = useState("");
  const [logs, setLogs] = useState<MemoItem[]>([]);
  const [showLog, setShowLog] = useState(false);
  const taRef = useRef<HTMLTextAreaElement | null>(null);
  const router = useRouter();

  // 認証チェック＆未ログインなら /login へリダイレクト
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.replace("/login");
      }
    });
    return () => unsub();
  }, [router]);

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
    <main className="min-h-dvh bg-white text-gray-800 relative">
      <textarea
        ref={taRef}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={onKeyDown}
        placeholder={"思ったことをすぐ書く!!"}
        className="w-full h-full min-h-dvh resize-none rounded-none p-8 outline-none focus:outline-none text-lg placeholder:text-gray-400 bg-transparent"
        autoFocus
      />
      <button
        onClick={save}
        className="fixed right-6 bottom-6 rounded-full px-7 py-3 text-base shadow-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold transition"
      >
        保存
      </button>
    </main>
  );
}
