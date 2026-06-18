# Lootify 利用ガイドページ 設計仕様

**Date:** 2026-04-15
**Status:** Approved

---

## 概要

Lootify の使い方を新規ユーザーに伝える公開ガイドページ。買い手・売り手の両方を対象とし、グローバルSaaS風（Stripe / Notion スタイル）のシングルスクロールページとして実装する。

- **URL:** `/{locale}/guide`
- **認証:** 不要（公開ページ）
- **i18n:** en / ja / zh 対応
- **ファイル:** `app/[locale]/guide/page.tsx`（サーバーコンポーネント）

---

## ページ構成

### Section 1: Hero

| 要素 | 内容 |
|---|---|
| Eyebrow | `"HOW IT WORKS"` |
| H1 | `"The Fastest Way to Trade Game Items"` |
| Subtext | 2文のキャッチコピー（安全・速い・簡単） |
| CTA ボタン（左） | `"Browse Listings"` → `/` |
| CTA ボタン（右） | `"Start Selling"` → `/signup` |
| 画像 | **[IMAGE-01]** ヒーローイラスト or スクリーンショット（右側40%） |

レイアウト: 2カラム（左:テキスト/CTA、右:画像）。モバイルでは縦積み。

---

### Section 2: How It Works（3ステップ概要）

画像なし。SVGアイコン＋テキストの横並び3カード。

| ステップ | アイコン | ラベル | サブテキスト |
|---|---|---|---|
| 1 | 🔍（MagnifyingGlass） | `"Browse"` | ゲームを選んで出品を探す |
| 2 | 💳（CreditCard） | `"Purchase"` | 安全に決済して注文完了 |
| 3 | 📦（Package） | `"Receive"` | 売り手がアイテムを届ける |

背景: ライトグレー (`bg-gray-50`)。

---

### Section 3: For Buyers（詳細ステップ）

セクションヘッダー: `"For Buyers"` バッジ + `"Start Playing in Minutes"` H2

4ステップ。奇数ステップは左テキスト・右画像、偶数は右テキスト・左画像（デスクトップのみ交互、モバイルは縦積み）。

| Step | タイトル | 説明 | 画像 |
|---|---|---|---|
| 1 | Create Your Account | アカウント登録・メール認証 | **[IMAGE-02]** サインアップ画面 |
| 2 | Browse Game Listings | カテゴリ・ゲームで絞り込み | **[IMAGE-03]** リスティング一覧画面 |
| 3 | Place Your Order | 決済フロー | （画像なし、テキストのみ） |
| 4 | Receive Your Item | 売り手と連携してアイテム受け取り | （画像なし、テキストのみ） |

実質的に画像を使うのはStep 1・2の2枚。

---

### Section 4: For Sellers（詳細ステップ）

セクションヘッダー: `"For Sellers"` バッジ + `"Turn Your Game Assets Into Cash"` H2

4ステップ。Buyersと同じ交互レイアウト。

| Step | タイトル | 説明 | 画像 |
|---|---|---|---|
| 1 | Create Your Account | アカウント登録（Buyersと同一フロー） | （画像なし、Buyers参照） |
| 2 | List Your Item | タイトル・価格・説明を入力して出品 | **[IMAGE-04]** 出品フォームorダッシュボード |
| 3 | Get Purchased | 買い手から注文が入る | （画像なし、テキストのみ） |
| 4 | Deliver & Get Paid | アイテム納品後に入金確認 | **[IMAGE-05]** 取引完了・入金確認画面 |

---

### Section 5: Why Trust Us

背景: ホワイト。3カラムカード。SVGアイコン使用（Heroicons）。

| カード | アイコン | タイトル | 説明 |
|---|---|---|---|
| 1 | ShieldCheck | `"Secure Payments"` | 決済は暗号化・第三者保護 |
| 2 | BoltIcon | `"Fast Delivery"` | 多くの取引が数時間以内に完了 |
| 3 | StarIcon | `"Verified Listings"` | 出品者レビュー・実績表示 |

---

### Section 6: FAQ

アコーディオン形式（`<details>` / `<summary>` または state管理）。5問。

| # | 質問 | 回答 概要 |
|---|---|---|
| 1 | What payment methods are accepted? | クレジットカード・暗号通貨など |
| 2 | Is it safe to trade on Lootify? | エスクロー・レビューシステムで保護 |
| 3 | How long does delivery take? | ゲーム・出品者によるが多くは当日 |
| 4 | What if I have a problem with my order? | サポートへ連絡、争議解決プロセスあり |
| 5 | How do sellers get paid? | 取引完了後に残高へ反映 |

---

### Section 7: CTA バンド

背景: `#0b1929`（ダークネイビー）。白テキスト。

- H2: `"Ready to Get Started?"`
- Subtext: 1文
- ボタン2つ:
  - `"Browse Listings"` → `/`（白ボーダーアウトライン）
  - `"Create Free Account"` → `/signup`（白背景・ネイビー文字）

---

## 画像一覧（制作依頼）

| ID | 用途 | 推奨サイズ | 内容 |
|---|---|---|---|
| IMAGE-01 | Hero右側 | 600×480px | ヒーローイラスト（ゲームアイテム・コイン・トレードをイメージ） |
| IMAGE-02 | Buyers Step 1 | 560×380px | サインアップ or ログイン画面のスクリーンショット |
| IMAGE-03 | Buyers Step 2 | 560×380px | ゲームリスティング一覧のスクリーンショット |
| IMAGE-04 | Sellers Step 2 | 560×380px | 出品フォーム or ダッシュボードのスクリーンショット |
| IMAGE-05 | Sellers Step 4 | 560×380px | 取引完了 or 入金確認のスクリーンショット |

スクリーンショット系（IMAGE-02〜05）はサイト自体のキャプチャでOK。IMAGE-01はイラストまたはオリジナル画像。

---

## 実装ファイルマップ

| ファイル | 種別 | 内容 |
|---|---|---|
| `app/[locale]/guide/page.tsx` | 新規 | ガイドページ本体（サーバーコンポーネント） |
| `messages/en.json` | 修正 | `guide` セクション追加 |
| `messages/ja.json` | 修正 | `guide` セクション追加 |
| `messages/zh.json` | 修正 | `guide` セクション追加 |
| `public/images/guide/` | 新規ディレクトリ | IMAGE-01〜05 の配置先 |

---

## 技術メモ

- **サーバーコンポーネント**（認証チェック不要なため `'use client'` 不要）
- FAQ のアコーディオンのみインタラクションが必要 → 小さな Client Component として切り出す
- 画像は `next/image` の `<Image>` コンポーネント使用（最適化）
- 画像が未配置の間はプレースホルダー `<div>` で代替（背景グレー＋ラベルテキスト）
- Heroicons を既存コードに合わせてインラインSVGで実装
