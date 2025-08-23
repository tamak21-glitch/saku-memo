"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { login, auth } from "../../lib/firebase";
import { onAuthStateChanged } from "firebase/auth";

export default function LoginPage() {
  const router = useRouter();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) {
        router.replace("/");
      }
    });
    return () => unsub();
  }, [router]);

  return (
    <main className="min-h-dvh flex flex-col items-center justify-center bg-white">
      <h1 className="mb-8 text-2xl font-bold text-gray-700">サクメモ ログイン</h1>
      <button
        onClick={login}
        className="rounded-full px-7 py-3 text-base shadow-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold transition"
      >
        Googleでログイン
      </button>
    </main>
  );
}