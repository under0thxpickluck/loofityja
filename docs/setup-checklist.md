# loofityja セットアップチェックリスト

## 1. aisalon GAS を再デプロイ

新しいアクションを追加したため、GASを新バージョンとして再デプロイする必要があります。

**手順**
1. aisalon の GAS エディタを開く
2. 右上「デプロイ」→「デプロイを管理」
3. 鉛筆アイコン（編集）をクリック
4. バージョンを「新バージョン」に変更
5. 「デプロイ」→ 表示された **WebApp URL** をメモする

---

## 2. GAS Script Properties の設定

GASエディタ → 左メニュー「プロジェクトの設定」→「スクリプトプロパティ」

| プロパティ名 | 値 | 備考 |
|---|---|---|
| `SECRET_KEY` | （既存の値のまま） | 変更不要 |
| `ADMIN_SECRET` | （既存の値のまま） | 変更不要 |
| `LOOTIFY_API_KEY` | 任意の強固な文字列 | Vercel の `AISALON_GAS_KEY` と同じ値にする |

---

## 3. aisalon スプレッドシートに `aisalon_wallets` シートを作成

aisalon のスプレッドシートを開き、シート名 **`aisalon_wallets`** を手動で追加する。

**列構成（1行目はヘッダー）**

| slot | login_id | label | active |
|---|---|---|---|
| 1 | 運営アカウントの login_id | メインウォレット | true |

- `login_id` 欄には、ユーザーが GiftEP を送る宛先となる **運営の login_id** を入力する
- 複数スロット追加可（例: slot=2, active=true で複数ウォレットをローテーション）
- `active` が `true` のものだけが換金申請時に使われる

---

## 4. Vercel 環境変数の設定

Vercel ダッシュボード → Project → **Settings → Environment Variables**

| 変数名 | 値 | 備考 |
|---|---|---|
| `NEXT_PUBLIC_GAS_URL` | aisalon GAS WebApp URL | 手順1でメモしたURL |
| `AISALON_GAS_URL` | aisalon GAS WebApp URL | 同上（サーバー専用） |
| `AISALON_GAS_KEY` | `LOOTIFY_API_KEY` と同じ値 | 手順2で設定したもの |

設定後、Vercel の **Redeploy**（再デプロイ）を実行して環境変数を反映させる。

---

## 5. 動作確認

以下の順番で確認する。

1. **トップページ表示** — `https://your-domain.vercel.app/en/` が開けるか
2. **ログイン** — aisalon の login_id + パスワードでログインできるか
3. **換金申請フォーム** — `/en/pc/lifai/sell` でフォームが表示されるか
4. **申請送信** — 申請後に「送金先 login_id」が表示されるか
5. **GiftEP 送金** — aisalon 本体から運営 login_id に GiftEP を送る
6. **入金確認** — HP が 30 秒ごとにポーリングして「確認済み」になるか

---

## 自動作成されるシート（作業不要）

| シート名 | タイミング |
|---|---|
| `aisalon_sell_requests` | 初回の換金申請時に GAS が自動作成 |

## 既存シート（変更不要）

| シート名 | 用途 |
|---|---|
| `applies` | ユーザー認証（login_id / pw_hash） |
| `gift_transactions` | GiftEP の送受履歴・入金確認 |

---

## 参考: ローカル開発用 `.env.local`

`.env.local.example` をコピーして値を埋める。

```bash
cp .env.local.example .env.local
```

```env
NEXT_PUBLIC_GAS_URL=https://script.google.com/macros/s/xxxxx/exec
AISALON_GAS_URL=https://script.google.com/macros/s/xxxxx/exec
AISALON_GAS_KEY=your-lootify-api-key
```
