# LFW入金検証システム 実装進捗

最終更新: 2026-06-11
ブランチ: `feature/lfw-deposit-verification`
計画書: `2026-06-11-lfw-deposit-verification.md` / 設計書: `docs/superpowers/specs/2026-06-11-lfw-deposit-verification-design.md`

## 完了済み

### Task 0: ベースライン確認 ✅
- `npx next build`: 成功
- `npm test`: **既存の失敗あり**（5スイート8件: LifaiWalletRoute / LifaiSellRequestRoute / LifaiSellRequestForm / GameListingList / ListingCard — 今回の変更前から失敗。lifai系3つは本実装で更新・削除し解消、GameListingList / ListingCard はスコープ外の既存問題として残る）
- `npx tsc --noEmit`: `__tests__/` のみエラー（@types/jest未設定の既存問題）。ゲートは「`__tests__/` 以外に新規エラーを出さない」

### Task 1: LIFAI側GAS consume_lfw_deposits ✅
リポジトリ: `C:\Users\unitu\LIFAI`
- `2383677` consume_lfw_depositsアクション追加（dispatch行・checkLfwDeposit_へのconsumed_by追加含む）
- `698429f` レビュー反映: lock_timeout処理 / status最後書き（部分更新セーフ）/ deposit_idsの空文字フィルタ
- レビュー済み（スペック準拠✅・品質✅）

### Task 2: 入金判定ロジック evaluateDeposits（TDD）✅
- `22d5684` `lib/lifai-deposit.ts` + `lib/__tests__/lifai-deposit.test.ts`（7ケース、全パス）
- TDD実施（失敗確認→実装→パス）。レビュー承認済み

### Task 3: LIFAIクライアント ✅
- `2423545` `lib/LIFAI-client.ts`（サーバー専用 check/consume、env: LIFAI_GAS_URL/KEY）

### Task 4: Lootify GAS 認証・1件制限・書き戻し ✅
- `18154c3` SHEET_HEADERS拡張（日本語7列: 申請者ユーザーID/受領EP合計/不足EP/充当入金ID/送信元LIFAI_ID/入金確認日時/最終チェック日時）、requireSessionUser_、createLifaiSellRequest認証化+1件制限、updateLifaiDepositStatus（Script Properties `LOOTIFY_API_KEY` 必須）、getLifaiSellRequestsのユーザーID基準化（旧データはplatform_walletフォールバック）
- `402e3eb` レビュー反映: 申請作成をLockServiceで保護（同時リクエストの1件制限すり抜け防止）
- レビュー済み（スペック準拠✅・品質: 承認）

### Task 5: 認証メール英語化 ✅
- `45c688e` signup / resendVerifyCode のメールを英語テンプレートに（海外サイト向け）

### Task 6+7: gas-client + sell-requestルート認証化 ✅
- `f3c039d`
  - `lib/gas-client.ts`: createLifaiSellRequest新シグネチャ（session_token必須、source_wallet/platform_wallet廃止）、updateLifaiDepositStatus追加、getLifaiSellRequests型拡張
  - `app/api/lifai/sell-request/route.ts`: 全面書き換え（不正JSON 400 / トークンなし401 / OPEN_REQUEST_EXISTS 409 / 認証エラー401 / platform_walletはGASレスポンス由来）
  - `__tests__/LifaiSellRequestRoute.test.ts`: 新契約で書き直し
  - `__tests__/LifaiWalletRoute.test.ts`: 削除（対象ルートは `12ff07d` で削除済みの孤児テスト）
- スペック準拠レビュー✅（参照実装と逐語一致、テスト変更2点も正当な逸脱と確認）
- 品質レビュー: 承認（Important 2件を `08e7f9f` で反映: GASペイロード検証テスト＋為替レート健全性チェック（0/負数/NaN→502）、payout_networkテスト、不要キャスト除去 → 再レビュー承認、**15/15パス**）
- 残メモ（対応不要と判断）: エラー識別子の表記揺れ（invalid_json / MISSING_TOKEN / 文章形式、姉妹ルートsell-requestsは400+missing_token）、CoinGecko呼び出しがトークン実検証より先（プラン通りのトレードオフ）

### Task 8: deposit-statusルート新設 ✅
- `a221222` `app/api/lifai/deposit-status/route.ts`（本人確認→確認済み早期return→checkLfwDeposits→evaluateDeposits→confirmed時はconsume先行→シート書き戻し）
- スペック準拠レビュー✅（参照実装と逐語一致、lib実シグネチャ整合確認）
- 品質レビュー: 承認（Important 3件を `4eb3a9a` で反映: GAS updateLifaiDepositStatusにScriptLock＋ステータス退行ガード（LIFAI_OPEN_STATUSES外なら最終チェック日時のみ更新のno-op）、LOOTIFY_GAS_KEY未設定は500 server_misconfiguredでフェイルファスト、insufficient/waiting書き戻し失敗のconsole.error → 再レビュー承認）
- 残メモ（対応不要と判断）: getLifaiSellRequests失敗の一律401（GAS障害も401に見える）、consume件数の検証なし（冪等リトライがconsumed:0のため等値チェック不可）、レート制限なし

### Task 10: i18n翻訳キー追加 ✅
- `cc094b8` 既存WIP（account.settings文言2行×3ファイル）を先に単独コミット（Step 10-1）
- `9806b23` ja/en/zhのlifaiセクションに7キー追加（openRequestExists / depositInsufficient / depositOverpaid / recheckDeposit / statusWaiting / statusInsufficient / statusConfirmed）
- 検証✅（コントローラが直接実施: JSON有効・7キー仕様と逐語一致・checkDeposit直後に配置・重複なし・コミットは3ファイルのみ）

### Task 11: LifaiSellRequestForm刷新 ✅
- `78a6330` フォーム認証化（session_token送信、source_wallet/platform_wallet廃止）、deposit-statusポーリング（30秒×20回＋即時1回）、insufficient（受領/不足EP）・confirmed（過剰EP）・timeout（再確認ボタン）表示、テスト10ケースで全面書き直し
- 検証✅ jest 10/10、tsc（`__tests__` 以外）エラー0
- レビュー承認（スペック逐語一致・i18nキー3言語確認済み・Critical/Important 0件）
- 残メモ（対応不要と判断・計画準拠）: 即時confirmed時にintervalの初回tickで1回余分なAPI呼び出し / 再確認直後にin-flightの旧tickが一度だけ古いstateを書く可能性（自己修復） / 送付先表示が `user?.wallet_address`（APIのplatform_walletの方が堅牢、既存挙動でスコープ外）

### Task 12: LifaiSellHistory 不足表示・バッジ色分け ✅
- `eeb24ee` deposit-statusベースの認証付きチェック（checking/waiting/insufficient/confirmed）、statusBadgeClass/statusLabel、confirmed時のローカルstatus更新、再確認ボタン
- 検証✅ tsc（`__tests__` 以外）エラー0
- レビュー承認（スペック逐語一致・型契約(gas-client/deposit-status)整合・i18n 3言語確認・Critical/Important 0件）
- 残メモ（対応不要・計画準拠）: シートstatusが入金不足の行は再確認クリックまで不足額非表示（received_ep/shortfall_epでdepositMapを初期化すれば改善可） / deposit-statusのエラーレスポンスはwaitingに黙って畳まれる

### Task 9: lfw-check削除 ✅
- `040183b` `app/api/ep/lfw-check/route.ts` 削除。コード内参照なし（ドキュメントのみ）をgrepで確認。Task 11/12後の実行順を遵守
- レビュー承認（Task 12と合同）

### Task 13: 環境変数ドキュメント＋総合検証 ✅
- `75a401c` `.env.local.example` にLIFAI_GAS_URL/KEY・LOOTIFY_GAS_KEYを追記
- 総合検証✅
  - jest: 83/85パス。失敗2スイート（GameListingList / ListingCard）はTask 0ベースラインから継続のスコープ外既存問題
  - tsc --noEmit: `__tests__` 以外エラー0（buildで`.next/types`再生成後に確認）
  - next build: 成功。ルート一覧に `/api/lifai/deposit-status` あり・`/api/ep/lfw-check` なし
  - curl手動確認: 不正JSON→400 invalid_json / 空body→400 missing_fields / トークンなし申請→401 MISSING_TOKEN / 旧lfw-check→404

### Final: ブランチ全体最終レビュー ✅ — 判定: マージ可能
- 横断チェック実施（エンドツーエンド契約整合 / 認証バイパス・シークレット露出 / 二重充当レース / コミット混入）→ 新規Critical/Important 0件
- 確認事項: 全4ホップのフィールド・ステータス文字列一貫 / シークレット3種はサーバー専用 / consume先行＋status最後書き＋ScriptLock＋退行ガードで二重充当防止成立 / ブランチ18ファイルにWIP混入なし / i18n 21キー3言語完備
- 新規Minor（マージ非ブロック・後回し可）:
  1. OPEN_REQUEST_EXISTSメッセージに履歴への実リンクなし（設計は「リンク付き」、現状は文言のみ）
  2. ステータス文字列リテラルがdeposit-status routeとLifaiSellHistoryで重複定義（共有定数化が望ましい）
  3. ポーリング中のセッション失効が無言（waiting表示のままタイムアウト。再確認ボタンで自己回復）
  4. LIFAI-clientがキーをクエリ文字列とbodyの両方で送信（ログ露出リスク、body単独で十分か要確認）

## 残タスク

なし（全タスク完了）。mainへのマージはユーザー判断待ち。

## 実装完了後のユーザー作業（コード外）

1. `.env.local` に `LIFAI_GAS_URL` / `LIFAI_GAS_KEY`（Vercelの値をコピー）と `LOOTIFY_GAS_KEY`（新規生成）を追加
2. Vercelに `LOOTIFY_GAS_KEY` を追加
3. Lootify GAS再デプロイ + Script Properties `LOOTIFY_API_KEY`（= LOOTIFY_GAS_KEY と同値）設定
4. LIFAI GAS再デプロイ
5. E2E確認: 申請→EP送付(不足)→不足表示→再送→確認済み→シートのstatus/受領EP合計/充当入金ID確認

## メモ

- 実行方式: サブエージェント駆動（実装→スペックレビュー→品質レビューのループ）
- 作業ツリーに無関係なWIPあり（listings.json、ListingCard等とmessages系の文言修正）→ コミットは常にファイル指定。messages系WIPはTask 10冒頭で単独コミット予定
- GameListingList / ListingCard のテスト失敗はスコープ外の既存問題（ユーザーに報告済み・本件では触らない）
