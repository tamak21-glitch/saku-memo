"use client";
import { useState, useEffect } from "react";
import { signOut, deleteUser } from "firebase/auth";
import { auth } from "../../lib/firebase";
import { useRouter } from "next/navigation";

type PopupType =
  | null
  | "logout"
  | "reauth"
  | "delete"
  | "font"
  | "theme"
  | "notification"
  | "reminder"
  | "silent"
  | "export"
  | "import"
  | "sync"
  | "cache"
  | "sort"
  | "filter"
  | "swipe"
  | "markdown"
  | "shortcut"
  | "autosave";

export default function SettingsPage() {
  const [popup, setPopup] = useState<PopupType>(null);
  const [loading, setLoading] = useState(false);
  const [fontFamily, setFontFamily] = useState(
    typeof window !== "undefined"
      ? localStorage.getItem("reviewFontFamily") || "Kosugi Maru"
      : "Kosugi Maru"
  );
  const [deleteStep, setDeleteStep] = useState(0);
  const router = useRouter();

  // フォント変更時にlocalStorageへ保存
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("reviewFontFamily", fontFamily);
    }
  }, [fontFamily]);

  // ログアウト処理
  const handleLogout = async () => {
    setLoading(true);
    try {
      await signOut(auth);
      router.replace("/login");
    } catch (e) {
      alert("ログアウトに失敗しました");
    } finally {
      setLoading(false);
      setPopup(null);
    }
  };

  // アカウント削除処理
  const handleDeleteAccount = async () => {
    setLoading(true);
    try {
      if (auth.currentUser) {
        await deleteUser(auth.currentUser);
        router.replace("/login");
      } else {
        alert("ユーザー情報が取得できませんでした");
      }
    } catch (e: any) {
      if (e.code === "auth/requires-recent-login") {
        alert("再認証が必要です。再度ログインしてください。");
      } else {
        alert("アカウント削除に失敗しました");
      }
    } finally {
      setLoading(false);
      setPopup(null);
      setDeleteStep(0);
    }
  };

  // ポップアップの内容
  const renderPopup = () => {
    switch (popup) {
      case "logout":
        return (
          <Popup onClose={() => setPopup(null)} title="ログアウト">
            <p>本当にログアウトしますか？</p>
            <button
              className="rounded-full px-5 py-2 bg-red-100 hover:bg-red-200 text-red-700 w-full mt-4 font-semibold"
              onClick={handleLogout}
              disabled={loading}
            >
              {loading ? "ログアウト中..." : "ログアウトする"}
            </button>
          </Popup>
        );
      case "reauth":
        return (
          <Popup onClose={() => setPopup(null)} title="再認証 / メール確認">
            <p>再認証やメール確認の操作をここで行えます。</p>
            <button className="rounded-full px-5 py-2 bg-gray-100 hover:bg-gray-200 text-black w-full mt-4 font-semibold" onClick={() => setPopup(null)}>
              閉じる
            </button>
          </Popup>
        );
      case "delete":
        return (
          <Popup onClose={() => { setPopup(null); setDeleteStep(0); }} title="アカウント削除">
            {deleteStep === 0 && (
              <>
                <p>本当にアカウントを削除しますか？この操作は元に戻せません。</p>
                <button
                  className="rounded-full px-5 py-2 bg-red-100 hover:bg-red-200 text-red-700 w-full mt-4 font-semibold"
                  onClick={() => setDeleteStep(1)}
                >
                  削除確認1回目
                </button>
              </>
            )}
            {deleteStep === 1 && (
              <>
                <p>二度目の確認です。本当に削除してもよいですか？</p>
                <button
                  className="rounded-full px-5 py-2 bg-red-100 hover:bg-red-200 text-red-700 w-full mt-4 font-semibold"
                  onClick={() => setDeleteStep(2)}
                >
                  削除確認2回目
                </button>
              </>
            )}
            {deleteStep === 2 && (
              <>
                <p>最終確認です。アカウントを完全に削除しますか？</p>
                <button
                  className="rounded-full px-5 py-2 bg-red-100 hover:bg-red-200 text-red-700 w-full mt-4 font-semibold"
                  onClick={handleDeleteAccount}
                  disabled={loading}
                >
                  {loading ? "削除中..." : "本当に削除する"}
                </button>
              </>
            )}
          </Popup>
        );
      case "font":
        return (
          <Popup onClose={() => setPopup(null)} title="フォント設定">
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontWeight: 600, marginBottom: 8, display: "block" }}>レビュー画面のフォント</label>
              <select
                className="rounded px-2 py-2 border border-gray-300 w-full"
                value={fontFamily}
                onChange={e => setFontFamily(e.target.value)}
                style={{ fontSize: 16 }}
              >
                <option value="Kosugi Maru">Kosugi Maru（丸ゴシック）</option>
                <option value="Noto Sans JP">Noto Sans JP（サンセリフ）</option>
                <option value="Noto Serif JP">Noto Serif JP（明朝）</option>
                <option value="Yu Mincho">游明朝</option>
                <option value="Yu Gothic">游ゴシック</option>
                <option value="M PLUS 1p">M PLUS 1p（モダンゴシック）</option>
                <option value="Roboto">Roboto（欧文）</option>
                <option value="serif">Serif（汎用明朝）</option>
                <option value="sans-serif">Sans-serif（汎用ゴシック）</option>
                <option value="monospace">Monospace（等幅）</option>
              </select>
            </div>
            <div style={{ fontFamily: fontFamily, fontSize: 18, border: "1px solid #eee", borderRadius: 8, padding: 12, background: "#fafafa" }}>
              サンプル：あのイーハトーヴォのすきとおった風
            </div>
            <button
              className="rounded-full px-5 py-2 bg-gray-100 hover:bg-gray-200 text-black w-full mt-4 font-semibold"
              onClick={() => setPopup(null)}
            >
              閉じる
            </button>
          </Popup>
        );
      default:
        return null;
    }
  };

  useEffect(() => {
    // レビュー画面のフォントを変更
    if (typeof window !== "undefined") {
      document.body.style.setProperty("--review-font-family", fontFamily);
    }
  }, [fontFamily]);

  return (
    <main
      className="flex flex-col items-center justify-start bg-white"
      style={{
        minHeight: "var(--app-height)",
        padding: "36px 0 0 0",
        fontFamily: "'Kosugi Maru', 'Indie Flower', cursive, 'Noto Sans JP', sans-serif",
        background: "#fff",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 480,
          padding: "0 24px 48px 24px",
        }}
      >
        <h1 style={{ fontSize: 24, marginBottom: 32, fontWeight: 700, letterSpacing: "1px", color: "#111827" }}>
          設定
        </h1>

        {/* アカウント */}
        <section style={{ marginBottom: 32 }}>
          <h2 className="font-semibold text-lg mb-3" style={{ color: "#111827" }}>アカウント</h2>
          <div className="space-y-3">
            <button
              className="rounded-full px-5 py-2 bg-gray-100 hover:bg-gray-200 text-black font-semibold w-full text-left transition"
              onClick={() => setPopup("logout")}
            >
              ログアウト
            </button>
            <button
              className="rounded-full px-5 py-2 bg-gray-200 text-gray-400 font-semibold w-full text-left transition cursor-not-allowed"
              disabled
            >
              再認証 / メール確認【実装するかも】
            </button>
            <button
              className="rounded-full px-5 py-2 bg-red-100 hover:bg-red-200 text-red-700 font-semibold w-full text-left transition"
              onClick={() => setPopup("delete")}
            >
              アカウント削除（Danger Zone）
            </button>
          </div>
        </section>

        {/* 表示・エディタ */}
        <section style={{ marginBottom: 32 }}>
          <h2 className="font-semibold text-lg mb-3" style={{ color: "#111827" }}>表示・エディタ</h2>
          <div className="space-y-3">
            <button
              className="rounded-full px-5 py-2 bg-gray-200 text-gray-400 font-semibold w-full text-left transition cursor-not-allowed"
              disabled
            >
              フォント設定【実装するかも】
            </button>
            <button
              className="rounded-full px-5 py-2 bg-gray-200 text-gray-400 font-semibold w-full text-left transition cursor-not-allowed"
              disabled
            >
              テーマ【実装するかも】
            </button>
          </div>
        </section>

        {/* 通知 */}
        <section style={{ marginBottom: 32 }}>
          <h2 className="font-semibold text-lg mb-3" style={{ color: "#111827" }}>通知</h2>
          <div className="space-y-3">
            <button
              className="rounded-full px-5 py-2 bg-gray-200 text-gray-400 font-semibold w-full text-left transition cursor-not-allowed"
              disabled
            >
              通知許可状態【実装するかも】
            </button>
            <button
              className="rounded-full px-5 py-2 bg-gray-200 text-gray-400 font-semibold w-full text-left transition cursor-not-allowed"
              disabled
            >
              リマインダー既定時刻【実装するかも】
            </button>
            <button
              className="rounded-full px-5 py-2 bg-gray-200 text-gray-400 font-semibold w-full text-left transition cursor-not-allowed"
              disabled
            >
              サイレント時間【実装するかも】
            </button>
          </div>
        </section>

        {/* データ */}
        <section style={{ marginBottom: 32 }}>
          <h2 className="font-semibold text-lg mb-3" style={{ color: "#111827" }}>データ</h2>
          <div className="space-y-3">
            <button
              className="rounded-full px-5 py-2 bg-gray-200 text-gray-400 font-semibold w-full text-left transition cursor-not-allowed"
              disabled
            >
              エクスポート（JSON/Markdown）【実装するかも】
            </button>
            <button
              className="rounded-full px-5 py-2 bg-gray-200 text-gray-400 font-semibold w-full text-left transition cursor-not-allowed"
              disabled
            >
              インポート（JSON/Markdown）【実装するかも】
            </button>
          </div>
        </section>

        {/* 同期・オフライン */}
        <section style={{ marginBottom: 32 }}>
          <h2 className="font-semibold text-lg mb-3" style={{ color: "#111827" }}>同期・オフライン</h2>
          <div className="space-y-3">
            <button
              className="rounded-full px-5 py-2 bg-gray-200 text-gray-400 font-semibold w-full text-left transition cursor-not-allowed"
              disabled
            >
              同期設定【実装するかも】
            </button>
            <button
              className="rounded-full px-5 py-2 bg-gray-200 text-gray-400 font-semibold w-full text-left transition cursor-not-allowed"
              disabled
            >
              オフライン時の動作【実装するかも】
            </button>
          </div>
        </section>

        {/* 並び替え・フィルター */}
        <section style={{ marginBottom: 32 }}>
          <h2 className="font-semibold text-lg mb-3" style={{ color: "#111827" }}>並び替え・フィルター</h2>
          <div className="space-y-3">
            <button
              className="rounded-full px-5 py-2 bg-gray-200 text-gray-400 font-semibold w-full text-left transition cursor-not-allowed"
              disabled
            >
              並び替え設定【実装するかも】
            </button>
            <button
              className="rounded-full px-5 py-2 bg-gray-200 text-gray-400 font-semibold w-full text-left transition cursor-not-allowed"
              disabled
            >
              フィルター設定【実装するかも】
            </button>
          </div>
        </section>

        {/* スワイプ・ジェスチャー */}
        <section style={{ marginBottom: 32 }}>
          <h2 className="font-semibold text-lg mb-3" style={{ color: "#111827" }}>スワイプ・ジェスチャー</h2>
          <div className="space-y-3">
            <button
              className="rounded-full px-5 py-2 bg-gray-200 text-gray-400 font-semibold w-full text-left transition cursor-not-allowed"
              disabled
            >
              スワイプ設定【実装するかも】
            </button>
            <button
              className="rounded-full px-5 py-2 bg-gray-200 text-gray-400 font-semibold w-full text-left transition cursor-not-allowed"
              disabled
            >
              ジェスチャー設定【実装するかも】
            </button>
          </div>
        </section>

        {/* ショートカット・自動保存 */}
        <section style={{ marginBottom: 32 }}>
          <h2 className="font-semibold text-lg mb-3" style={{ color: "#111827" }}>ショートカット・自動保存</h2>
          <div className="space-y-3">
            <button
              className="rounded-full px-5 py-2 bg-gray-200 text-gray-400 font-semibold w-full text-left transition cursor-not-allowed"
              disabled
            >
              ショートカット設定【実装するかも】
            </button>
            <button
              className="rounded-full px-5 py-2 bg-gray-200 text-gray-400 font-semibold w-full text-left transition cursor-not-allowed"
              disabled
            >
              自動保存設定【実装するかも】
            </button>
          </div>
        </section>
      </div>

      {/* レビュー画面に戻るボタン 左下固定 */}
      <div
        style={{
          position: "fixed",
          left: 24,
          bottom: 24,
          zIndex: 100,
        }}
      >
        <button
          className="rounded-full px-7 py-3 text-base shadow-lg bg-gray-100 hover:bg-gray-200 text-black font-semibold transition"
          onClick={() => router.push("/review")}
        >
          レビュー画面に戻る
        </button>
      </div>

      {/* ポップアップ */}
      {renderPopup()}
    </main>
  );
}

function Popup({
  onClose,
  title,
  children,
}: {
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-30">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6 relative">
        <h2 className="text-xl font-semibold mb-4" style={{ color: "#111827" }}>
          {title}
        </h2>
        <div className="mb-4" style={{ color: "#111827" }}>
          {children}
        </div>
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
          aria-label="閉じる"
        >
          {/* ×アイコン */}
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}