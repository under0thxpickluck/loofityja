# LFW入金検証システム デプロイチェックリスト

作成: 2026-06-11
実装はmainにマージ済み。以下を完了すると本番で機能する。
詳細な実装記録: `docs/superpowers/plans/2026-06-11-lfw-deposit-verification-progress.md`

## 必須タスク（この順で実施）

- [ ] **1. シークレット生成**: `LOOTIFY_GAS_KEY` 用の強いランダム文字列を新規生成する（例: `openssl rand -hex 32`）
- [ ] **2. `.env.local` に追記**（ローカル開発用）
  - `LIFAI_GAS_URL` — Vercelに設定済みの値をコピー
  - `LIFAI_GAS_KEY` — Vercelに設定済みの値をコピー
  - `LOOTIFY_GAS_KEY` — 手順1で生成した値
  - 記載例は `.env.local.example` を参照
- [ ] **3. Vercelに環境変数を追加**: `LOOTIFY_GAS_KEY`（手順1の値）
- [ ] **4. Lootify GAS を更新**
  - GASエディタの内容をこのリポジトリの `gas/Code.gs` で置き換え
  - Script Properties に `LOOTIFY_API_KEY` を追加（値は `LOOTIFY_GAS_KEY` と同じ）
  - 再デプロイ
- [ ] **5. LIFAI GAS を更新**
  - GASエディタの内容を `C:\Users\unitu\LIFAI\gas\Code.gs` で置き換え
  - 再デプロイ
- [ ] **6. Vercelへ本番デプロイ**（mainをプッシュ済みなら自動）

## E2E動作確認

- [ ] 売却申請を作成 → 申請後画面にLFWアドレスと「入金待ち」が表示される
- [ ] LIFAIから申請額より**少なめ**にEPを送付 → 30秒以内に「不足: 受領◯EP / ◯EP不足」表示になる
- [ ] 残りのEPを送付 → 「入金確認済み」表示になる（過剰に送った場合は過剰分も表示）
- [ ] スプレッドシートを確認: `status` = 入金確認済み / `受領EP合計` / `充当入金ID` が正しい
- [ ] 同一ユーザーで2件目の申請 → 「未完了の申請があります」で拒否される
- [ ] 申請履歴（プロフィール）でバッジ色分けと再確認ボタンが機能する

## 後回し可の改善メモ（マージ非ブロックのMinor）

- [ ] OPEN_REQUEST_EXISTSエラー文言に申請履歴への実リンクを付ける（設計上はリンク付き、現状は文言のみ）
- [ ] ステータス文字列（入金確認済み/入金不足）を `lib/lifai` の共有定数に集約（deposit-status routeとLifaiSellHistoryで重複定義）
- [ ] ポーリング中のセッション失効時にre-loginを促す（現状はwaiting表示のままタイムアウト）
- [ ] `lib/LIFAI-client.ts` のキー送信をbody単独にする（現状クエリ文字列にも含まれGASログに残る可能性）
- [ ] 履歴行のdepositMapをシートの `received_ep` / `shortfall_ep` で初期化（現状は再確認クリックまで不足額非表示）
- [ ] スコープ外の既存テスト失敗2件（GameListingList / ListingCard）の解消
