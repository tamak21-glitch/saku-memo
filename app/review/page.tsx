"use client";
import { useEffect, useMemo, useRef, useState } from "react";
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
import type { User } from "firebase/auth";
import { useSwipeable } from "react-swipeable";

type MemoItem = {
  uid: string;
  text: string;
  ts: number;
};

export default function ReviewPage() {
  const [logs, setLogs] = useState<MemoItem[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [pageHeight, setPageHeight] = useState<number | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const [pages, setPages] = useState<MemoItem[][]>([]);
  const router = useRouter();

  // 画面高さを CSS 変数にセット（アドレスバー対応・リサイズ対応）
  useEffect(() => {
    const setAppHeight = () => {
      document.documentElement.style.setProperty(
        "--app-height",
        `${window.innerHeight}px`
      );
      setPageHeight(window.innerHeight);
    };
    setAppHeight();
    let t: number | undefined;
    const onResize = () => {
      // debounce
      window.clearTimeout(t);
      t = window.setTimeout(setAppHeight, 120);
    };
    window.addEventListener("resize", onResize);
    window.addEventListener("orientationchange", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("orientationchange", onResize);
      window.clearTimeout(t);
    };
  }, []);

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
        limit(200) // たくさん表示できるように
      );
      const snapshot = await getDocs(q);
      setLogs(snapshot.docs.map((doc) => doc.data() as MemoItem));
    };
    fetchLogs();
  }, [user]);

  // レイアウト設定（必要に応じて調整）
  const DOT_SIZE = 24;
  const DOT_COLOR = "#efece6";
  const FONT_SIZE = 18;
  const LINE_HEIGHT = 34;
  const ITEM_GAP = 32; // li 間のギャップ
  const TOP_PADDING = 36; // main 上余白（計測から除外）
  const [page, setPage] = useState(0);

  // 正確なページ分割：計測用 DOM を生成して実際の高さを取得する
  useEffect(() => {
    if (!pageHeight) return;
    const contentWidth =
      contentRef.current?.clientWidth ?? Math.min(window.innerWidth - 64, 680);

    const measurer = document.createElement("div");
    Object.assign(measurer.style, {
      position: "absolute",
      visibility: "hidden",
      left: "-9999px",
      top: "0px",
      width: `${contentWidth}px`,
      fontFamily:
        "'Kosugi Maru', 'Indie Flower', cursive, 'Noto Sans JP', sans-serif",
      fontSize: `${FONT_SIZE}px`,
      lineHeight: `${LINE_HEIGHT}px`,
      whiteSpace: "pre-wrap",
      boxSizing: "border-box",
      padding: "0",
      margin: "0",
    } as CSSStyleDeclaration);
    document.body.appendChild(measurer);

    const arr: MemoItem[][] = [];
    let current: MemoItem[] = [];
    let currentHeight = TOP_PADDING;

    const formatTimestamp = (ts: number) =>
      `${new Date(ts).toLocaleDateString("ja-JP", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        weekday: "short",
      })} ${new Date(ts).toLocaleTimeString("ja-JP", {
        hour: "2-digit",
        minute: "2-digit",
      })}`;

    // logsは最新→古い順なので、ページ分割はそのまま
    for (const l of logs) {
      measurer.innerText = `${formatTimestamp(l.ts)}\n${l.text}`;
      const h = Math.ceil(measurer.getBoundingClientRect().height);
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

    document.body.removeChild(measurer);

    // ページ配列を逆順にして、右端が最新ページ
    const ordered = arr.length ? arr.reverse() : [[]];
    setPages(ordered);
    // 初期表示は右端（最新ページ）
    setPage(Math.max(ordered.length - 1, 0));
  }, [logs, pageHeight, FONT_SIZE, LINE_HEIGHT, ITEM_GAP, TOP_PADDING]);

  const handlers = useSwipeable({
    // 最新ページから左スワイプで過去へ（index+1）、右スワイプで新しい（index-1）
    onSwipedLeft: () => setPage((p) => Math.min(p + 1, pages.length - 1)),
    onSwipedRight: () => setPage((p) => Math.max(0, p - 1)),
    trackMouse: true,
  });

  // キーボード・ボタンも同様に逆に
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const targetTag = (e.target as HTMLElement)?.tagName;
      if (targetTag && ["INPUT", "TEXTAREA", "SELECT", "BUTTON"].includes(targetTag))
        return;
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        setPage((p) => Math.max(0, p - 1)); // 左矢印で左（昔のページ）へ
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        setPage((p) => Math.min(p + 1, pages.length - 1)); // 右矢印で右（新しいページ）へ
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [pages.length]);

  // 左右ボタンも逆に
  return (
    <main
      {...handlers}
      className="flex flex-col items-center justify-start bg-white"
      style={{
        position: "relative",
        height: "var(--app-height)",
        minHeight: "var(--app-height)",
        maxHeight: "var(--app-height)",
        overflow: "hidden",
        touchAction: "pan-y", // 横スワイプを拾いやすくする
        WebkitTouchCallout: "none",
        backgroundImage: `radial-gradient(${DOT_COLOR} 1px, transparent 1px)`,
        backgroundSize: `${DOT_SIZE}px ${DOT_SIZE}px`,
        fontFamily: "'Kosugi Maru', 'Indie Flower', cursive, sans-serif",
        paddingTop: "36px",
        boxSizing: "border-box",
      }}
    >
      {/* PCで分かりやすくする左/右ボタン（タッチでも使える） */}
      <button
        onClick={() => setPage((p) => Math.min(p + 1, pages.length - 1))}
        aria-label="前のページ"
        style={{
          position: "absolute",
          left: 8,
          top: "50%",
          transform: "translateY(-50%)",
          zIndex: 60,
          background: "rgba(255,255,255,0.9)",
          border: "1px solid rgba(0,0,0,0.08)",
          borderRadius: 999,
          padding: "8px 10px",
          display: pages.length > 1 ? "block" : "none",
        }}
      >
        ‹
      </button>

      <button
        onClick={() => setPage((p) => Math.max(0, p - 1))}
        aria-label="次のページ"
        style={{
          position: "absolute",
          right: 8,
          top: "50%",
          transform: "translateY(-50%)",
          zIndex: 60,
          background: "rgba(255,255,255,0.9)",
          border: "1px solid rgba(0,0,0,0.08)",
          borderRadius: 999,
          padding: "8px 10px",
          display: pages.length > 1 ? "block" : "none",
        }}
      >
        ›
      </button>

      <div
        className="w-full"
        style={{
          height: "100%",
          overflow: "hidden",
          paddingLeft: "32px", // 左余白を確保
          paddingRight: "32px", // 右余白も確保して中央カラム感
          boxSizing: "border-box",
          display: "flex",
          justifyContent: "center",
        }}
      >
        <div
          ref={contentRef}
          style={{
            width: "100%",
            maxWidth: 680, // 可読幅を確保（調整可）
            height: "100%",
            overflow: "hidden",
            boxSizing: "border-box",
          }}
        >
          {pages.length === 0 || pages[page].length === 0 ? (
            <p className="text-sm text-gray-500 text-center">まだメモはありません。</p>
          ) : (
            <ul
              style={{
                margin: 0,
                padding: 0,
                listStyle: "none",
                display: "flex",
                flexDirection: "column",
                gap: "32px",
              }}
            >
              {/* ページ内の投稿は新しいものが下に来るように逆順で表示 */}
              {[...pages[page]].reverse().map((l, idx) => (
                <li key={idx} style={{ margin: 0, padding: 0 }}>
                  <div
                    style={{
                      color: "#9CA3AF",
                      fontSize: 12,
                      marginBottom: 8,
                      letterSpacing: "0.2px",
                    }}
                  >
                    {new Date(l.ts).toLocaleDateString("ja-JP", {
                      year: "numeric",
                      month: "2-digit",
                      day: "2-digit",
                      weekday: "short",
                    })}{" "}
                    {new Date(l.ts).toLocaleTimeString("ja-JP", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                  <div
                    style={{
                      fontFamily:
                        "'Kosugi Maru', 'Indie Flower', cursive, 'Noto Sans JP', sans-serif",
                      fontSize: `${FONT_SIZE}px`,
                      lineHeight: `${LINE_HEIGHT}px`,
                      color: "#111827",
                      whiteSpace: "pre-wrap",
                      margin: 0,
                    }}
                  >
                    {l.text}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* 左下のボタンと同じラインに設定ボタンを追加 */}
      <div
        style={{
          position: "fixed",
          left: 0,
          right: 0,
          bottom: 24,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          zIndex: 51,
          pointerEvents: "auto",
          paddingLeft: 24,
          paddingRight: 24,
        }}
      >
        <button
          onClick={() => router.push("/")}
          className="rounded-full px-7 py-3 text-base shadow-lg bg-gray-100 hover:bg-gray-200 text-black font-semibold transition"
        >
          記載画面に戻る
        </button>
        <button
          onClick={() => router.push("/settings")}
          aria-label="設定"
          className="rounded-full px-4 py-3 shadow-lg bg-gray-100 hover:bg-gray-200 text-black transition flex items-center"
          style={{ fontSize: 20 }}
        >
          <span style={{ display: "inline-block", verticalAlign: "middle" }}>
            {/* より設定っぽいギアアイコン（Material Design風） */}
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 15.5A3.5 3.5 0 1 0 12 8.5a3.5 3.5 0 0 0 0 7zm7.43-4.27c.04-.34.07-.68.07-1.23s-.03-.89-.07-1.23l1.54-1.2a.5.5 0 0 0 .12-.65l-1.46-2.53a.5.5 0 0 0-.61-.22l-1.81.73a7.03 7.03 0 0 0-1.3-.75l-.27-1.92A.5.5 0 0 0 15.5 2h-3a.5.5 0 0 0-.5.42l-.27 1.92c-.46.19-.9.44-1.3.75l-1.81-.73a.5.5 0 0 0-.61.22L2.36 7.81a.5.5 0 0 0 .12.65l1.54 1.2c-.04.34-.07.68-.07 1.23s.03.89.07 1.23l-1.54 1.2a.5.5 0 0 0-.12.65l1.46 2.53c.14.24.44.33.68.22l1.81-.73c.4.31.84.56 1.3.75l.27 1.92c.04.25.25.42.5.42h3c.25 0 .46-.17.5-.42l.27-1.92c.46-.19.9-.44 1.3-.75l1.81.73c.24.1.54.02.68-.22l1.46-2.53a.5.5 0 0 0-.12-.65l-1.54-1.2z"
                fill="#6B7280"
              />
            </svg>
          </span>
        </button>
      </div>

      {/* ページ操作バー（Kindle風スライダー） */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          // ボタンと重ならないようにさらに上に配置
          bottom: 72, // ← 36→72に変更（必要ならさらに調整）
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          zIndex: 45,
          pointerEvents: "auto",
          height: 32,
        }}
      >
        <input
          type="range"
          min={0}
          max={Math.max(pages.length - 1, 0)}
          value={page}
          onChange={e => setPage(Number(e.target.value))}
          style={{
            width: "60%",
            accentColor: "#6B7280", // グレー系 (Tailwind gray-500)
            opacity: 0.5,
            transition: "opacity 0.2s",
            height: 6,
            borderRadius: 3,
            background: "#e5e7eb",
            outline: "none",
          }}
          onMouseEnter={e => (e.currentTarget.style.opacity = "1")}
          onMouseLeave={e => (e.currentTarget.style.opacity = "0.5")}
          onTouchStart={e => (e.currentTarget.style.opacity = "1")}
          onTouchEnd={e => (e.currentTarget.style.opacity = "0.5")}
        />
        <span
          style={{
            marginLeft: 12,
            fontSize: 13,
            color: "#6B7280", // グレー系
            userSelect: "none",
            minWidth: 60,
            textAlign: "right",
          }}
        >
          {`${page + 1} / ${pages.length}`}
        </span>
      </div>
    </main>
  );
}