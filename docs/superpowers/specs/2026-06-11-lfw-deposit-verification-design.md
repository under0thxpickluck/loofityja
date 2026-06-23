# LFW入金検証システム 設計書

日付: 2026-06-11
対象: Lootify (RMTsite) + LIFAI (C:\Users\unitu\LIFAI)

## 背景・課題

LIFAI EP売却フローは申請作成までは動作するが、以下が未実装・不備:

1. 入金確認結果がスプレッドシートに一切反映されない（confirmedはブラウザ内stateのみ）
2. 不足送金・過剰送金のハンドリングが存在しない
3. 入金と申請の紐付けがなく、過去の入金が二重カウントされる（lfw_depositsは永久にpending）
4. `/api/lifai/sell-request` に認証がなく `platform_wallet` がクライアント自己申告（なりすまし可能）
5. `/api/ep/lfw-check` は認証なしで誰のアドレスでも照会可能
6. `source_wallet.trim()` で undefined 時に500クラッシュ
7. 認証メールが日本語（海外サイトとして英語にしたい）
8. ローカル `.env.local` に `LIFAI_GAS_URL` / `LIFAI_GAS_KEY` がない（Vercelには設定済み）

## 決定事項（ユーザー承認済み）

- 過剰送金: 返金フローなし。そのまま成立させ、実受領額を記録する
- 不足送金: 不足分の再送金を案内し、累積合計が達したら成立
- 未完了（入金待ち/入金不足）の申請がある間は新規申請をブロック（1ユーザー1件）
- シート既存列は変更せず、新列のみ日本語ヘッダーで追加
- パスワード平文は今回のスコープ外
- 認証メールは英語（海外サイト風）に変更

## アーキテクチャ（案A: Next.jsサーバー主導）

入金確認・不足判定・消費マーク・シート書き戻しのロジックをNext.js APIルートに集約する。

```
ブラウザ ──> POST /api/lifai/deposit-status (session_token + request_id)
              │ 1. Lootify GAS: get_lifai_sell_requests で本人の申請か検証
              │ 2. LIFAI GAS: check_lfw_deposit で全入金取得
              │ 3. 未消費分を合計して判定
              │ 4a. 達成: LIFAI consume_lfw_deposits → Lootify update（確認済み）
              │ 4b. 不足: Lootify update（入金不足 + 受領/不足EP）
              └ 5. UIへ state を返す
```

### ステータスモデル（LifaiSellRequests.status）

| 値 | 意味 |
|---|---|
| `入金待ち` | 申請直後。入金ゼロ（旧 `pending` も同義として扱う） |
| `入金不足` | 入金はあるが申請EP数に未達 |
| `入金確認済み` | 累積入金が申請EP数以上。入金は消費済みマーク |

### 入金の紐付け・冪等性

- 有効合計 = `status == 'pending'` の入金 + `consumed_by == 当該request_id` の入金 の合計。
  consume後に書き戻しが失敗しても、再チェックで同じ結果になる（冪等・クラッシュ安全）
- 確認済みの申請への deposit-status は LIFAI を呼ばず即 confirmed を返す
- 1ユーザー1未完了申請の制約により「このアドレスの未消費入金 = この申請の入金」が成立

## 変更詳細

### 1. LIFAI側 GAS (`C:\Users\unitu\LIFAI\gas\Code.gs`)

- 新アクション `consume_lfw_deposits`（既存同様 key=SECRET 必須）
  - 入力: `{ lfw_address, deposit_ids: string[], consumed_by: string }`
  - 処理: lfw_deposits の該当行（lfw_address一致 かつ deposit_id ∈ deposit_ids かつ status=='pending'）を
    `status='consumed'`, `consumed_by`, `consumed_at` に更新。列がなければ ensureCols で追加
  - 出力: `{ ok: true, consumed: <件数> }`
- `check_lfw_deposit` は変更なし（min_amount=0 で全件・金額・日時・statusが取れることを確認済み）
- 再デプロイが必要

### 2. Lootify側 GAS (`gas/Code.gs`)

- `create_lifai_sell_request` を認証付きに変更:
  - 入力に `session_token` 追加。セッション検証 → user_id / wallet_address をサーバー側で導出
    （wallet未設定なら既存ロジック同様に自動生成）
  - 同一ユーザーの `入金待ち` / `入金不足` / `pending` 申請が存在すれば
    `{ ok: false, code: 'OPEN_REQUEST_EXISTS' }`
  - `source_wallet` 入力は廃止（列は空のまま残す）
  - 数値バリデーション（ep_amount等）を追加
- 新アクション `update_lifai_deposit_status`（`api_key` が Script Properties `LOOTIFY_API_KEY` と一致必須）:
  - 入力: `{ api_key, request_id, status, received_ep, shortfall_ep, deposit_ids, source_login_ids, confirmed_at?, checked_at }`
  - 該当行の新列＋statusを更新。request_id 不在なら `REQUEST_NOT_FOUND`
- `get_lifai_sell_requests`: フィルタを `申請者ユーザーID == session.user_id` に変更
  （旧データ互換: 申請者ユーザーID が空の行は platform_wallet 一致でフォールバック）。
  レスポンスに status / 受領EP合計 / 不足EP / 入金確認日時 を含める
- LifaiSellRequests 追加列（既存14列の右に追加。getSheet新規作成時はヘッダーに含める）:
  `申請者ユーザーID` `受領EP合計` `不足EP` `充当入金ID` `送信元LIFAI_ID` `入金確認日時` `最終チェック日時`
- 認証メール（signup / resend_verify_code）を英語テンプレートに変更:
  - 件名: `[Lootify] Verify your email address` / `[Lootify] Your new verification code`
  - 本文: 英語のプロフェッショナルな文面（コード、有効期限30分、心当たりがない場合の注記）
- 再デプロイ + Script Properties に `LOOTIFY_API_KEY` 追加が必要

### 3. Next.js APIルート

- `app/api/lifai/sell-request/route.ts`:
  - `req.json()` を try/catch（400で返す）
  - `session_token` 必須。`platform_wallet` / `source_wallet` をbodyから受け取らない
  - GAS `create_lifai_sell_request` に session_token を渡す。`OPEN_REQUEST_EXISTS` はそのままクライアントへ
  - レート取得失敗時は既存どおり502
- 新設 `app/api/lifai/deposit-status/route.ts`:
  - 入力: `{ session_token, request_id }`（不正JSON/欠落は400）
  - 上記アーキテクチャのフローを実装。LIFAIへは `LIFAI_GAS_URL` + `LIFAI_GAS_KEY`、
    Lootify GAS更新へは `LOOTIFY_GAS_KEY`（サーバー専用env）を使用
  - 出力: `{ ok, state: 'waiting'|'insufficient'|'confirmed', required_ep, received_ep, shortfall_ep, overpaid_ep }`
  - 毎チェックで `最終チェック日時` を書き戻す（waiting時も）
- `app/api/ep/lfw-check/route.ts` は削除（無認証照会の廃止。deposit-statusに置換）

### 4. UI

- `components/LifaiSellRequestForm.tsx`:
  - 申請成功レスポンスの request_id でポーリング（30秒 × 20回 = 10分）→ deposit-status
  - 表示: 確認中 / 入金不足（受領X EP・不足Y EP・「不足分 Y EP を同じアドレスへ再送金してください」）/
    確認済み（過剰時は受領合計も表示）/ タイムアウト（「再確認」ボタンで手動チェック）
  - `OPEN_REQUEST_EXISTS` エラー時は専用メッセージ（プロフィールの履歴へのリンク付き）
- `components/LifaiSellHistory.tsx`:
  - 「入金確認」→ deposit-status。insufficient時は不足EPを表示
  - ステータスバッジ色分け: 入金待ち/pending=amber、入金不足=red、入金確認済み=emerald
- `messages/en.json` / `ja.json` / `zh.json` に新キー追加
  （insufficient案内、再確認ボタン、OPEN_REQUEST_EXISTS、過剰受領表示など）

### 5. 環境変数

| 変数 | 場所 | 状態 |
|---|---|---|
| `LIFAI_GAS_URL` / `LIFAI_GAS_KEY` | Vercel | 設定済み。ローカル `.env.local` には要追加（ユーザー作業） |
| `LOOTIFY_GAS_KEY` | Vercel + `.env.local` | 新規。GAS Script Properties `LOOTIFY_API_KEY` と同値（ユーザー作業） |

## 壊さないための事前チェック・検証

1. 実装前に `npx tsc --noEmit` / `npx next build` でベースライン確認
2. シートは列追加のみ。既存行・既存列・既存データは無変更。旧 `pending` 行は `入金待ち` として表示
3. ログイン・購入・サインアップのフローはメール文面以外変更しない
4. 実装後に再度 tsc / build、および curl でAPIルートのエラーパス（400/401/不正JSON）を確認
5. GAS再デプロイ後にエンドツーエンド手動確認（申請→送金→不足→再送→確認済み→シート反映）

## スコープ外

- パスワードの平文保存（ユーザー指示により対象外）
- 過剰送金の返金フロー（不要と決定）
- USDT送金（payout）の自動化。`入金確認済み` 以降の送金処理は運営の手動運用
