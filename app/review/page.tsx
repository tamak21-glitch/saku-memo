"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { db, auth } from "../../lib/firebase";
import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
  limit,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

export default function ReviewPage() {
  const [logs, setLogs] = useState([]);
  const [user, setUser] = useState(null);
  const router = useRouter();

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
      setLogs(snapshot.docs.map((doc) => doc.data()));
    };
    fetchLogs();
  }, [user]);

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
      <button
        onClick={() => router.push("/")}
        className="fixed left-6 bottom-6 rounded-full px-7 py-3 text-base shadow-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold transition"
      >
        記載画面に戻る
      </button>
      {formatted.length === 0 ? (
        <p className="text-sm text-gray-500">まだメモはありません。</p>
      ) : (
        <ul className="space-y-3 w-full max-w-xl">
          {formatted.map((l, idx) => (
            <li key={idx} className="rounded-xl p-4 bg-gray-50 shadow">
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