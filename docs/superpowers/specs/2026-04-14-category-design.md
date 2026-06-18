# カテゴリ・ゲーム詳細ページ 設計ドキュメント

**作成日:** 2026-04-14

---

## 概要

RMTsite に個別ゲームページ（`/[locale]/pc/[slug]` 等）を追加し、ゲームデータを 70 タイトル前後に拡張する。出品一覧はリスト型で表示する。

---

## URL 設計

| URL | 内容 |
|-----|------|
| `/[locale]/pc/[slug]` | PC ゲームの出品一覧ページ |
| `/[locale]/mobile/[slug]` | モバイルゲームの出品一覧ページ |
| `/[locale]/other/[slug]` | その他ゲームの出品一覧ページ |

- `category` が `pc | mobile | other` 以外 → `notFound()`
- `slug` が `games.json` に存在しない → `notFound()`
- `app/[locale]/[category]/[slug]/page.tsx` の単一動的ルートで実装

---

## データ設計

### data/games.json（拡張）

70 タイトル前後に拡張:
- PC: 25 タイトル（MMORPG、FPS、MOBA 等）
- Mobile: 35 タイトル（ガチャゲー、MOBA、RPG 等）
- Other: 10 タイトル（TCG、コンソール等）

既存フィールドは変更なし:
```json
{
  "id": 1,
  "name": "ファイナルファンタジーXIV",
  "slug": "ffxiv",
  "category": "pc",
  "listingCount": 257727
}
```

### data/listings.json（拡張）

各ゲームに 3〜5 件のダミー出品データを追加。既存フィールドを維持:
```json
{
  "id": 1,
  "gameId": 1,
  "gameName": "ファイナルファンタジーXIV",
  "title": "FFXIV ギル 100万",
  "price": 3500,
  "imageUrl": "/images/placeholder.svg"
}
```

---

## コンポーネント設計

### 新規: components/GameListingList.tsx

リスト型の出品一覧コンポーネント（Server Component）。

```
Props:
  listings: Listing[]
```

表示形式:
```
┌─────────────────────────────────────────────┐
│ [画像 60×60]  出品タイトル           ¥3,500  │
├─────────────────────────────────────────────┤
│ [画像 60×60]  出品タイトル           ¥8,800  │
└─────────────────────────────────────────────┘
```

- 画像は `<img>` タグ（`/images/placeholder.svg`）
- タイトルは青色リンク（クリックしてもまだ詳細ページなし = `href="#"` の placeholder）
- 価格は右寄せ赤色

### 新規: app/[locale]/[category]/[slug]/page.tsx

個別ゲームページ。

```typescript
// 動的パラメータ
params: Promise<{ locale: string; category: string; slug: string }>

// バリデーション
category が ['pc', 'mobile', 'other'] に含まれない → notFound()
slug が games.json に存在しない → notFound()

// データ取得
game = games.json から slug で検索
listings = listings.json から gameId でフィルタ

// 翻訳
t = getTranslations('game')
```

レイアウト:
```
h1: [ゲーム名] の出品一覧 (t('listingsTitle', { name: game.name }))
GameListingList listings={listings}
Sidebar（既存）
```

---

## 翻訳キー追加

### messages/en.json — game namespace 追加
```json
"game": {
  "listingsTitle": "Listings for {name}",
  "noListings": "No listings available"
}
```

### messages/ja.json
```json
"game": {
  "listingsTitle": "{name} の出品一覧",
  "noListings": "現在出品はありません"
}
```

### messages/zh.json
```json
"game": {
  "listingsTitle": "{name} 的出售列表",
  "noListings": "暂无出售"
}
```

---

## 既存ファイルへの変更

### app/[locale]/category/page.tsx
- `href={/game/${game.slug}}` → `href={/${game.category}/${game.slug}}`

### components/GameRankingTable.tsx
- `href={/game/${game.slug}}` → `href={/${game.category}/${game.slug}}`

---

## テスト方針

- `__tests__/GameListingList.test.tsx` — 新規（出品リストの表示確認）
- `__tests__/GamePage.test.tsx` — 新規（ゲームページのレンダリング、notFound の確認）
- 既存テスト（GameRankingTable）— リンク変更によりテストも更新が必要

---

## 変更・作成ファイル一覧

```
新規作成:
  app/[locale]/[category]/[slug]/page.tsx
  components/GameListingList.tsx
  __tests__/GameListingList.test.tsx

更新:
  data/games.json          （12 → 70 タイトル）
  data/listings.json       （各ゲームに出品データ追加）
  app/[locale]/category/page.tsx  （リンクURL変更）
  components/GameRankingTable.tsx （リンクURL変更）
  __tests__/GameRankingTable.test.tsx （リンクURL変更に対応）
  messages/en.json         （game namespace 追加）
  messages/ja.json         （game namespace 追加）
  messages/zh.json         （game namespace 追加）
```
