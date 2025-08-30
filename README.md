This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

## 開発・テストの教訓

今回の作業で得た重要な教訓をまとめます。

- useEffect の依存配列にはプリミティブ値（数値・文字列・boolean）だけを入れる。配列やオブジェクトを直接入れると、レンダリングごとに `===` が変わり副作用が意図せず再実行される。
- 依存配列で参照する値は初期値・型・数・順序を固定しておく（例: 配列なら `.length` を参照するなど）。
- DOM の測定（高さ・幅）に依存するレイアウト処理は純粋関数に切り出し、ユニットテストで決定的に検証できるようにする。
- ユーザー操作（スワイプ・矢印キー・ボタン）の挙動は、視覚的な期待と内部ロジックを明示的にマッピングする（例: "左スワイプ → 次ページ" といったマトリクスを作る）。
- 重要な UI 操作は E2E テストで検証する（スワイプの方向、タッチ挙動、キーボード操作など）。ユニット/統合テストだけではタッチ操作の視覚的期待をカバーしにくい。
- 変更を加えたら必ず自動テストを実行し、テスト観点（期待動作）を PR に明示してレビューを容易にする。

今回のバグ（スワイプが逆に動く）についての短い説明:

- 原因: 実装時にスワイプの左右とページインデックス増減の向きを一致させておらず、視覚的な期待（左に指を動かすと次ページへ）と内部の `setPage` 増減が逆になっていた。
- 検出できなかった理由: 既存テストはページ分割や append ロジックを検証していたが、タッチスワイプの方向マッピングまでカバーしていなかった（E2E が無い）。

推奨対応:

- すぐにユニットテストで swipe ハンドラのマッピングを追加し、実装ミスを早期に検出できるようにする。
- 将来的には Playwright/Cypress を導入して iOS/Android の E2E を作る。


To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
