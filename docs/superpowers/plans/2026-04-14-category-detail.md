# カテゴリ詳細ページ Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 個別ゲームページ（`/[locale]/[category]/[slug]`）を追加し、ゲームデータを 70 タイトルに拡張する。

**Architecture:** 既存の Next.js 14 App Router 構造に乗っかり、`app/[locale]/[category]/[slug]/page.tsx` を async Server Component として追加。`GameListingList` は新規 Server Component。データは `data/*.json` から読む。`Link` は `@/i18n/navigation` から import（ロケールプレフィックスを自動付与）。

**Tech Stack:** Next.js 14, TypeScript, Tailwind CSS, next-intl, Jest, @testing-library/react

---

## ファイル構成

```
新規作成:
  app/[locale]/[category]/[slug]/page.tsx   個別ゲームページ
  components/GameListingList.tsx             出品リスト表示コンポーネント
  __tests__/GameListingList.test.tsx
  __tests__/GamePage.test.tsx

更新:
  data/games.json                            12 → 70 タイトル
  data/listings.json                         各ゲームに 2 件追加
  app/[locale]/category/page.tsx             href を /[category]/[slug] 形式に
  components/GameRankingTable.tsx            href を /[category]/[slug] 形式に
  __tests__/GameRankingTable.test.tsx        href アサーション追加
  messages/en.json                           game namespace 追加
  messages/ja.json                           game namespace 追加
  messages/zh.json                           game namespace 追加
```

---

## Task 1: data/games.json を 70 タイトルに拡張

**Files:**
- Modify: `data/games.json`

- [ ] **Step 1: data/games.json を以下の内容で置き換える**

```json
[
  { "id": 1, "name": "ファイナルファンタジーXIV", "slug": "ffxiv", "category": "pc", "listingCount": 257727 },
  { "id": 2, "name": "ドラゴンクエストX", "slug": "dqx", "category": "pc", "listingCount": 98400 },
  { "id": 3, "name": "黒い砂漠", "slug": "bdo", "category": "pc", "listingCount": 45200 },
  { "id": 4, "name": "World of Warcraft", "slug": "wow", "category": "pc", "listingCount": 32100 },
  { "id": 5, "name": "モンスターストライク", "slug": "monster-strike", "category": "mobile", "listingCount": 490457 },
  { "id": 6, "name": "Fate/Grand Order", "slug": "fgo", "category": "mobile", "listingCount": 320111 },
  { "id": 7, "name": "パズル&ドラゴンズ", "slug": "pazudora", "category": "mobile", "listingCount": 180023 },
  { "id": 8, "name": "原神", "slug": "genshin", "category": "mobile", "listingCount": 145000 },
  { "id": 9, "name": "崩壊：スターレイル", "slug": "starrail", "category": "mobile", "listingCount": 98700 },
  { "id": 10, "name": "Toram Online", "slug": "toram", "category": "mobile", "listingCount": 67800 },
  { "id": 11, "name": "遊戯王マスターデュエル", "slug": "masterduel", "category": "other", "listingCount": 55000 },
  { "id": 12, "name": "ポケモンGO", "slug": "pokemongo", "category": "other", "listingCount": 42000 },
  { "id": 13, "name": "リネージュW", "slug": "lineagew", "category": "pc", "listingCount": 28500 },
  { "id": 14, "name": "ロストアーク", "slug": "lostark", "category": "pc", "listingCount": 25300 },
  { "id": 15, "name": "VALORANT", "slug": "valorant", "category": "pc", "listingCount": 22100 },
  { "id": 16, "name": "リーグ・オブ・レジェンド", "slug": "lol", "category": "pc", "listingCount": 19800 },
  { "id": 17, "name": "エーペックスレジェンズ", "slug": "apex", "category": "pc", "listingCount": 17600 },
  { "id": 18, "name": "PUBG", "slug": "pubg", "category": "pc", "listingCount": 15400 },
  { "id": 19, "name": "Counter-Strike 2", "slug": "cs2", "category": "pc", "listingCount": 13200 },
  { "id": 20, "name": "Rust", "slug": "rust", "category": "pc", "listingCount": 11500 },
  { "id": 21, "name": "フォートナイト", "slug": "fortnite", "category": "pc", "listingCount": 10800 },
  { "id": 22, "name": "メイプルストーリー", "slug": "maplestory", "category": "pc", "listingCount": 9700 },
  { "id": 23, "name": "ラグナロクオンライン", "slug": "ragnarok", "category": "pc", "listingCount": 8900 },
  { "id": 24, "name": "ブレイドアンドソウル", "slug": "bladeandsoul", "category": "pc", "listingCount": 7800 },
  { "id": 25, "name": "アルビオン・オンライン", "slug": "albion", "category": "pc", "listingCount": 7200 },
  { "id": 26, "name": "Guild Wars 2", "slug": "gw2", "category": "pc", "listingCount": 6500 },
  { "id": 27, "name": "New World", "slug": "newworld", "category": "pc", "listingCount": 6100 },
  { "id": 28, "name": "エルソード", "slug": "elsword", "category": "pc", "listingCount": 5800 },
  { "id": 29, "name": "テラ", "slug": "tera", "category": "pc", "listingCount": 4900 },
  { "id": 30, "name": "Dota 2", "slug": "dota2", "category": "pc", "listingCount": 4400 },
  { "id": 31, "name": "ガンダムオンライン", "slug": "gundam-online", "category": "pc", "listingCount": 3800 },
  { "id": 32, "name": "Aion", "slug": "aion", "category": "pc", "listingCount": 3200 },
  { "id": 33, "name": "ELDEN RING", "slug": "elden-ring", "category": "pc", "listingCount": 2900 },
  { "id": 34, "name": "ウマ娘プリティーダービー", "slug": "umamusume", "category": "mobile", "listingCount": 62300 },
  { "id": 35, "name": "プロジェクトセカイ", "slug": "proseka", "category": "mobile", "listingCount": 58900 },
  { "id": 36, "name": "アズールレーン", "slug": "azurlane", "category": "mobile", "listingCount": 54200 },
  { "id": 37, "name": "アークナイツ", "slug": "arknights", "category": "mobile", "listingCount": 49800 },
  { "id": 38, "name": "ブルーアーカイブ", "slug": "bluearchive", "category": "mobile", "listingCount": 45600 },
  { "id": 39, "name": "勝利の女神：NIKKE", "slug": "nikke", "category": "mobile", "listingCount": 42100 },
  { "id": 40, "name": "ドラゴンボール レジェンズ", "slug": "dblegends", "category": "mobile", "listingCount": 38700 },
  { "id": 41, "name": "ワンピース バウンティラッシュ", "slug": "bounty-rush", "category": "mobile", "listingCount": 35400 },
  { "id": 42, "name": "ナルト疾風伝 BLAZING", "slug": "naruto-blazing", "category": "mobile", "listingCount": 32100 },
  { "id": 43, "name": "PUBG Mobile", "slug": "pubg-mobile", "category": "mobile", "listingCount": 29800 },
  { "id": 44, "name": "Call of Duty Mobile", "slug": "codm", "category": "mobile", "listingCount": 27500 },
  { "id": 45, "name": "Free Fire", "slug": "freefire", "category": "mobile", "listingCount": 25200 },
  { "id": 46, "name": "クラッシュ・オブ・クランズ", "slug": "coc", "category": "mobile", "listingCount": 23400 },
  { "id": 47, "name": "クラッシュ・ロワイヤル", "slug": "clashroyale", "category": "mobile", "listingCount": 21600 },
  { "id": 48, "name": "ブロスタ", "slug": "brawlstars", "category": "mobile", "listingCount": 19800 },
  { "id": 49, "name": "モバイル・レジェンズ", "slug": "mobilelegends", "category": "mobile", "listingCount": 18200 },
  { "id": 50, "name": "ロードモバイル", "slug": "lordsmobile", "category": "mobile", "listingCount": 16700 },
  { "id": 51, "name": "白猫プロジェクト", "slug": "shironeko", "category": "mobile", "listingCount": 15300 },
  { "id": 52, "name": "黒猫のウィズ", "slug": "blackwiz", "category": "mobile", "listingCount": 14100 },
  { "id": 53, "name": "荒野行動", "slug": "knivesout", "category": "mobile", "listingCount": 12900 },
  { "id": 54, "name": "リバース：1999", "slug": "reverse1999", "category": "mobile", "listingCount": 11800 },
  { "id": 55, "name": "鳴潮", "slug": "wuthering-waves", "category": "mobile", "listingCount": 10700 },
  { "id": 56, "name": "ヘブンバーンズレッド", "slug": "heavenburnred", "category": "mobile", "listingCount": 9800 },
  { "id": 57, "name": "グランブルーファンタジー", "slug": "gbf", "category": "mobile", "listingCount": 9100 },
  { "id": 58, "name": "バンドリ！ ガールズバンドパーティ！", "slug": "bandori", "category": "mobile", "listingCount": 8300 },
  { "id": 59, "name": "テイルズ オブ ザ レイズ", "slug": "tales-rays", "category": "mobile", "listingCount": 7600 },
  { "id": 60, "name": "アイドルマスター シャイニーカラーズ", "slug": "shinycolors", "category": "mobile", "listingCount": 6900 },
  { "id": 61, "name": "ロマンシング サガ リ・ユニバース", "slug": "romancing-saga", "category": "mobile", "listingCount": 6200 },
  { "id": 62, "name": "対魔忍RPG", "slug": "taimanin-rpg", "category": "mobile", "listingCount": 5500 },
  { "id": 63, "name": "マジック：ザ・ギャザリング アリーナ", "slug": "mtga", "category": "other", "listingCount": 38500 },
  { "id": 64, "name": "シャドウバース", "slug": "shadowverse", "category": "other", "listingCount": 34200 },
  { "id": 65, "name": "デュエル・マスターズ プレイス", "slug": "dmplays", "category": "other", "listingCount": 28900 },
  { "id": 66, "name": "Hearthstone", "slug": "hearthstone", "category": "other", "listingCount": 24600 },
  { "id": 67, "name": "スプラトゥーン3", "slug": "splatoon3", "category": "other", "listingCount": 21300 },
  { "id": 68, "name": "ポケモン スカーレット・バイオレット", "slug": "pokemon-sv", "category": "other", "listingCount": 18700 },
  { "id": 69, "name": "Nintendo Switch Online", "slug": "nso", "category": "other", "listingCount": 15400 },
  { "id": 70, "name": "モンスターハンターナウ", "slug": "mhnow", "category": "other", "listingCount": 12800 }
]
```

- [ ] **Step 2: コミット**

```bash
git add data/games.json
git commit -m "feat: games.json を 70 タイトルに拡張"
```

---

## Task 2: data/listings.json を拡張

**Files:**
- Modify: `data/listings.json`

- [ ] **Step 1: data/listings.json を以下の内容で置き換える**

ゲームID 4 (wow) は出品なし（テスト用）。その他のゲームは 2 件ずつ。

```json
[
  { "id": 1, "gameId": 1, "gameName": "ファイナルファンタジーXIV", "title": "FFXIV ギル 100万", "price": 3500, "imageUrl": "/images/placeholder.svg" },
  { "id": 2, "gameId": 1, "gameName": "ファイナルファンタジーXIV", "title": "FFXIV メインクエスト代行", "price": 12000, "imageUrl": "/images/placeholder.svg" },
  { "id": 3, "gameId": 2, "gameName": "ドラゴンクエストX", "title": "DQX ゴールド 500万G", "price": 2800, "imageUrl": "/images/placeholder.svg" },
  { "id": 4, "gameId": 2, "gameName": "ドラゴンクエストX", "title": "DQX 高レベルアカウント", "price": 18000, "imageUrl": "/images/placeholder.svg" },
  { "id": 5, "gameId": 3, "gameName": "黒い砂漠", "title": "黒砂漠 銀貨 10億", "price": 4200, "imageUrl": "/images/placeholder.svg" },
  { "id": 6, "gameId": 3, "gameName": "黒い砂漠", "title": "黒砂漠 アカウント 覚醒済み", "price": 35000, "imageUrl": "/images/placeholder.svg" },
  { "id": 7, "gameId": 5, "gameName": "モンスターストライク", "title": "モンスト 超絶キャラ多数 高評価アカウント", "price": 55000, "imageUrl": "/images/placeholder.svg" },
  { "id": 8, "gameId": 5, "gameName": "モンスターストライク", "title": "モンスト 轟絶キャラ揃い 即戦力", "price": 32000, "imageUrl": "/images/placeholder.svg" },
  { "id": 9, "gameId": 6, "gameName": "Fate/Grand Order", "title": "FGO 聖晶石 400個", "price": 8800, "imageUrl": "/images/placeholder.svg" },
  { "id": 10, "gameId": 6, "gameName": "Fate/Grand Order", "title": "FGO 高レアサーヴァント多数 アカウント", "price": 45000, "imageUrl": "/images/placeholder.svg" },
  { "id": 11, "gameId": 7, "gameName": "パズル&ドラゴンズ", "title": "パズドラ 魔法石 200個", "price": 4200, "imageUrl": "/images/placeholder.svg" },
  { "id": 12, "gameId": 7, "gameName": "パズル&ドラゴンズ", "title": "パズドラ 神フェス限多数 廃課金アカウント", "price": 68000, "imageUrl": "/images/placeholder.svg" },
  { "id": 13, "gameId": 8, "gameName": "原神", "title": "原神 原石 6480個 代行", "price": 5500, "imageUrl": "/images/placeholder.svg" },
  { "id": 14, "gameId": 8, "gameName": "原神", "title": "原神 AR55 星5多数 アカウント", "price": 28000, "imageUrl": "/images/placeholder.svg" },
  { "id": 15, "gameId": 9, "gameName": "崩壊：スターレイル", "title": "スターレイル 星穹列車の燃料 代行", "price": 6600, "imageUrl": "/images/placeholder.svg" },
  { "id": 16, "gameId": 9, "gameName": "崩壊：スターレイル", "title": "スターレイル 高レアキャラ揃い アカウント", "price": 22000, "imageUrl": "/images/placeholder.svg" },
  { "id": 17, "gameId": 10, "gameName": "Toram Online", "title": "Toram スピナ 1000万", "price": 3200, "imageUrl": "/images/placeholder.svg" },
  { "id": 18, "gameId": 10, "gameName": "Toram Online", "title": "Toram 高レベルキャラ 代行育成", "price": 15000, "imageUrl": "/images/placeholder.svg" },
  { "id": 19, "gameId": 11, "gameName": "遊戯王マスターデュエル", "title": "マスターデュエル 宝石 3000個", "price": 5800, "imageUrl": "/images/placeholder.svg" },
  { "id": 20, "gameId": 11, "gameName": "遊戯王マスターデュエル", "title": "マスターデュエル プラチナ1 ランク代行", "price": 12000, "imageUrl": "/images/placeholder.svg" },
  { "id": 21, "gameId": 12, "gameName": "ポケモンGO", "title": "ポケモンGO レイドチケット 50枚", "price": 4500, "imageUrl": "/images/placeholder.svg" },
  { "id": 22, "gameId": 12, "gameName": "ポケモンGO", "title": "ポケモンGO 色違い厳選 代行", "price": 8000, "imageUrl": "/images/placeholder.svg" },
  { "id": 23, "gameId": 13, "gameName": "リネージュW", "title": "リネージュW アデナ 100億", "price": 5000, "imageUrl": "/images/placeholder.svg" },
  { "id": 24, "gameId": 13, "gameName": "リネージュW", "title": "リネージュW 高レベルアカウント", "price": 42000, "imageUrl": "/images/placeholder.svg" },
  { "id": 25, "gameId": 14, "gameName": "ロストアーク", "title": "ロストアーク ゴールド 10万", "price": 3800, "imageUrl": "/images/placeholder.svg" },
  { "id": 26, "gameId": 14, "gameName": "ロストアーク", "title": "ロストアーク 1600레벨 アカウント", "price": 55000, "imageUrl": "/images/placeholder.svg" },
  { "id": 27, "gameId": 15, "gameName": "VALORANT", "title": "VALORANT ラジアント ランク代行", "price": 25000, "imageUrl": "/images/placeholder.svg" },
  { "id": 28, "gameId": 15, "gameName": "VALORANT", "title": "VALORANT スキン多数 アカウント", "price": 18000, "imageUrl": "/images/placeholder.svg" },
  { "id": 29, "gameId": 16, "gameName": "リーグ・オブ・レジェンド", "title": "LoL チャレンジャー ランク代行", "price": 30000, "imageUrl": "/images/placeholder.svg" },
  { "id": 30, "gameId": 16, "gameName": "リーグ・オブ・レジェンド", "title": "LoL スキン500種以上 アカウント", "price": 22000, "imageUrl": "/images/placeholder.svg" },
  { "id": 31, "gameId": 17, "gameName": "エーペックスレジェンズ", "title": "Apex プレデター ランク代行", "price": 35000, "imageUrl": "/images/placeholder.svg" },
  { "id": 32, "gameId": 17, "gameName": "エーペックスレジェンズ", "title": "Apex コイン 10000個", "price": 7800, "imageUrl": "/images/placeholder.svg" },
  { "id": 33, "gameId": 18, "gameName": "PUBG", "title": "PUBG G-Coin 10000", "price": 6500, "imageUrl": "/images/placeholder.svg" },
  { "id": 34, "gameId": 18, "gameName": "PUBG", "title": "PUBG スキン多数 アカウント", "price": 14000, "imageUrl": "/images/placeholder.svg" },
  { "id": 35, "gameId": 19, "gameName": "Counter-Strike 2", "title": "CS2 Global Elite ランク代行", "price": 20000, "imageUrl": "/images/placeholder.svg" },
  { "id": 36, "gameId": 19, "gameName": "Counter-Strike 2", "title": "CS2 ナイフスキン AK-47 セット", "price": 45000, "imageUrl": "/images/placeholder.svg" },
  { "id": 37, "gameId": 20, "gameName": "Rust", "title": "Rust スキン多数 アカウント", "price": 12000, "imageUrl": "/images/placeholder.svg" },
  { "id": 38, "gameId": 20, "gameName": "Rust", "title": "Rust 廃鯖 建設代行", "price": 8000, "imageUrl": "/images/placeholder.svg" },
  { "id": 39, "gameId": 21, "gameName": "フォートナイト", "title": "フォートナイト V-Bucks 13500", "price": 8500, "imageUrl": "/images/placeholder.svg" },
  { "id": 40, "gameId": 21, "gameName": "フォートナイト", "title": "フォートナイト スキン多数 アカウント", "price": 15000, "imageUrl": "/images/placeholder.svg" },
  { "id": 41, "gameId": 22, "gameName": "メイプルストーリー", "title": "メイプル メソ 100億", "price": 4800, "imageUrl": "/images/placeholder.svg" },
  { "id": 42, "gameId": 22, "gameName": "メイプルストーリー", "title": "メイプル 育成代行 200レベル", "price": 18000, "imageUrl": "/images/placeholder.svg" },
  { "id": 43, "gameId": 23, "gameName": "ラグナロクオンライン", "title": "RO ゼニー 1億", "price": 3200, "imageUrl": "/images/placeholder.svg" },
  { "id": 44, "gameId": 23, "gameName": "ラグナロクオンライン", "title": "RO 高レアカード・装備セット", "price": 25000, "imageUrl": "/images/placeholder.svg" },
  { "id": 45, "gameId": 24, "gameName": "ブレイドアンドソウル", "title": "BnS ゴールド 1万", "price": 3500, "imageUrl": "/images/placeholder.svg" },
  { "id": 46, "gameId": 24, "gameName": "ブレイドアンドソウル", "title": "BnS 段位 武闘王 代行", "price": 22000, "imageUrl": "/images/placeholder.svg" },
  { "id": 47, "gameId": 25, "gameName": "アルビオン・オンライン", "title": "Albion シルバー 100M", "price": 4200, "imageUrl": "/images/placeholder.svg" },
  { "id": 48, "gameId": 25, "gameName": "アルビオン・オンライン", "title": "Albion T8 フル装備 アカウント", "price": 38000, "imageUrl": "/images/placeholder.svg" },
  { "id": 49, "gameId": 26, "gameName": "Guild Wars 2", "title": "GW2 ゴールド 1000", "price": 5500, "imageUrl": "/images/placeholder.svg" },
  { "id": 50, "gameId": 26, "gameName": "Guild Wars 2", "title": "GW2 伝説装備 アカウント", "price": 35000, "imageUrl": "/images/placeholder.svg" },
  { "id": 51, "gameId": 27, "gameName": "New World", "title": "New World コイン 50万", "price": 3800, "imageUrl": "/images/placeholder.svg" },
  { "id": 52, "gameId": 27, "gameName": "New World", "title": "New World レベル60 アカウント", "price": 18000, "imageUrl": "/images/placeholder.svg" },
  { "id": 53, "gameId": 28, "gameName": "エルソード", "title": "エルソード エルジャー 10億", "price": 2800, "imageUrl": "/images/placeholder.svg" },
  { "id": 54, "gameId": 28, "gameName": "エルソード", "title": "エルソード 覚醒キャラ アカウント", "price": 12000, "imageUrl": "/images/placeholder.svg" },
  { "id": 55, "gameId": 29, "gameName": "テラ", "title": "テラ ゴールド 5000万", "price": 3200, "imageUrl": "/images/placeholder.svg" },
  { "id": 56, "gameId": 29, "gameName": "テラ", "title": "テラ 最強装備一式 アカウント", "price": 22000, "imageUrl": "/images/placeholder.svg" },
  { "id": 57, "gameId": 30, "gameName": "Dota 2", "title": "Dota 2 Immortal ランク代行", "price": 28000, "imageUrl": "/images/placeholder.svg" },
  { "id": 58, "gameId": 30, "gameName": "Dota 2", "title": "Dota 2 高価スキン多数 アカウント", "price": 42000, "imageUrl": "/images/placeholder.svg" },
  { "id": 59, "gameId": 31, "gameName": "ガンダムオンライン", "title": "ガンオン MSコイン 5000", "price": 2500, "imageUrl": "/images/placeholder.svg" },
  { "id": 60, "gameId": 31, "gameName": "ガンダムオンライン", "title": "ガンオン 高ランクアカウント", "price": 8000, "imageUrl": "/images/placeholder.svg" },
  { "id": 61, "gameId": 32, "gameName": "Aion", "title": "Aion キナ 1億", "price": 3500, "imageUrl": "/images/placeholder.svg" },
  { "id": 62, "gameId": 32, "gameName": "Aion", "title": "Aion 最高クラス装備 アカウント", "price": 20000, "imageUrl": "/images/placeholder.svg" },
  { "id": 63, "gameId": 33, "gameName": "ELDEN RING", "title": "ELDEN RING ルーン 999億", "price": 4500, "imageUrl": "/images/placeholder.svg" },
  { "id": 64, "gameId": 33, "gameName": "ELDEN RING", "title": "ELDEN RING 全ボス撃破 周回代行", "price": 15000, "imageUrl": "/images/placeholder.svg" },
  { "id": 65, "gameId": 34, "gameName": "ウマ娘プリティーダービー", "title": "ウマ娘 ジュエル 10000個", "price": 9800, "imageUrl": "/images/placeholder.svg" },
  { "id": 66, "gameId": 34, "gameName": "ウマ娘プリティーダービー", "title": "ウマ娘 上位キャラ多数 アカウント", "price": 58000, "imageUrl": "/images/placeholder.svg" },
  { "id": 67, "gameId": 35, "gameName": "プロジェクトセカイ", "title": "プロセカ 石 5000個", "price": 7200, "imageUrl": "/images/placeholder.svg" },
  { "id": 68, "gameId": 35, "gameName": "プロジェクトセカイ", "title": "プロセカ 限定カード多数 アカウント", "price": 35000, "imageUrl": "/images/placeholder.svg" },
  { "id": 69, "gameId": 36, "gameName": "アズールレーン", "title": "アズレン ダイヤ 500個", "price": 4800, "imageUrl": "/images/placeholder.svg" },
  { "id": 70, "gameId": 36, "gameName": "アズールレーン", "title": "アズレン 限定艦船多数 アカウント", "price": 28000, "imageUrl": "/images/placeholder.svg" },
  { "id": 71, "gameId": 37, "gameName": "アークナイツ", "title": "アークナイツ 合成玉 3000個", "price": 6500, "imageUrl": "/images/placeholder.svg" },
  { "id": 72, "gameId": 37, "gameName": "アークナイツ", "title": "アークナイツ 6星オペレーター多数 アカウント", "price": 32000, "imageUrl": "/images/placeholder.svg" },
  { "id": 73, "gameId": 38, "gameName": "ブルーアーカイブ", "title": "ブルアカ ピロウス 3000個", "price": 5500, "imageUrl": "/images/placeholder.svg" },
  { "id": 74, "gameId": 38, "gameName": "ブルーアーカイブ", "title": "ブルアカ 限定生徒多数 アカウント", "price": 38000, "imageUrl": "/images/placeholder.svg" },
  { "id": 75, "gameId": 39, "gameName": "勝利の女神：NIKKE", "title": "NIKKE 宝石 5000個", "price": 6800, "imageUrl": "/images/placeholder.svg" },
  { "id": 76, "gameId": 39, "gameName": "勝利の女神：NIKKE", "title": "NIKKE SSR多数 アカウント", "price": 25000, "imageUrl": "/images/placeholder.svg" },
  { "id": 77, "gameId": 40, "gameName": "ドラゴンボール レジェンズ", "title": "DBレジェンズ クロノクリスタル 3000個", "price": 5200, "imageUrl": "/images/placeholder.svg" },
  { "id": 78, "gameId": 40, "gameName": "ドラゴンボール レジェンズ", "title": "DBレジェンズ スパーキング多数 アカウント", "price": 22000, "imageUrl": "/images/placeholder.svg" },
  { "id": 79, "gameId": 41, "gameName": "ワンピース バウンティラッシュ", "title": "バウンティラッシュ レインボーダイヤ 500個", "price": 4800, "imageUrl": "/images/placeholder.svg" },
  { "id": 80, "gameId": 41, "gameName": "ワンピース バウンティラッシュ", "title": "バウンティラッシュ 4星キャラ多数 アカウント", "price": 18000, "imageUrl": "/images/placeholder.svg" },
  { "id": 81, "gameId": 42, "gameName": "ナルト疾風伝 BLAZING", "title": "BLAZING 忍者宝珠 5000個", "price": 4200, "imageUrl": "/images/placeholder.svg" },
  { "id": 82, "gameId": 42, "gameName": "ナルト疾風伝 BLAZING", "title": "BLAZING 限定キャラ多数 アカウント", "price": 16000, "imageUrl": "/images/placeholder.svg" },
  { "id": 83, "gameId": 43, "gameName": "PUBG Mobile", "title": "PUBG Mobile UCコイン 10000", "price": 7500, "imageUrl": "/images/placeholder.svg" },
  { "id": 84, "gameId": 43, "gameName": "PUBG Mobile", "title": "PUBG Mobile コンカラー スキン多数 アカウント", "price": 20000, "imageUrl": "/images/placeholder.svg" },
  { "id": 85, "gameId": 44, "gameName": "Call of Duty Mobile", "title": "CoD Mobile CODポイント 5000", "price": 5800, "imageUrl": "/images/placeholder.svg" },
  { "id": 86, "gameId": 44, "gameName": "Call of Duty Mobile", "title": "CoD Mobile グランドマスター アカウント", "price": 18000, "imageUrl": "/images/placeholder.svg" },
  { "id": 87, "gameId": 45, "gameName": "Free Fire", "title": "Free Fire ダイヤ 5000個", "price": 4200, "imageUrl": "/images/placeholder.svg" },
  { "id": 88, "gameId": 45, "gameName": "Free Fire", "title": "Free Fire グランドマスター アカウント", "price": 12000, "imageUrl": "/images/placeholder.svg" },
  { "id": 89, "gameId": 46, "gameName": "クラッシュ・オブ・クランズ", "title": "クラクラ TH16 強アカウント", "price": 35000, "imageUrl": "/images/placeholder.svg" },
  { "id": 90, "gameId": 46, "gameName": "クラッシュ・オブ・クランズ", "title": "クラクラ ジェム 14000個", "price": 8800, "imageUrl": "/images/placeholder.svg" },
  { "id": 91, "gameId": 47, "gameName": "クラッシュ・ロワイヤル", "title": "クラロワ アルティメットチャンピオン 代行", "price": 22000, "imageUrl": "/images/placeholder.svg" },
  { "id": 92, "gameId": 47, "gameName": "クラッシュ・ロワイヤル", "title": "クラロワ 進化カード全種 アカウント", "price": 15000, "imageUrl": "/images/placeholder.svg" },
  { "id": 93, "gameId": 48, "gameName": "ブロスタ", "title": "ブロスタ ブロスタパス コイン多数 アカウント", "price": 12000, "imageUrl": "/images/placeholder.svg" },
  { "id": 94, "gameId": 48, "gameName": "ブロスタ", "title": "ブロスタ マスターランク アカウント", "price": 18000, "imageUrl": "/images/placeholder.svg" },
  { "id": 95, "gameId": 49, "gameName": "モバイル・レジェンズ", "title": "ML ミシックグロリー 代行", "price": 15000, "imageUrl": "/images/placeholder.svg" },
  { "id": 96, "gameId": 49, "gameName": "モバイル・レジェンズ", "title": "ML スキン多数 アカウント", "price": 22000, "imageUrl": "/images/placeholder.svg" },
  { "id": 97, "gameId": 50, "gameName": "ロードモバイル", "title": "ロードモバイル ジェム 50000個", "price": 9800, "imageUrl": "/images/placeholder.svg" },
  { "id": 98, "gameId": 50, "gameName": "ロードモバイル", "title": "ロードモバイル 城 T5 強アカウント", "price": 45000, "imageUrl": "/images/placeholder.svg" },
  { "id": 99, "gameId": 51, "gameName": "白猫プロジェクト", "title": "白猫 ジュエル 3000個", "price": 4500, "imageUrl": "/images/placeholder.svg" },
  { "id": 100, "gameId": 51, "gameName": "白猫プロジェクト", "title": "白猫 限定キャラ多数 アカウント", "price": 15000, "imageUrl": "/images/placeholder.svg" },
  { "id": 101, "gameId": 52, "gameName": "黒猫のウィズ", "title": "黒ウィズ 魔法石 500個", "price": 3800, "imageUrl": "/images/placeholder.svg" },
  { "id": 102, "gameId": 52, "gameName": "黒猫のウィズ", "title": "黒ウィズ SSS多数 アカウント", "price": 12000, "imageUrl": "/images/placeholder.svg" },
  { "id": 103, "gameId": 53, "gameName": "荒野行動", "title": "荒野行動 金券 5000", "price": 5200, "imageUrl": "/images/placeholder.svg" },
  { "id": 104, "gameId": 53, "gameName": "荒野行動", "title": "荒野行動 永久スキン多数 アカウント", "price": 20000, "imageUrl": "/images/placeholder.svg" },
  { "id": 105, "gameId": 54, "gameName": "リバース：1999", "title": "リバース1999 マテリア 3000個", "price": 5500, "imageUrl": "/images/placeholder.svg" },
  { "id": 106, "gameId": 54, "gameName": "リバース：1999", "title": "リバース1999 6星キャラ多数 アカウント", "price": 22000, "imageUrl": "/images/placeholder.svg" },
  { "id": 107, "gameId": 55, "gameName": "鳴潮", "title": "鳴潮 アストライト 6480個", "price": 6000, "imageUrl": "/images/placeholder.svg" },
  { "id": 108, "gameId": 55, "gameName": "鳴潮", "title": "鳴潮 5星キャラ多数 アカウント", "price": 25000, "imageUrl": "/images/placeholder.svg" },
  { "id": 109, "gameId": 56, "gameName": "ヘブンバーンズレッド", "title": "ヘブバン 聖石 3000個", "price": 5800, "imageUrl": "/images/placeholder.svg" },
  { "id": 110, "gameId": 56, "gameName": "ヘブンバーンズレッド", "title": "ヘブバン 限定SSR多数 アカウント", "price": 28000, "imageUrl": "/images/placeholder.svg" },
  { "id": 111, "gameId": 57, "gameName": "グランブルーファンタジー", "title": "グラブル 晶獣石 3000個", "price": 4800, "imageUrl": "/images/placeholder.svg" },
  { "id": 112, "gameId": 57, "gameName": "グランブルーファンタジー", "title": "グラブル ランク275以上 神石編成 アカウント", "price": 65000, "imageUrl": "/images/placeholder.svg" },
  { "id": 113, "gameId": 58, "gameName": "バンドリ！ ガールズバンドパーティ！", "title": "バンドリ スター 5000個", "price": 5200, "imageUrl": "/images/placeholder.svg" },
  { "id": 114, "gameId": 58, "gameName": "バンドリ！ ガールズバンドパーティ！", "title": "バンドリ 限定4星多数 アカウント", "price": 22000, "imageUrl": "/images/placeholder.svg" },
  { "id": 115, "gameId": 59, "gameName": "テイルズ オブ ザ レイズ", "title": "テイルズレイズ バンダイコイン 3000", "price": 4200, "imageUrl": "/images/placeholder.svg" },
  { "id": 116, "gameId": 59, "gameName": "テイルズ オブ ザ レイズ", "title": "テイルズレイズ 限定キャラ多数 アカウント", "price": 15000, "imageUrl": "/images/placeholder.svg" },
  { "id": 117, "gameId": 60, "gameName": "アイドルマスター シャイニーカラーズ", "title": "シャニマス P石 3000個", "price": 5500, "imageUrl": "/images/placeholder.svg" },
  { "id": 118, "gameId": 60, "gameName": "アイドルマスター シャイニーカラーズ", "title": "シャニマス 限定SSR多数 アカウント", "price": 25000, "imageUrl": "/images/placeholder.svg" },
  { "id": 119, "gameId": 61, "gameName": "ロマンシング サガ リ・ユニバース", "title": "ロマサガRS 宝玉 3000個", "price": 4500, "imageUrl": "/images/placeholder.svg" },
  { "id": 120, "gameId": 61, "gameName": "ロマンシング サガ リ・ユニバース", "title": "ロマサガRS SS多数 強アカウント", "price": 18000, "imageUrl": "/images/placeholder.svg" },
  { "id": 121, "gameId": 62, "gameName": "対魔忍RPG", "title": "対魔忍RPG 忍石 2000個", "price": 3800, "imageUrl": "/images/placeholder.svg" },
  { "id": 122, "gameId": 62, "gameName": "対魔忍RPG", "title": "対魔忍RPG UR多数 アカウント", "price": 12000, "imageUrl": "/images/placeholder.svg" },
  { "id": 123, "gameId": 63, "gameName": "マジック：ザ・ギャザリング アリーナ", "title": "MTGアリーナ ジェム 20000個", "price": 7800, "imageUrl": "/images/placeholder.svg" },
  { "id": 124, "gameId": 63, "gameName": "マジック：ザ・ギャザリング アリーナ", "title": "MTGアリーナ ミシック到達 代行", "price": 18000, "imageUrl": "/images/placeholder.svg" },
  { "id": 125, "gameId": 64, "gameName": "シャドウバース", "title": "シャドバ クリスタル 3000個", "price": 5500, "imageUrl": "/images/placeholder.svg" },
  { "id": 126, "gameId": 64, "gameName": "シャドウバース", "title": "シャドバ グランドマスター 代行", "price": 20000, "imageUrl": "/images/placeholder.svg" },
  { "id": 127, "gameId": 65, "gameName": "デュエル・マスターズ プレイス", "title": "デュエプレ ダイヤ 3000個", "price": 4800, "imageUrl": "/images/placeholder.svg" },
  { "id": 128, "gameId": 65, "gameName": "デュエル・マスターズ プレイス", "title": "デュエプレ レジェンド到達 代行", "price": 15000, "imageUrl": "/images/placeholder.svg" },
  { "id": 129, "gameId": 66, "gameName": "Hearthstone", "title": "Hearthstone ゴールド 3000", "price": 4200, "imageUrl": "/images/placeholder.svg" },
  { "id": 130, "gameId": 66, "gameName": "Hearthstone", "title": "Hearthstone レジェンド到達 代行", "price": 22000, "imageUrl": "/images/placeholder.svg" },
  { "id": 131, "gameId": 67, "gameName": "スプラトゥーン3", "title": "スプラ3 Xマッチ X+2500 代行", "price": 18000, "imageUrl": "/images/placeholder.svg" },
  { "id": 132, "gameId": 67, "gameName": "スプラトゥーン3", "title": "スプラ3 カタログ全報酬 代行", "price": 12000, "imageUrl": "/images/placeholder.svg" },
  { "id": 133, "gameId": 68, "gameName": "ポケモン スカーレット・バイオレット", "title": "ポケSV 厳選済み 色違いポケモン", "price": 3500, "imageUrl": "/images/placeholder.svg" },
  { "id": 134, "gameId": 68, "gameName": "ポケモン スカーレット・バイオレット", "title": "ポケSV マスターランク 育成代行", "price": 8000, "imageUrl": "/images/placeholder.svg" },
  { "id": 135, "gameId": 69, "gameName": "Nintendo Switch Online", "title": "NSO ファミリープラン 12ヶ月 招待", "price": 3200, "imageUrl": "/images/placeholder.svg" },
  { "id": 136, "gameId": 69, "gameName": "Nintendo Switch Online", "title": "NSO 個人プラン 3ヶ月 コード", "price": 1200, "imageUrl": "/images/placeholder.svg" },
  { "id": 137, "gameId": 70, "gameName": "モンスターハンターナウ", "title": "MHNow ジェム 5000個", "price": 4800, "imageUrl": "/images/placeholder.svg" },
  { "id": 138, "gameId": 70, "gameName": "モンスターハンターナウ", "title": "MHNow HR50以上 強アカウント", "price": 15000, "imageUrl": "/images/placeholder.svg" }
]
```

- [ ] **Step 2: コミット**

```bash
git add data/listings.json
git commit -m "feat: listings.json を全ゲーム対応に拡張（wow は出品なし）"
```

---

## Task 3: 翻訳キー追加

**Files:**
- Modify: `messages/en.json`
- Modify: `messages/ja.json`
- Modify: `messages/zh.json`

- [ ] **Step 1: messages/en.json に game namespace を追加**

`"carousel"` ブロックの後に追加（末尾のカンマに注意）:

```json
  "game": {
    "listingsTitle": "Listings for {name}",
    "noListings": "No listings available"
  }
```

en.json の完成形:
```json
{
  "header": { ... },
  "home": { ... },
  "category": { ... },
  "sidebar": { ... },
  "footer": { ... },
  "carousel": { ... },
  "game": {
    "listingsTitle": "Listings for {name}",
    "noListings": "No listings available"
  }
}
```

- [ ] **Step 2: messages/ja.json に game namespace を追加**

```json
  "game": {
    "listingsTitle": "{name} の出品一覧",
    "noListings": "現在出品はありません"
  }
```

- [ ] **Step 3: messages/zh.json に game namespace を追加**

```json
  "game": {
    "listingsTitle": "{name} 的出售列表",
    "noListings": "暂无出售"
  }
```

- [ ] **Step 4: コミット**

```bash
git add messages/
git commit -m "feat: game namespace を翻訳ファイルに追加"
```

---

## Task 4: GameListingList コンポーネント（TDD）

**Files:**
- Create: `components/GameListingList.tsx`
- Create: `__tests__/GameListingList.test.tsx`

- [ ] **Step 1: テストを書く**

`__tests__/GameListingList.test.tsx`:

```typescript
import { render, screen } from '@testing-library/react'
import GameListingList from '@/components/GameListingList'
import { Listing } from '@/types'

const mockListings: Listing[] = [
  { id: 1, gameId: 1, gameName: 'Test Game', title: 'テスト出品A', price: 3500, imageUrl: '/images/placeholder.svg' },
  { id: 2, gameId: 1, gameName: 'Test Game', title: 'テスト出品B', price: 12000, imageUrl: '/images/placeholder.svg' },
]

describe('GameListingList', () => {
  it('出品タイトルを表示する', () => {
    render(<GameListingList listings={mockListings} />)
    expect(screen.getByText('テスト出品A')).toBeInTheDocument()
    expect(screen.getByText('テスト出品B')).toBeInTheDocument()
  })

  it('価格を円形式で表示する', () => {
    render(<GameListingList listings={mockListings} />)
    expect(screen.getByText('¥3,500')).toBeInTheDocument()
    expect(screen.getByText('¥12,000')).toBeInTheDocument()
  })

  it('出品リンクはすべて href="#" を持つ', () => {
    render(<GameListingList listings={mockListings} />)
    const links = screen.getAllByRole('link')
    expect(links).toHaveLength(2)
    links.forEach((link) => expect(link).toHaveAttribute('href', '#'))
  })

  it('画像を表示する', () => {
    render(<GameListingList listings={mockListings} />)
    const images = screen.getAllByRole('img')
    expect(images).toHaveLength(2)
  })

  it('出品がない場合はリストアイテムを表示しない', () => {
    render(<GameListingList listings={[]} />)
    expect(screen.queryByRole('link')).not.toBeInTheDocument()
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
  })
})
```

- [ ] **Step 2: テストが失敗することを確認**

```bash
npx jest __tests__/GameListingList.test.tsx --no-coverage
```

期待出力: `FAIL __tests__/GameListingList.test.tsx` （モジュールが見つからないエラー）

- [ ] **Step 3: コンポーネントを実装する**

`components/GameListingList.tsx`:

```typescript
import { Listing } from '@/types'

type Props = {
  listings: Listing[]
}

export default function GameListingList({ listings }: Props) {
  return (
    <div className="border border-gray-200 rounded divide-y divide-gray-100">
      {listings.map((listing) => (
        <div key={listing.id} className="flex items-center gap-3 px-4 py-3">
          <img
            src={listing.imageUrl}
            alt={listing.title}
            width={60}
            height={60}
            className="object-cover rounded shrink-0"
          />
          <a href="#" className="flex-1 text-sm text-blue-600 hover:underline min-w-0 truncate">
            {listing.title}
          </a>
          <span className="text-sm text-red-600 font-bold shrink-0 whitespace-nowrap">
            ¥{listing.price.toLocaleString('ja-JP')}
          </span>
        </div>
      ))}
    </div>
  )
}
```

- [ ] **Step 4: テストが通ることを確認**

```bash
npx jest __tests__/GameListingList.test.tsx --no-coverage
```

期待出力: `PASS __tests__/GameListingList.test.tsx`、5 tests passed

- [ ] **Step 5: コミット**

```bash
git add components/GameListingList.tsx __tests__/GameListingList.test.tsx
git commit -m "feat: GameListingList コンポーネントを追加"
```

---

## Task 5: リンク URL 変更

**Files:**
- Modify: `app/[locale]/category/page.tsx`
- Modify: `components/GameRankingTable.tsx`
- Modify: `__tests__/GameRankingTable.test.tsx`

- [ ] **Step 1: GameRankingTable.test.tsx に href アサーションを追加**

既存の `'ゲーム名を表示する'` テストの下に追加:

```typescript
  it('ゲームリンクが /[category]/[slug] 形式の href を持つ', () => {
    render(<GameRankingTable games={mockGames} title="Ranking" listingUnit="件" />)
    const linkA = screen.getByRole('link', { name: 'Game A' })
    const linkB = screen.getByRole('link', { name: 'Game B' })
    expect(linkA).toHaveAttribute('href', '/pc/game-a')
    expect(linkB).toHaveAttribute('href', '/mobile/game-b')
  })
```

- [ ] **Step 2: テストが失敗することを確認**

```bash
npx jest __tests__/GameRankingTable.test.tsx --no-coverage
```

期待出力: `FAIL` — href が `/game/game-a` のため失敗

- [ ] **Step 3: GameRankingTable.tsx の href を修正**

`components/GameRankingTable.tsx` の `href={/game/${game.slug}}` を変更:

変更前:
```typescript
<Link href={`/game/${game.slug}`} className="text-blue-600 hover:underline">
```

変更後:
```typescript
<Link href={`/${game.category}/${game.slug}`} className="text-blue-600 hover:underline">
```

- [ ] **Step 4: GameRankingTable のテストが通ることを確認**

```bash
npx jest __tests__/GameRankingTable.test.tsx --no-coverage
```

期待出力: `PASS`、5 tests passed

- [ ] **Step 5: category/page.tsx の href を修正**

`app/[locale]/category/page.tsx` の `href={/game/${game.slug}}` を変更:

変更前:
```typescript
href={`/game/${game.slug}`}
```

変更後:
```typescript
href={`/${game.category}/${game.slug}`}
```

- [ ] **Step 6: 全テストが通ることを確認**

```bash
npx jest --no-coverage
```

期待出力: 全テスト PASS

- [ ] **Step 7: コミット**

```bash
git add components/GameRankingTable.tsx app/[locale]/category/page.tsx __tests__/GameRankingTable.test.tsx
git commit -m "fix: ゲームリンクを /[category]/[slug] 形式に変更"
```

---

## Task 6: 個別ゲームページ（TDD）

**Files:**
- Create: `app/[locale]/[category]/[slug]/page.tsx`
- Create: `__tests__/GamePage.test.tsx`

- [ ] **Step 1: テストを書く**

`__tests__/GamePage.test.tsx`:

```typescript
import { render, screen } from '@testing-library/react'
import { notFound } from 'next/navigation'
import GamePage from '@/app/[locale]/[category]/[slug]/page'

jest.mock('next/navigation', () => ({
  notFound: jest.fn(() => {
    throw new Error('NEXT_NOT_FOUND')
  }),
}))

jest.mock('next-intl/server', () => ({
  getTranslations: jest.fn().mockResolvedValue(
    (key: string, params?: Record<string, string>) => {
      if (key === 'listingsTitle') return `${params?.name ?? ''} の出品一覧`
      if (key === 'noListings') return '現在出品はありません'
      return key
    }
  ),
}))

jest.mock('@/i18n/navigation', () => ({
  Link: ({
    href,
    children,
    className,
  }: {
    href: string
    children: React.ReactNode
    className?: string
  }) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
}))

jest.mock('@/components/Sidebar', () => () => <div data-testid="sidebar" />)

jest.mock('@/components/GameListingList', () => ({
  __esModule: true,
  default: ({ listings }: { listings: { id: number }[] }) => (
    <div data-testid="game-listing-list">{listings.length} 件</div>
  ),
}))

const makeParams = (category: string, slug: string) =>
  Promise.resolve({ locale: 'ja', category, slug })

describe('GamePage', () => {
  it('ゲーム名を含む見出しと出品リストを表示する', async () => {
    render(await GamePage({ params: makeParams('pc', 'ffxiv') }))
    expect(
      screen.getByText('ファイナルファンタジーXIV の出品一覧')
    ).toBeInTheDocument()
    expect(screen.getByTestId('game-listing-list')).toBeInTheDocument()
    expect(screen.getByTestId('sidebar')).toBeInTheDocument()
  })

  it('出品がないゲームで noListings メッセージを表示する', async () => {
    // wow (ID 4) は listings.json に出品なし
    render(await GamePage({ params: makeParams('pc', 'wow') }))
    expect(screen.getByText('現在出品はありません')).toBeInTheDocument()
    expect(screen.queryByTestId('game-listing-list')).not.toBeInTheDocument()
  })

  it('無効なカテゴリで notFound を呼ぶ', async () => {
    await expect(
      GamePage({ params: makeParams('invalid', 'ffxiv') })
    ).rejects.toThrow('NEXT_NOT_FOUND')
    expect(notFound).toHaveBeenCalled()
  })

  it('存在しない slug で notFound を呼ぶ', async () => {
    await expect(
      GamePage({ params: makeParams('pc', 'nonexistent-game') })
    ).rejects.toThrow('NEXT_NOT_FOUND')
    expect(notFound).toHaveBeenCalled()
  })

  it('カテゴリが一致しない slug で notFound を呼ぶ', async () => {
    // ffxiv は pc カテゴリなので mobile では見つからない
    await expect(
      GamePage({ params: makeParams('mobile', 'ffxiv') })
    ).rejects.toThrow('NEXT_NOT_FOUND')
    expect(notFound).toHaveBeenCalled()
  })
})
```

- [ ] **Step 2: テストが失敗することを確認**

```bash
npx jest __tests__/GamePage.test.tsx --no-coverage
```

期待出力: `FAIL` — モジュールが見つからないエラー

- [ ] **Step 3: ページディレクトリを作成してページを実装する**

`app/[locale]/[category]/[slug]/page.tsx`:

```typescript
import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import Sidebar from '@/components/Sidebar'
import GameListingList from '@/components/GameListingList'
import gamesData from '@/data/games.json'
import listingsData from '@/data/listings.json'
import { Game, Listing } from '@/types'

const VALID_CATEGORIES = ['pc', 'mobile', 'other'] as const

export default async function GamePage({
  params,
}: {
  params: Promise<{ locale: string; category: string; slug: string }>
}) {
  const { category, slug } = await params

  if (!(VALID_CATEGORIES as readonly string[]).includes(category)) {
    notFound()
  }

  const game = (gamesData as Game[]).find(
    (g) => g.slug === slug && g.category === category
  )
  if (!game) {
    notFound()
  }

  const listings = (listingsData as Listing[]).filter(
    (l) => l.gameId === game.id
  )

  const t = await getTranslations('game')

  return (
    <div className="max-w-screen-xl mx-auto px-4 py-6">
      <div className="flex gap-6">
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-bold text-gray-800 mb-6">
            {t('listingsTitle', { name: game.name })}
          </h1>
          {listings.length === 0 ? (
            <p className="text-gray-500 text-sm">{t('noListings')}</p>
          ) : (
            <GameListingList listings={listings} />
          )}
        </div>
        <div className="hidden lg:block">
          <Sidebar />
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: テストが通ることを確認**

```bash
npx jest __tests__/GamePage.test.tsx --no-coverage
```

期待出力: `PASS __tests__/GamePage.test.tsx`、5 tests passed

- [ ] **Step 5: 全テストが通ることを確認**

```bash
npx jest --no-coverage
```

期待出力: 全テスト PASS（新規テスト含め全件グリーン）

- [ ] **Step 6: コミット**

```bash
git add app/[locale]/[category]/[slug]/page.tsx __tests__/GamePage.test.tsx
git commit -m "feat: 個別ゲームページ (/[category]/[slug]) を追加"
```

---

## Self-Review

### Spec coverage チェック

| 要件 | Task |
|------|------|
| `/[locale]/[category]/[slug]` ルート追加 | Task 6 |
| category 不正 → notFound | Task 6 |
| slug 不存在 → notFound | Task 6 |
| games.json 70 タイトル拡張 | Task 1 |
| listings.json 各ゲームに出品追加 | Task 2 |
| GameListingList コンポーネント | Task 4 |
| 出品リスト: 画像・タイトル・価格 | Task 4 |
| タイトルは青色リンク (href="#") | Task 4 |
| 価格は右寄せ赤色 | Task 4 |
| game namespace 翻訳追加 | Task 3 |
| category/page.tsx リンク修正 | Task 5 |
| GameRankingTable リンク修正 | Task 5 |
| GameListingList テスト | Task 4 |
| GamePage テスト | Task 6 |
| GameRankingTable テスト更新 | Task 5 |

全要件カバー済み。
