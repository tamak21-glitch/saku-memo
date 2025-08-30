"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { db, auth } from "../lib/firebase";
import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  orderBy,
  limit,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import type { User } from "firebase/auth";
import type { DocumentData } from "firebase/firestore";

type MemoItem = {
  uid: string;
  text: string;
  ts: number;
};

export default function Page() {
  const [text, setText] = useState("");
  const [logs, setLogs] = useState<MemoItem[]>([]);
  const taRef = useRef<HTMLTextAreaElement | null>(null);
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveActive, setSaveActive] = useState(false);
  const [reviewActive, setReviewActive] = useState(false);

  // 認証チェック＆未ログインなら /login へリダイレクト
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (!u) {
        router.replace("/login");
      } else {
        setUser(u);
      }
    });
    return () => unsub();
  }, [router]);

  // Firestoreからメモ取得（最新50件のみ）
  useEffect(() => {
    if (!user) return;
    const fetchLogs = async () => {
      const q = query(
        collection(db, "memos"),
        where("uid", "==", user.uid),
        orderBy("ts", "desc"),
        limit(50)
      );
      const snapshot = await getDocs(q);
      setLogs(snapshot.docs.map((doc) => doc.data() as MemoItem));
    };
    fetchLogs();
  }, [user]);

  // 保存のたびに Firestore へ反映（ローカル状態に即追加）
  const save = async () => {
    const trimmed = text.trim();
    if (!trimmed || !user) return;
    try {
      setSaving(true);
      await addDoc(collection(db, "memos"), {
        uid: user.uid,
        text: trimmed,
        ts: Date.now(),
      });
  setText("");

      // 保存後にFirestoreから再取得
      const q = query(
        collection(db, "memos"),
        where("uid", "==", user.uid),
        orderBy("ts", "desc"),
        limit(50)
      );
      const snapshot = await getDocs(q);
      setLogs(snapshot.docs.map((doc) => doc.data() as MemoItem));
    } catch (e: any) {
      console.error("Firestore保存エラー:", e);
      alert("保存に失敗しました: " + e.message);
    } finally {
      setSaving(false);
    }
  };

  const formatted = useMemo(
    () =>
      logs.map((l) => ({
        ...l,
        date: new Date(l.ts).toLocaleString(),
      })),
    [logs]
  );

  // ボタンのアクティブ色制御（長押し時のみ色変更、クリック/タップは即反応）
  const saveBtnColor = saving
    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
    : saveActive
    ? "bg-blue-200 text-blue-700"
    : "bg-gray-100 hover:bg-gray-200 text-black";

  const reviewBtnColor = reviewActive
    ? "bg-blue-200 text-blue-700"
    : "bg-gray-100 hover:bg-gray-200 text-black";

  return (
    <main className="min-h-dvh bg-white relative flex flex-col items-center justify-center text-black">
      <textarea
        ref={taRef}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={"考えたこととか、感じたことを書く"}
        className="w-full h-full min-h-dvh resize-none rounded-none p-8 outline-none focus:outline-none text-lg placeholder:text-gray-400 bg-transparent text-black"
        autoFocus
      />
      <button
        onMouseDown={() => setSaveActive(true)}
        onMouseUp={() => setSaveActive(false)}
        onMouseLeave={() => setSaveActive(false)}
        onTouchStart={() => setSaveActive(true)}
        onTouchEnd={() => setSaveActive(false)}
        onClick={save}
        disabled={saving}
        className={`fixed right-6 bottom-6 rounded-full px-7 py-3 text-base shadow-lg font-semibold transition ${saveBtnColor}`}
      >
        {saving ? "保存中..." : "保存する"}
      </button>
      <button
        onMouseDown={() => setReviewActive(true)}
        onMouseUp={() => setReviewActive(false)}
        onMouseLeave={() => setReviewActive(false)}
        onTouchStart={() => setReviewActive(true)}
        onTouchEnd={() => setReviewActive(false)}
        onClick={() => router.push("/review")}
        className={`fixed left-6 bottom-6 rounded-full px-7 py-3 text-base shadow-lg font-semibold transition ${reviewBtnColor}`}
      >
        振り返る
      </button>
    </main>
  );
}