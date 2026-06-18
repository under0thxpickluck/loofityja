# EP → USDT 変換機構 設計ドキュメント

> 作成日: 2026-04-15
> 対象ブランチ: main
> 関連仕様: LIFAISPEC.md

---

## 1. 概要

LIFAIプラットフォームのユーザーが保有するEP（ポイント）をUSDTへ変換・売却申請できる機構。
最終承認は人間（管理者）が行う半自動フロー。

### 基本フロー

```
ユーザー
  ├─ フォームでプラン・EP数量・ウォレット情報を入力
  ├─ リアルタイムUSDT見積もりを確認
  └─ 送信 → 申請ID発行 → 管理者が最終確認・送金
```

---

## 2. アーキテクチャ

```
ユーザー (フォーム)
    │
    ├─ GET /api/lifai/wallet
    │      └─ 現在時刻から slot 計算 (6時間ごと)
    │              └─ GAS sheet "lifai_wallets" から該当ウォレット返却
    │
    └─ POST /api/lifai/sell-request
           ├─ 入力バリデーション (サーバーサイド)
           ├─ CoinGecko API で JPY/USDT リアルタイムレート取得
           ├─ USDT 見積もり計算 + 8.5% 手数料控除
           └─ GAS sheet "lifai_sell_requests" に保存 → 申請ID返却

GAS Sheets:
  ├─ lifai_wallets          (管理者が事前登録、以後放置)
  └─ lifai_sell_requests    (申請一覧、人間が最終確認・送金)
```

---

## 3. EP → USDT 換算レート

スクリーンショット（通常・5000）から導出した統合プランレート。

| プラン | EP単価 (JPY) | 備考 |
|---|---|---|
| Starter | 4EP = 1円 (¥0.25/EP) | 通常 |
| Builder | 3.5EP = 1円 (¥0.2857/EP) | 通常 |
| Automation | 3EP = 1円 (¥0.3333/EP) | 通常 / $500 |
| Core | 2.5EP = 1円 (¥0.40/EP) | 通常 / 高額 |
| Infra | 2EP = 1円 (¥0.50/EP) | 通常 / 高額 |

プランはユーザーの自己申告。管理者が申請審査時に照合する。

### 計算式

```
gross_JPY  = EP数量 × JPY_per_EP
gross_USDT = gross_JPY ÷ JPY_per_USDT  // CoinGecko リアルタイム
fee_USDT   = gross_USDT × 0.085        // 手数料 8.5%
net_USDT   = gross_USDT - fee_USDT     // 受取見込み
```

### 計算例（1,000 EP / Core / 1 USDT = 150円）

```
1,000 × ¥0.40 = ¥400
¥400 ÷ 150    = 2.667 USDT（手数料前）
手数料 8.5%   = -0.227 USDT
受取見込み     = 2.440 USDT
```

---

## 4. ウォレットローテーション

### GASシート: `lifai_wallets`

| 列 | 型 | 内容 |
|---|---|---|
| slot | number | 0〜N-1 の番号 |
| wallet_address | string | EPの送付先ウォレットアドレス |
| label | string | 管理用メモ（例: ウォレットA） |
| active | boolean | 使用対象か否か |

### ローテーションロジック

```typescript
// 6時間 = 21,600,000ms
const SIX_HOURS = 21_600_000
const activeWallets = wallets.filter(w => w.active)
const currentSlotNum = Math.floor(Date.now() / SIX_HOURS)
const slotIndex = currentSlotNum % activeWallets.length
const currentWallet = activeWallets[slotIndex]

// 次回更新時刻 = 次のスロット境界
const nextRotateAt = new Date((currentSlotNum + 1) * SIX_HOURS)
```

管理者はシートにウォレットを登録するだけ。手動更新は不要。

---

## 5. APIルート

### `GET /api/lifai/wallet`

**レスポンス:**
```json
{
  "ok": true,
  "wallet_address": "LIFAI-EP-8842-1937-5521",
  "label": "ウォレットA",
  "next_rotate_at": "2026-04-15T12:00:00.000Z"
}
```

**処理:**
1. GAS `get_lifai_wallets` action を呼び出し
2. active なウォレット一覧を取得
3. 現在スロットを計算して返却

---

### `POST /api/lifai/sell-request`

**リクエスト:**
```json
{
  "lifai_plan": "core",
  "ep_amount": 1000,
  "source_wallet": "LIFAI-USER-001122",
  "payout_network": "TRC20",
  "payout_wallet": "TXxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
}
```

**レスポンス（成功）:**
```json
{
  "ok": true,
  "request_id": "LIFAI-A3B9C2",
  "net_usdt": 2.44,
  "message": "申請を受け付けました。審査後に担当者がご確認します。"
}
```

**処理:**
1. 入力バリデーション（EP最小100、ウォレット形式等）
2. CoinGecko API `https://api.coingecko.com/api/v3/simple/price?ids=tether&vs_currencies=jpy` でJPY/USDTレート取得
3. USDT見積もり計算
4. 現在のウォレット（ローテーション）を取得
5. GAS `create_lifai_sell_request` action に全データ送信
6. 申請ID返却

**バリデーション:**
- `ep_amount` >= 100
- `lifai_plan` が有効値（starter/builder/automation/core/infra）
- `source_wallet` 必須・空文字NG
- `payout_network` が TRC20/ERC20/BEP20 のいずれか
- `payout_wallet` 必須・空文字NG

---

## 6. GASシート: `lifai_sell_requests`

| 列 | 型 | 内容 |
|---|---|---|
| request_id | string | LIFAI-XXXXXX（6文字ランダム） |
| created_at | string | ISO 8601 |
| lifai_plan | string | starter〜infra |
| ep_amount | number | 売却EP数量 |
| ep_rate_jpy | number | 適用EPレート（例: 0.40） |
| usdt_rate_jpy | number | 取得時のJPY/USDTレート |
| gross_usdt | number | 手数料前USDT |
| fee_usdt | number | 8.5%手数料 |
| net_usdt | number | 受取見込みUSDT |
| source_wallet | string | ユーザーのEP送付元ウォレット |
| payout_network | string | TRC20/ERC20/BEP20 |
| payout_wallet | string | USDT受取先ウォレット |
| platform_wallet | string | 申請時点の送付先ウォレット |
| status | string | pending（管理者が変更） |

---

## 7. GAS アクション

| action | HTTP | 内容 |
|---|---|---|
| `get_lifai_wallets` | GET | lifai_wallets シートの全行返却 |
| `create_lifai_sell_request` | POST | lifai_sell_requests に1行追加 |

---

## 8. フォームUI

```
┌─────────────────────────────────────────────────────┐
│ 現在のEP送付先ウォレット                              │
│ LIFAI-EP-8842-1937-5521                              │
│ 次回更新: あと 3時間 22分                             │
└─────────────────────────────────────────────────────┘

[プラン選択]          Starter / Builder / Automation / Core / Infra
[売却EP数量]          数値入力 (最小: 100 EP)
[あなたのEPウォレット] テキスト入力 (例: LIFAI-USER-001122)
[受取ネットワーク]    TRC20 / ERC20 / BEP20
[受取ウォレット]      テキスト入力

──────────────────────────────────────────
見込み精算サマリー (リアルタイム更新)
  レート取得: 14:32 JST
  EP単価:     ¥0.40 (Core)
  JPY換算:    ¥400
  JPY/USDT:   150.2円
  手数料前:    2.663 USDT
  手数料(8.5%): -0.226 USDT
  受取見込み:   2.437 USDT
──────────────────────────────────────────

[同意チェック x3]
[送信ボタン]
→ 申請ID発行 + "審査後に担当者が確認します" 表示
```

### レート取得タイミング
- フォームマウント時
- プラン変更時
- EP数量変更時（500ms debounce）

---

## 9. 変更対象ファイル

| ファイル | 変更内容 |
|---|---|
| `components/LifaiSellRequestForm.tsx` | プランを5種に変更、ウォレット表示追加、計算式更新、API連携 |
| `app/api/lifai/wallet/route.ts` | 新規: ウォレットローテーション |
| `app/api/lifai/sell-request/route.ts` | 新規: 申請受付・GAS送信 |
| `gas/Lifai.gs` | 新規: get_lifai_wallets / create_lifai_sell_request |
| `messages/ja.json` | プラン名・文言更新 |
| `messages/en.json` | プラン名・文言更新 |
| `messages/zh.json` | プラン名・文言更新 |
| `types/index.ts` | LifaiPlan型更新、LifaiSellRequest型更新 |

---

## 10. セキュリティ

- ウォレットアドレスはサーバーサイドのみで管理（GAS経由）
- クライアントには現在のウォレットのみ返却（リスト非公開）
- 送信バリデーションはサーバーサイドで二重チェック
- CoinGecko APIのレート取得はサーバーサイドのみ（APIキー不要の無料エンドポイント使用）
- 最終送金は人間が行うため、計算ミスによる自動送金リスクなし
