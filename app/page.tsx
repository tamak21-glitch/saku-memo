"use client";

import { useEffect, useRef, useState } from "react";

export default function SakuMemoMobile() {
  // 1行メモをどんどん残す（ローカル保存付き）
  const [text, setText] = useState("");
  const [logs, setLogs] = useState<string[]>([]);
  const [showLog, setShowLog] = useState(false);
  const areaRef = useRef<HTMLTextAreaElement | null>(null);

  // --- 永続化（localStorage） ---
  useEffect(() => {
    try {
      const saved = localStorage.getItem("saku_memo_logs");
      if (saved) setLogs(JSON.parse(saved));
    } catch {}
  }, []);
  useEffect(() => {
    try {
      localStorage.setItem("saku_memo_logs", JSON.stringify(logs));
    } catch {}
  }, [logs]);

  const save = () => {
    const v = text.trim();
    if (!v) return;
    setLogs((prev) => [...prev, v]);
    setText("");
    areaRef.current?.focus();
  };

  // エンターで保存、Shift+Enterで改行
  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      save();
    }
  };

  return (
    <div className="min-h-[100svh] bg-white">
      {!showLog ? (
        <>
          {/* 右上：過去メモボタン */}
          <div className="fixed top-3 right-3 z-10">
            <button
              onClick={() => setShowLog(true)}
              className="rounded-full px-3 py-1 text-sm bg-black text-white/90 shadow"
              aria-label="過去のメモを見る"
            >
              履歴
            </button>
          </div>

          {/* 画面全体がメモ（テキストエリアが全面） */}
          <textarea
            ref={areaRef}
            autoFocus
            placeholder={`ここが全部メモ。\n思いついたらすぐ書いて、Enterで保存（Shift+Enterで改行）`}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={onKeyDown}
            className="fixed inset-0 w-full h-[100svh] resize-none p-4 text-[18px] leading-7 outline-none bg-amber-50/40 text-gray-800 placeholder-gray-400"
          />
        </>
      ) : (
        <div className="min-h-[100svh] flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 border-b">
            <h1 className="font-semibold">過去のメモ</h1>
            <button
              onClick={() => setShowLog(false)}
              className="rounded px-3 py-1 text-sm bg-black text-white/90"
            >
              戻る
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            {logs.length === 0 ? (
              <p className="text-gray-500">まだ何も書かれていません。</p>
            ) : (
              <ul className="space-y-3">
                {logs.map((l, i) => (
                  <li key={i} className="border-b pb-3 whitespace-pre-wrap break-words text-gray-800">{l}</li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}