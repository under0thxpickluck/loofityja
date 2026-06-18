# LFW入金検証システム Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** LIFAI EP売却の入金確認を実装する — 不足/過剰判定、消費マークによる二重カウント防止、スプレッドシート書き戻し、認証付きAPI、英語認証メール。

**Architecture:** Next.js APIルート（`/api/lifai/deposit-status`）が判定ロジックの中心。LIFAIOV GASから入金一覧を取得し、純粋関数 `evaluateDeposits` で判定、確認成立時はLIFAIOV側で入金を `consumed` にマークしてから Lootify GAS 経由でシートへ書き戻す。「未消費 + 当該申請IDで消費済み」を合計するため書き戻し失敗後のリトライも冪等。

**Tech Stack:** Next.js 14 (App Router, route handlers), Google Apps Script ×2 (Lootify / LIFAIOV), jest + ts-jest, next-intl

**Spec:** `docs/superpowers/specs/2026-06-11-lfw-deposit-verification-design.md`

**前提知識（実装者向け）:**
- Lootify GAS = `gas/Code.gs`（このリポジトリ）。認証・申請シート(LifaiSellRequests)を持つ。`NEXT_PUBLIC_GAS_URL` で公開。
- LIFAIOV GAS = `C:\Users\unitu\lifaiov\gas\Code.gs`（別プロジェクト）。EP残高と `lfw_deposits` シートを持つ。`LIFAIOV_GAS_URL` + `?key=<LIFAIOV_GAS_KEY>` で呼ぶ。
- `check_lfw_deposit` レスポンス: `{ ok: true, deposits: [{ deposit_id, from_login_id, amount, status, created_at }] }`（本計画で `consumed_by` を追加する）
- 作業ツリーに無関係なWIP（listings, ListingCard等）がある。**コミットは必ずファイル名を明示した `git add <path>` で行うこと。`git add -A` 禁止。**

---

### Task 0: ベースライン確認（壊れていない状態の記録)

**Files:** なし（検証のみ）

- [ ] **Step 0-1: 開発サーバーが動いていれば止める**（ビルドの.nextロック競合防止）

Run: `tasklist | findstr node` で確認。`next dev` のnodeプロセスがあれば `taskkill /F /PID <pid>`（ユーザーが起動したものなら一声かける）。

- [ ] **Step 0-2: 型チェック・テスト・ビルドのベースライン**

Run: `npx tsc --noEmit`
Expected: エラー0件

Run: `npm test`
Expected: "no tests" でパス（--passWithNoTests）

Run: `npx next build`
Expected: ビルド成功。失敗した場合は**既存の問題**なので、修正前にユーザーへ報告すること。

---

### Task 1: LIFAIOV側GAS — consume_lfw_deposits アクション追加

**Files:**
- Modify: `C:\Users\unitu\lifaiov\gas\Code.gs`（dispatch行 ~7608付近、checkLfwDeposit_ ~12850付近、ファイル末尾 ~12862）

- [ ] **Step 1-1: dispatchに1行追加**

`if (action === 'check_lfw_deposit') return json_(checkLfwDeposit_(key, body));` の直後（7608行付近）に:

```js
    if (action === 'consume_lfw_deposits') return json_(consumeLfwDeposits_(key, body));
```

- [ ] **Step 1-2: checkLfwDeposit_ のdepオブジェクトに consumed_by を追加**

`created_at: str_(row[idx["created_at"]]),` の行（~12855）の直後に追加:

```js
      consumed_by: idx["consumed_by"] !== undefined ? str_(row[idx["consumed_by"]]) : "",
```

- [ ] **Step 1-3: ファイル末尾（checkLfwDeposit_ の閉じ括弧の後）に consumeLfwDeposits_ を追加**

```js
function consumeLfwDeposits_(key, body) {
  var secrets = getSecrets_();
  if (key !== secrets.SECRET) return { ok: false, error: "unauthorized" };

  var lfwAddress = str_(body.lfw_address);
  var consumedBy = str_(body.consumed_by);
  var depositIds = Array.isArray(body.deposit_ids) ? body.deposit_ids.map(str_) : [];
  if (!lfwAddress || !consumedBy || depositIds.length === 0) {
    return { ok: false, error: "missing_fields" };
  }

  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var depSheet = ss.getSheetByName("lfw_deposits");
    if (!depSheet) return { ok: false, error: "no_deposit_sheet" };

    var values = depSheet.getDataRange().getValues();
    if (values.length < 2) return { ok: false, error: "no_deposits" };

    var header = values[0];
    ensureCols_(depSheet, header, ["consumed_by", "consumed_at"]);
    var idx = indexMap_(header);

    var nowIso = new Date().toISOString();
    var consumed = 0;
    for (var i = 1; i < values.length; i++) {
      var row = values[i];
      if (str_(row[idx["lfw_address"]]) !== lfwAddress) continue;
      if (depositIds.indexOf(str_(row[idx["deposit_id"]])) === -1) continue;
      if (str_(row[idx["status"]]) !== "pending") continue;
      depSheet.getRange(i + 1, idx["status"] + 1).setValue("consumed");
      depSheet.getRange(i + 1, idx["consumed_by"] + 1).setValue(consumedBy);
      depSheet.getRange(i + 1, idx["consumed_at"] + 1).setValue(nowIso);
      consumed++;
    }
    return { ok: true, consumed: consumed };
  } finally {
    lock.releaseLock();
  }
}
```

注: `ensureCols_(sheet, header, cols)` は既存ヘルパー（6023行）で、headerに無い列名をシート1行目の右端に追記し、header配列にもpushする。`indexMap_` はその更新後のheaderから作るので新列のidxも取れる。

- [ ] **Step 1-4: コミット（lifaiovがgitリポジトリの場合のみ）**

Run: `git -C C:\Users\unitu\lifaiov rev-parse --is-inside-work-tree`
リポジトリなら:
```bash
git -C C:\Users\unitu\lifaiov add gas/Code.gs
git -C C:\Users\unitu\lifaiov commit -m "feat: LFW入金の消費マークアクション(consume_lfw_deposits)を追加"
```
リポジトリでなければスキップ（変更はファイルとして残る）。

---

### Task 2: 入金判定の純粋関数 `evaluateDeposits`（TDD）

**Files:**
- Create: `lib/lifai-deposit.ts`
- Test: `lib/__tests__/lifai-deposit.test.ts`

- [ ] **Step 2-1: 失敗するテストを書く**

`lib/__tests__/lifai-deposit.test.ts`:

```ts
import { evaluateDeposits, LfwDeposit } from '../lifai-deposit'

function dep(partial: Partial<LfwDeposit>): LfwDeposit {
  return {
    deposit_id: 'LFW-DEP-X',
    from_login_id: 'user01',
    amount: 0,
    status: 'pending',
    created_at: '2026-06-11T00:00:00.000Z',
    consumed_by: '',
    ...partial,
  }
}

describe('evaluateDeposits', () => {
  const REQ = 'LIFAI-ABC123'

  it('入金ゼロなら waiting で不足=必要数', () => {
    const r = evaluateDeposits([], REQ, 1000)
    expect(r.state).toBe('waiting')
    expect(r.receivedEp).toBe(0)
    expect(r.shortfallEp).toBe(1000)
    expect(r.pendingDepositIds).toEqual([])
  })

  it('不足なら insufficient で不足額を返す', () => {
    const r = evaluateDeposits([dep({ deposit_id: 'D1', amount: 400 })], REQ, 1000)
    expect(r.state).toBe('insufficient')
    expect(r.receivedEp).toBe(400)
    expect(r.shortfallEp).toBe(600)
    expect(r.pendingDepositIds).toEqual(['D1'])
  })

  it('複数入金の合計がちょうどなら confirmed・過剰0', () => {
    const r = evaluateDeposits(
      [dep({ deposit_id: 'D1', amount: 400 }), dep({ deposit_id: 'D2', amount: 600, from_login_id: 'user02' })],
      REQ, 1000
    )
    expect(r.state).toBe('confirmed')
    expect(r.receivedEp).toBe(1000)
    expect(r.overpaidEp).toBe(0)
    expect(r.pendingDepositIds).toEqual(['D1', 'D2'])
    expect(r.usableDepositIds).toEqual(['D1', 'D2'])
    expect(r.sourceLoginIds).toEqual(['user01', 'user02'])
  })

  it('過剰なら confirmed で超過分を返す（そのまま成立）', () => {
    const r = evaluateDeposits([dep({ deposit_id: 'D1', amount: 1500 })], REQ, 1000)
    expect(r.state).toBe('confirmed')
    expect(r.overpaidEp).toBe(500)
  })

  it('他申請で消費済みの入金は数えない', () => {
    const r = evaluateDeposits(
      [dep({ deposit_id: 'D1', amount: 1000, status: 'consumed', consumed_by: 'LIFAI-OTHER' })],
      REQ, 1000
    )
    expect(r.state).toBe('waiting')
  })

  it('この申請で消費済みの入金は数える（書き戻しリトライの冪等性）', () => {
    const r = evaluateDeposits(
      [dep({ deposit_id: 'D1', amount: 1000, status: 'consumed', consumed_by: REQ })],
      REQ, 1000
    )
    expect(r.state).toBe('confirmed')
    expect(r.pendingDepositIds).toEqual([]) // 再consumeは不要
    expect(r.usableDepositIds).toEqual(['D1'])
  })

  it('amountが数値でない行は0として扱う', () => {
    const r = evaluateDeposits([dep({ deposit_id: 'D1', amount: NaN })], REQ, 1000)
    expect(r.state).toBe('waiting')
  })
})
```

- [ ] **Step 2-2: テストが失敗することを確認**

Run: `npx jest lib/__tests__/lifai-deposit.test.ts`
Expected: FAIL（`Cannot find module '../lifai-deposit'`）

- [ ] **Step 2-3: 実装**

`lib/lifai-deposit.ts`:

```ts
export type LfwDeposit = {
  deposit_id: string
  from_login_id: string
  amount: number
  status: string
  created_at: string
  consumed_by?: string
}

export type DepositState = 'waiting' | 'insufficient' | 'confirmed'

export type DepositEvaluation = {
  state: DepositState
  receivedEp: number
  shortfallEp: number
  overpaidEp: number
  /** statusがpendingで、確認成立時にconsumeすべき入金ID */
  pendingDepositIds: string[]
  /** この申請に充当される全入金ID（pending + 本申請でconsumed済み） */
  usableDepositIds: string[]
  /** 充当入金の送信元LIFAIOVログインID（重複除去） */
  sourceLoginIds: string[]
}

/**
 * 申請に充当できる入金 = 未消費(pending) + この申請IDで消費済み。
 * consume後にシート書き戻しが失敗しても、再評価で同じ結果になる（冪等）。
 */
export function evaluateDeposits(
  deposits: LfwDeposit[],
  requestId: string,
  requiredEp: number
): DepositEvaluation {
  const usable = deposits.filter(
    (d) => d.status === 'pending' || (requestId !== '' && d.consumed_by === requestId)
  )
  const receivedEp = usable.reduce((sum, d) => sum + (Number(d.amount) || 0), 0)

  if (receivedEp <= 0) {
    return {
      state: 'waiting',
      receivedEp: 0,
      shortfallEp: requiredEp,
      overpaidEp: 0,
      pendingDepositIds: [],
      usableDepositIds: [],
      sourceLoginIds: [],
    }
  }

  const pendingDepositIds = usable.filter((d) => d.status === 'pending').map((d) => d.deposit_id)
  const usableDepositIds = usable.map((d) => d.deposit_id)
  const sourceLoginIds = Array.from(new Set(usable.map((d) => d.from_login_id).filter(Boolean)))

  if (receivedEp < requiredEp) {
    return {
      state: 'insufficient',
      receivedEp,
      shortfallEp: requiredEp - receivedEp,
      overpaidEp: 0,
      pendingDepositIds,
      usableDepositIds,
      sourceLoginIds,
    }
  }

  return {
    state: 'confirmed',
    receivedEp,
    shortfallEp: 0,
    overpaidEp: receivedEp - requiredEp,
    pendingDepositIds,
    usableDepositIds,
    sourceLoginIds,
  }
}
```

- [ ] **Step 2-4: テストが通ることを確認**

Run: `npx jest lib/__tests__/lifai-deposit.test.ts`
Expected: 7 passed

- [ ] **Step 2-5: コミット**

```bash
git add lib/lifai-deposit.ts lib/__tests__/lifai-deposit.test.ts
git commit -m "feat: LFW入金の判定ロジック(evaluateDeposits)を追加"
```

---

### Task 3: LIFAIOV GASクライアント（サーバー専用）

**Files:**
- Create: `lib/lifaiov-client.ts`

- [ ] **Step 3-1: 実装**（薄いfetchラッパー。ユニットテストは省略し、Task 8のルートと合わせてtsc/手動で検証）

```ts
import { LfwDeposit } from '@/lib/lifai-deposit'

/**
 * LIFAIOV側GASのクライアント。サーバー専用（環境変数 LIFAIOV_GAS_URL / LIFAIOV_GAS_KEY を使用）。
 * クライアントコンポーネントからimportしないこと。
 */
async function callLifaiov<T>(payload: Record<string, unknown>): Promise<T | null> {
  const gasUrl = process.env.LIFAIOV_GAS_URL
  const gasKey = process.env.LIFAIOV_GAS_KEY
  if (!gasUrl || !gasKey) {
    console.error('[lifaiov-client] LIFAIOV_GAS_URL / LIFAIOV_GAS_KEY is not set')
    return null
  }
  try {
    const url = `${gasUrl}${gasUrl.includes('?') ? '&' : '?'}key=${encodeURIComponent(gasKey)}`
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
      body: JSON.stringify({ key: gasKey, ...payload }),
    })
    return (await res.json()) as T
  } catch (err) {
    console.error('[lifaiov-client] request failed:', err)
    return null
  }
}

export type LifaiovCheckResult = { ok: boolean; deposits?: LfwDeposit[]; error?: string }
export type LifaiovConsumeResult = { ok: boolean; consumed?: number; error?: string }

export function checkLfwDeposits(lfwAddress: string): Promise<LifaiovCheckResult | null> {
  return callLifaiov<LifaiovCheckResult>({ action: 'check_lfw_deposit', lfw_address: lfwAddress, min_amount: 0 })
}

export function consumeLfwDeposits(
  lfwAddress: string,
  depositIds: string[],
  consumedBy: string
): Promise<LifaiovConsumeResult | null> {
  return callLifaiov<LifaiovConsumeResult>({
    action: 'consume_lfw_deposits',
    lfw_address: lfwAddress,
    deposit_ids: depositIds,
    consumed_by: consumedBy,
  })
}
```

- [ ] **Step 3-2: 型チェック**

Run: `npx tsc --noEmit`
Expected: エラー0件

- [ ] **Step 3-3: コミット**

```bash
git add lib/lifaiov-client.ts
git commit -m "feat: LIFAIOV GASクライアント(check/consume)を追加"
```

---

### Task 4: Lootify GAS — 申請の認証・1件制限・書き戻しアクション

**Files:**
- Modify: `gas/Code.gs`

- [ ] **Step 4-1: SHEET_HEADERS の LifaiSellRequests に新列を追加**（57-64行）

```js
const SHEET_HEADERS = {
  Users:            ['id','email','password_hash','display_name','first_name','last_name','country','phone','marketing_opt_in','email_verified','created_at','last_login','wallet_address'],
  Sessions:         ['token','user_id','created_at','expires_at'],
  VerifyCodes:      ['email','code','created_at','expires_at'],
  Purchases:        ['id','user_id','item_id','item_title','item_price','currency','quantity','status','payment_url','created_at'],
  LifaiWallets:     ['slot','wallet_address','label','active'],
  LifaiSellRequests:['request_id','plan','ep_amount','ep_rate_jpy','usdt_rate_jpy','gross_usdt','fee_usdt','net_usdt','source_wallet','payout_network','payout_wallet','platform_wallet','status','created_at',
                     '申請者ユーザーID','受領EP合計','不足EP','充当入金ID','送信元LIFAIOV_ID','入金確認日時','最終チェック日時'],
}

// LifaiSellRequests の追加列（既存シートには ensureLifaiColumns_ で後付けする）
const LIFAI_NEW_COLUMNS = ['申請者ユーザーID','受領EP合計','不足EP','充当入金ID','送信元LIFAIOV_ID','入金確認日時','最終チェック日時']
// 「未完了」とみなす申請ステータス（pendingは旧データ互換）
const LIFAI_OPEN_STATUSES = ['pending', '入金待ち', '入金不足']
```

- [ ] **Step 4-2: シートユーティリティに2ヘルパー追加**（ensureColumn の直後、~115行）

```js
/** LifaiSellRequests に新列が無ければ追加する（既存シートのマイグレーション） */
function ensureLifaiColumns_(sheet) {
  LIFAI_NEW_COLUMNS.forEach(function (c) { ensureColumn(sheet, c) })
}

/** ヘッダー名→値 のオブジェクトで1行追記する（列順に依存しない） */
function appendRowByHeaders_(sheet, obj) {
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0]
  const row = headers.map(function (h) { return obj[h] !== undefined ? obj[h] : '' })
  sheet.appendRow(row)
}
```

- [ ] **Step 4-3: セッション検証ヘルパーを追加**（ユーティリティ節、newWalletAddress の後 ~135行）

```js
/**
 * セッショントークンを検証し、ユーザー行を返す。
 * 失敗時は { ok:false, res:<クライアントへ返すエラー> }、成功時は { ok:true, user, usersSheet, userRow }
 */
function requireSessionUser_(session_token) {
  if (!session_token)
    return { ok: false, res: { ok: false, code: 'MISSING_TOKEN', message: 'セッショントークンが必要です。' } }

  const sessionsSheet = getSheet('Sessions')
  const sessionRow = findRow(sessionsSheet, 'token', session_token)
  if (sessionRow < 0)
    return { ok: false, res: { ok: false, code: 'INVALID_TOKEN', message: '無効なセッションです。再ログインしてください。' } }

  const session = getRowObj(sessionsSheet, sessionRow)
  if (new Date() > new Date(session.expires_at)) {
    sessionsSheet.deleteRow(sessionRow)
    return { ok: false, res: { ok: false, code: 'SESSION_EXPIRED', message: 'セッションの有効期限が切れました。再ログインしてください。' } }
  }

  const usersSheet = getSheet('Users')
  const userRow = findRow(usersSheet, 'id', session.user_id)
  if (userRow < 0)
    return { ok: false, res: { ok: false, code: 'USER_NOT_FOUND', message: 'ユーザーが見つかりません。' } }

  const user = getRowObj(usersSheet, userRow)
  if (!user.wallet_address) {
    ensureColumn(usersSheet, 'wallet_address')
    user.wallet_address = newWalletAddress()
    setCellByKey(usersSheet, userRow, 'wallet_address', user.wallet_address)
  }
  return { ok: true, user: user, usersSheet: usersSheet, userRow: userRow }
}
```

既存の login / me / getLifaiSellRequests のセッション処理は**触らない**（壊さないため。重複は許容）。

- [ ] **Step 4-4: createLifaiSellRequest を認証付きに全面書き換え**（440-453行）

```js
function createLifaiSellRequest(params) {
  const auth = requireSessionUser_(params.session_token)
  if (!auth.ok) return auth.res
  const user = auth.user

  const ep = Number(params.ep_amount)
  if (!isFinite(ep) || ep < 100 || Math.floor(ep) !== ep)
    return { ok: false, code: 'INVALID_EP_AMOUNT', message: 'EP数量は100以上の整数で指定してください。' }
  if (!params.request_id || !params.lifai_plan || !params.payout_network || !params.payout_wallet)
    return { ok: false, code: 'MISSING_FIELDS', message: '必須項目が不足しています。' }

  const sheet = getSheet('LifaiSellRequests')
  ensureLifaiColumns_(sheet)

  // 1ユーザー1未完了申請の制限
  const data = sheet.getDataRange().getValues()
  if (data.length > 1) {
    const idx = {}
    data[0].forEach(function (h, i) { idx[h] = i })
    for (let i = 1; i < data.length; i++) {
      const status = String(data[i][idx['status']])
      if (LIFAI_OPEN_STATUSES.indexOf(status) === -1) continue
      const rowUserId = idx['申請者ユーザーID'] !== undefined ? String(data[i][idx['申請者ユーザーID']] || '') : ''
      const isMine = rowUserId
        ? rowUserId === String(user.id)
        : String(data[i][idx['platform_wallet']]) === String(user.wallet_address) // 旧データ互換
      if (isMine) {
        return {
          ok: false, code: 'OPEN_REQUEST_EXISTS',
          message: '未完了の売却申請があります。先に入金を完了してください。',
          data: { request_id: String(data[i][idx['request_id']]) }
        }
      }
    }
  }

  appendRowByHeaders_(sheet, {
    request_id: params.request_id,
    plan: params.lifai_plan,
    ep_amount: ep,
    ep_rate_jpy: params.ep_rate_jpy,
    usdt_rate_jpy: params.usdt_rate_jpy,
    gross_usdt: params.gross_usdt,
    fee_usdt: params.fee_usdt,
    net_usdt: params.net_usdt,
    source_wallet: '',
    payout_network: params.payout_network,
    payout_wallet: params.payout_wallet,
    platform_wallet: user.wallet_address,
    status: '入金待ち',
    created_at: new Date().toISOString(),
    '申請者ユーザーID': user.id,
    '受領EP合計': 0,
    '不足EP': ep,
  })

  return { ok: true, code: 'SELL_REQUEST_OK', data: { request_id: params.request_id, platform_wallet: user.wallet_address } }
}
```

- [ ] **Step 4-5: 書き戻しアクション updateLifaiDepositStatus を追加**（createLifaiSellRequest の直後）

```js
function updateLifaiDepositStatus(params) {
  const expected = PropertiesService.getScriptProperties().getProperty('LOOTIFY_API_KEY')
  if (!expected || !params.api_key || String(params.api_key) !== String(expected))
    return { ok: false, code: 'UNAUTHORIZED', message: 'APIキーが不正です。' }
  if (!params.request_id)
    return { ok: false, code: 'MISSING_FIELDS', message: 'request_idは必須です。' }

  const sheet = getSheet('LifaiSellRequests')
  ensureLifaiColumns_(sheet)
  const row = findRow(sheet, 'request_id', params.request_id)
  if (row < 0) return { ok: false, code: 'REQUEST_NOT_FOUND', message: '申請が見つかりません。' }

  if (params.status !== undefined) setCellByKey(sheet, row, 'status', params.status)
  if (params.received_ep !== undefined) setCellByKey(sheet, row, '受領EP合計', Number(params.received_ep) || 0)
  if (params.shortfall_ep !== undefined) setCellByKey(sheet, row, '不足EP', Number(params.shortfall_ep) || 0)
  if (params.deposit_ids !== undefined)
    setCellByKey(sheet, row, '充当入金ID', Array.isArray(params.deposit_ids) ? params.deposit_ids.join(', ') : String(params.deposit_ids))
  if (params.source_login_ids !== undefined)
    setCellByKey(sheet, row, '送信元LIFAIOV_ID', Array.isArray(params.source_login_ids) ? params.source_login_ids.join(', ') : String(params.source_login_ids))
  if (params.confirmed_at) setCellByKey(sheet, row, '入金確認日時', params.confirmed_at)
  setCellByKey(sheet, row, '最終チェック日時', new Date().toISOString())

  return { ok: true, code: 'UPDATE_OK', data: { request_id: params.request_id } }
}
```

- [ ] **Step 4-6: getLifaiSellRequests をユーザーID基準に書き換え**（395-438行）

```js
function getLifaiSellRequests({ session_token }) {
  const auth = requireSessionUser_(session_token)
  if (!auth.ok) return auth.res
  const user = auth.user
  const walletAddress = user.wallet_address || ''

  const reqSheet = getSheet('LifaiSellRequests')
  ensureLifaiColumns_(reqSheet)
  const data = reqSheet.getDataRange().getValues()
  if (data.length < 2) return { ok: true, code: 'OK', data: { requests: [], wallet_address: walletAddress } }

  const idx = {}
  data[0].forEach(function (h, i) { idx[h] = i })

  const requests = data.slice(1)
    .filter(function (r) {
      const rowUserId = String(r[idx['申請者ユーザーID']] || '')
      if (rowUserId) return rowUserId === String(user.id)
      return String(r[idx['platform_wallet']]) === walletAddress // 旧データ互換
    })
    .map(function (r) {
      return {
        request_id:      String(r[idx['request_id']]),
        lifai_plan:      String(r[idx['plan']]),
        ep_amount:       Number(r[idx['ep_amount']]),
        net_usdt:        Number(r[idx['net_usdt']]),
        payout_network:  String(r[idx['payout_network']]),
        platform_wallet: String(r[idx['platform_wallet']]),
        status:          String(r[idx['status']]),
        created_at:      String(r[idx['created_at']]),
        received_ep:     Number(r[idx['受領EP合計']]) || 0,
        shortfall_ep:    Number(r[idx['不足EP']]) || 0,
        confirmed_at:    String(r[idx['入金確認日時']] || ''),
      }
    })
    .sort(function (a, b) { return new Date(b.created_at).getTime() - new Date(a.created_at).getTime() })

  return { ok: true, code: 'OK', data: { requests: requests, wallet_address: walletAddress } }
}
```

- [ ] **Step 4-7: dispatch に新アクションを追加**（36-51行のswitch内）

`case 'get_lifai_sell_requests':` の行の直後に:

```js
    case 'update_lifai_deposit_status': return updateLifaiDepositStatus(params)
```

- [ ] **Step 4-8: コミット**

```bash
git add gas/Code.gs
git commit -m "feat: GASに入金書き戻し・申請認証・1件制限を実装"
```

---

### Task 5: Lootify GAS — 認証メールを英語化

**Files:**
- Modify: `gas/Code.gs`（signup内 168-183行、resendVerifyCode内 232-246行）

- [ ] **Step 5-1: signup の MailApp.sendEmail を差し替え**

```js
  try {
    MailApp.sendEmail({
      to: email,
      subject: `[${SITE_NAME}] Verify your email address`,
      htmlBody: `
        <div style="font-family:Arial,Helvetica,sans-serif;max-width:480px;margin:0 auto;padding:24px">
          <h2 style="color:#0b1929">Welcome to ${SITE_NAME}</h2>
          <p>Hi ${display_name},</p>
          <p>Thanks for signing up. Enter the verification code below to confirm your email address:</p>
          <div style="font-size:36px;font-weight:bold;letter-spacing:8px;color:#0b1929;padding:16px;background:#f0f7ff;border-radius:8px;text-align:center">
            ${code}
          </div>
          <p style="color:#888;font-size:12px">This code expires in ${VERIFY_CODE_EXPIRE_MIN} minutes.</p>
          <p style="color:#888;font-size:12px">If you didn't create a ${SITE_NAME} account, you can safely ignore this email.</p>
        </div>`,
    })
  } catch (err) { Logger.log('Mail error: ' + err.message) }
```

- [ ] **Step 5-2: resendVerifyCode の MailApp.sendEmail を差し替え**

```js
  try {
    MailApp.sendEmail({
      to: email,
      subject: `[${SITE_NAME}] Your new verification code`,
      htmlBody: `
        <div style="font-family:Arial,Helvetica,sans-serif;max-width:480px;margin:0 auto;padding:24px">
          <h2 style="color:#0b1929">Your new verification code</h2>
          <p>Hi ${user.display_name},</p>
          <p>Here is the new verification code you requested:</p>
          <div style="font-size:36px;font-weight:bold;letter-spacing:8px;color:#0b1929;padding:16px;background:#f0f7ff;border-radius:8px;text-align:center">
            ${code}
          </div>
          <p style="color:#888;font-size:12px">This code expires in ${VERIFY_CODE_EXPIRE_MIN} minutes.</p>
          <p style="color:#888;font-size:12px">If you didn't request this code, you can safely ignore this email.</p>
        </div>`,
    })
  } catch (err) { Logger.log('Mail error: ' + err.message) }
```

- [ ] **Step 5-3: コミット**

```bash
git add gas/Code.gs
git commit -m "feat: 認証メールを英語テンプレートに変更"
```

---

### Task 6: gas-client.ts — シグネチャ更新と新メソッド

**Files:**
- Modify: `lib/gas-client.ts`（89-119行）

- [ ] **Step 6-1: getLifaiSellRequests の型・createLifaiSellRequest のpayload・updateLifaiDepositStatus を更新**

`getLifaiSellRequests` と `createLifaiSellRequest` を以下に置き換え、`updateLifaiDepositStatus` を追加:

```ts
  getLifaiSellRequests(sessionToken: string) {
    return postToGas<{
      requests: Array<{
        request_id: string
        lifai_plan: string
        ep_amount: number
        net_usdt: number
        payout_network: string
        platform_wallet: string
        status: string
        created_at: string
        received_ep: number
        shortfall_ep: number
        confirmed_at: string
      }>
      wallet_address: string
    }>('get_lifai_sell_requests', { session_token: sessionToken })
  },
  createLifaiSellRequest(payload: {
    session_token: string
    request_id: string
    lifai_plan: string
    ep_amount: number
    ep_rate_jpy: number
    usdt_rate_jpy: number
    gross_usdt: number
    fee_usdt: number
    net_usdt: number
    payout_network: string
    payout_wallet: string
  }) {
    return postToGas<{ request_id: string; platform_wallet: string }>('create_lifai_sell_request', payload)
  },
  updateLifaiDepositStatus(payload: {
    api_key: string
    request_id: string
    status?: string
    received_ep?: number
    shortfall_ep?: number
    deposit_ids?: string[]
    source_login_ids?: string[]
    confirmed_at?: string
  }) {
    return postToGas<{ request_id: string }>('update_lifai_deposit_status', payload)
  },
```

- [ ] **Step 6-2: 型チェック**

Run: `npx tsc --noEmit`
Expected: `app/api/lifai/sell-request/route.ts` で旧payload（source_wallet等）によるエラーが出る。**これは想定どおり**（Task 7で直す）。それ以外のファイルでエラーが出たら直すこと。

- [ ] **Step 6-3: コミットは Task 7 とまとめて行う**（この時点ではビルドが赤のため）

---

### Task 7: sell-request ルートを認証付きに書き換え

**Files:**
- Modify: `app/api/lifai/sell-request/route.ts`（全面書き換え）

- [ ] **Step 7-1: 実装**

```ts
import { NextRequest, NextResponse } from 'next/server'
import { gasClient } from '@/lib/gas-client'
import { LifaiPlan } from '@/types'
import { EP_RATE_JPY, FEE_RATE, LIFAI_PLANS, PAYOUT_NETWORKS } from '@/lib/lifai'

function makeRequestId(): string {
  return 'LIFAI-' + Math.random().toString(36).slice(2, 8).toUpperCase()
}

async function fetchJpyPerUsdt(): Promise<number> {
  const response = await fetch(
    'https://api.coingecko.com/api/v3/simple/price?ids=tether&vs_currencies=jpy',
    { cache: 'no-store' }
  )
  if (!response.ok) throw new Error('CoinGecko fetch failed')
  const data = await response.json() as { tether: { jpy: number } }
  return data.tether.jpy
}

const AUTH_ERROR_CODES = ['MISSING_TOKEN', 'INVALID_TOKEN', 'SESSION_EXPIRED', 'USER_NOT_FOUND']

export async function POST(req: NextRequest) {
  let body: {
    session_token?: string
    lifai_plan?: string
    ep_amount?: number
    payout_network?: string
    payout_wallet?: string
  }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ ok: false, error: 'invalid_json' }, { status: 400 })
  }

  const { lifai_plan, ep_amount, payout_network, payout_wallet } = body
  const sessionToken = String(body.session_token ?? '').trim()

  if (!sessionToken) {
    return NextResponse.json({ ok: false, error: 'MISSING_TOKEN' }, { status: 401 })
  }
  if (!LIFAI_PLANS.includes(lifai_plan as LifaiPlan)) {
    return NextResponse.json({ ok: false, error: 'Invalid lifai_plan' }, { status: 400 })
  }
  if (typeof ep_amount !== 'number' || !Number.isFinite(ep_amount) || !Number.isInteger(ep_amount) || ep_amount < 100) {
    return NextResponse.json({ ok: false, error: 'ep_amount must be an integer of at least 100' }, { status: 400 })
  }
  if (!PAYOUT_NETWORKS.includes(payout_network as (typeof PAYOUT_NETWORKS)[number])) {
    return NextResponse.json({ ok: false, error: 'Invalid payout_network' }, { status: 400 })
  }
  if (!payout_wallet?.trim()) {
    return NextResponse.json({ ok: false, error: 'payout_wallet is required' }, { status: 400 })
  }

  let jpyPerUsdt: number
  try {
    jpyPerUsdt = await fetchJpyPerUsdt()
  } catch {
    return NextResponse.json({ ok: false, error: 'Failed to fetch exchange rate' }, { status: 502 })
  }

  const plan = lifai_plan as LifaiPlan
  const epRateJpy = EP_RATE_JPY[plan]
  const grossJpy = ep_amount * epRateJpy
  const grossUsdt = grossJpy / jpyPerUsdt
  const feeUsdt = grossUsdt * FEE_RATE
  const netUsdt = grossUsdt - feeUsdt

  const requestId = makeRequestId()

  const saveResult = await gasClient.createLifaiSellRequest({
    session_token: sessionToken,
    request_id: requestId,
    lifai_plan: plan,
    ep_amount,
    ep_rate_jpy: epRateJpy,
    usdt_rate_jpy: jpyPerUsdt,
    gross_usdt: Number(grossUsdt.toFixed(4)),
    fee_usdt: Number(feeUsdt.toFixed(4)),
    net_usdt: Number(netUsdt.toFixed(4)),
    payout_network: payout_network as string,
    payout_wallet: payout_wallet.trim(),
  })

  if (!saveResult.ok) {
    if (saveResult.code === 'OPEN_REQUEST_EXISTS') {
      return NextResponse.json(
        { ok: false, error: 'OPEN_REQUEST_EXISTS', open_request_id: (saveResult.data as { request_id?: string } | undefined)?.request_id },
        { status: 409 }
      )
    }
    if (AUTH_ERROR_CODES.includes(saveResult.code)) {
      return NextResponse.json({ ok: false, error: saveResult.code }, { status: 401 })
    }
    return NextResponse.json({ ok: false, error: 'Failed to save request' }, { status: 500 })
  }

  return NextResponse.json({
    ok: true,
    request_id: requestId,
    net_usdt: Number(netUsdt.toFixed(4)),
    gross_usdt: Number(grossUsdt.toFixed(4)),
    fee_usdt: Number(feeUsdt.toFixed(4)),
    ep_rate_jpy: epRateJpy,
    usdt_rate_jpy: jpyPerUsdt,
    platform_wallet: saveResult.data?.platform_wallet ?? '',
  })
}
```

- [ ] **Step 7-2: 型チェック**

Run: `npx tsc --noEmit`
Expected: エラー0件（Task 6で出ていたエラーが解消）。残っていれば直す。

- [ ] **Step 7-3: コミット（Task 6のgas-client.tsと一緒に）**

```bash
git add lib/gas-client.ts app/api/lifai/sell-request/route.ts
git commit -m "feat: 売却申請APIを認証必須化しウォレットをサーバー側で導出"
```

---

### Task 8: deposit-status ルート新設

**Files:**
- Create: `app/api/lifai/deposit-status/route.ts`

- [ ] **Step 8-1: 実装**

```ts
import { NextResponse } from 'next/server'
import { gasClient } from '@/lib/gas-client'
import { checkLfwDeposits, consumeLfwDeposits } from '@/lib/lifaiov-client'
import { evaluateDeposits } from '@/lib/lifai-deposit'

export const runtime = 'nodejs'

const STATUS_CONFIRMED = '入金確認済み'
const STATUS_INSUFFICIENT = '入金不足'

export async function POST(req: Request) {
  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ ok: false, error: 'invalid_json' }, { status: 400 })
  }

  const sessionToken = String(body?.session_token ?? '').trim()
  const requestId = String(body?.request_id ?? '').trim()
  if (!sessionToken || !requestId) {
    return NextResponse.json({ ok: false, error: 'missing_fields' }, { status: 400 })
  }

  // 本人確認: 自分の申請一覧に request_id があることを検証（他人の申請は照会不可）
  const list = await gasClient.getLifaiSellRequests(sessionToken)
  if (!list.ok || !list.data) {
    return NextResponse.json({ ok: false, error: list.code || 'unauthorized' }, { status: 401 })
  }
  const request = list.data.requests.find((r) => r.request_id === requestId)
  if (!request) {
    return NextResponse.json({ ok: false, error: 'request_not_found' }, { status: 404 })
  }

  const requiredEp = Number(request.ep_amount) || 0

  // 確認済みならLIFAIOVを呼ばず即返す
  if (request.status === STATUS_CONFIRMED) {
    const received = Number(request.received_ep) || requiredEp
    return NextResponse.json({
      ok: true, state: 'confirmed',
      required_ep: requiredEp, received_ep: received,
      shortfall_ep: 0, overpaid_ep: Math.max(0, received - requiredEp),
    })
  }

  const check = await checkLfwDeposits(request.platform_wallet)
  if (!check || !check.ok || !Array.isArray(check.deposits)) {
    return NextResponse.json({ ok: false, error: 'lifaiov_unreachable' }, { status: 502 })
  }

  const result = evaluateDeposits(check.deposits, requestId, requiredEp)
  const apiKey = process.env.LOOTIFY_GAS_KEY ?? ''

  if (result.state === 'confirmed') {
    // 1) 充当する入金をLIFAIOV側で消費済みにする（先に実行。失敗したら書き戻さない）
    if (result.pendingDepositIds.length > 0) {
      const consumed = await consumeLfwDeposits(request.platform_wallet, result.pendingDepositIds, requestId)
      if (!consumed || !consumed.ok) {
        return NextResponse.json({ ok: false, error: 'consume_failed' }, { status: 502 })
      }
    }
    // 2) シートへ書き戻し（失敗しても入金はこの申請IDで消費済みのため、再チェックで復旧する）
    const update = await gasClient.updateLifaiDepositStatus({
      api_key: apiKey,
      request_id: requestId,
      status: STATUS_CONFIRMED,
      received_ep: result.receivedEp,
      shortfall_ep: 0,
      deposit_ids: result.usableDepositIds,
      source_login_ids: result.sourceLoginIds,
      confirmed_at: new Date().toISOString(),
    })
    if (!update.ok) {
      return NextResponse.json({ ok: false, error: 'sheet_update_failed' }, { status: 502 })
    }
  } else if (result.state === 'insufficient') {
    await gasClient.updateLifaiDepositStatus({
      api_key: apiKey,
      request_id: requestId,
      status: STATUS_INSUFFICIENT,
      received_ep: result.receivedEp,
      shortfall_ep: result.shortfallEp,
      deposit_ids: result.usableDepositIds,
      source_login_ids: result.sourceLoginIds,
    })
  } else {
    // waiting: 最終チェック日時のみ更新（statusは変えない）
    await gasClient.updateLifaiDepositStatus({ api_key: apiKey, request_id: requestId })
  }

  return NextResponse.json({
    ok: true,
    state: result.state,
    required_ep: requiredEp,
    received_ep: result.receivedEp,
    shortfall_ep: result.shortfallEp,
    overpaid_ep: result.overpaidEp,
  })
}
```

- [ ] **Step 8-2: 型チェック**

Run: `npx tsc --noEmit`
Expected: エラー0件

- [ ] **Step 8-3: コミット**

```bash
git add app/api/lifai/deposit-status/route.ts
git commit -m "feat: 入金状態確認API(deposit-status)を新設"
```

---

### Task 9: 無認証の lfw-check ルートを削除

**Files:**
- Delete: `app/api/ep/lfw-check/route.ts`

- [ ] **Step 9-1: 参照が無いことを確認**

Run: Grepで `lfw-check` をリポジトリ全体検索（`*.log` と本計画/スペックは除外）
Expected: `LifaiSellRequestForm.tsx` と `LifaiSellHistory.tsx` のみヒット（Task 11/12 で置き換える）。コンポーネント置き換え前に削除するとフォームのポーリングが404になるため、**このタスクはファイル削除のみ行い、コミットはTask 12の後にまとめて行ってもよい**。順序を守るならTask 11/12の後に実施すること（推奨: Task 11/12 → Task 9 の順で実行）。

- [ ] **Step 9-2: 削除とコミット（Task 11/12 完了後に実行）**

```bash
git rm app/api/ep/lfw-check/route.ts
git commit -m "feat: 無認証の入金照会ルート(lfw-check)を削除しdeposit-statusへ統合"
```

---

### Task 10: i18n — 翻訳キー追加（3言語）

**Files:**
- Modify: `messages/ja.json` / `messages/en.json` / `messages/zh.json`（各 `lifai` セクション末尾、`"checkDeposit"` の後）

- [ ] **Step 10-1: 既存WIP（アカウント設定の文言修正 2行×3ファイル）を先に単独コミット**

messages/*.json には本タスク以前からユーザーのWIP差分がある（account.settings の subtitle/saved）。混ざらないよう先にコミットする:

```bash
git add messages/ja.json messages/en.json messages/zh.json
git commit -m "copy: アカウント設定の文言を更新"
```

- [ ] **Step 10-2: ja.json の lifai セクションに追加**（`"checkDeposit": "入金確認"` の後にカンマ区切りで）

```json
    "openRequestExists": "未完了の売却申請があります。プロフィールの申請履歴から入金を完了してください。",
    "depositInsufficient": "⚠ 入金不足: 受領 {received} EP / 不足 {shortfall} EP。不足分 {shortfall} EP を同じアドレスへ再送金してください。",
    "depositOverpaid": "申請数量を {overpaid} EP 超える入金がありましたが、そのまま受領しました。",
    "recheckDeposit": "再確認する",
    "statusWaiting": "入金待ち",
    "statusInsufficient": "入金不足",
    "statusConfirmed": "入金確認済み"
```

- [ ] **Step 10-3: en.json に追加**

```json
    "openRequestExists": "You already have an unfinished sell request. Please complete its deposit first — see the request history in your profile.",
    "depositInsufficient": "⚠ Insufficient deposit: received {received} EP / {shortfall} EP short. Please send the remaining {shortfall} EP to the same address.",
    "depositOverpaid": "We received {overpaid} EP more than requested. The excess has been accepted as part of this request.",
    "recheckDeposit": "Check again",
    "statusWaiting": "Awaiting deposit",
    "statusInsufficient": "Insufficient deposit",
    "statusConfirmed": "Deposit confirmed"
```

- [ ] **Step 10-4: zh.json に追加**

```json
    "openRequestExists": "您有未完成的出售申请。请先完成该申请的入金（可在个人资料的申请记录中查看）。",
    "depositInsufficient": "⚠ 入金不足：已收到 {received} EP / 还差 {shortfall} EP。请将差额 {shortfall} EP 再次发送到同一地址。",
    "depositOverpaid": "收到的 EP 超出申请数量 {overpaid} EP，超出部分已一并计入本次申请。",
    "recheckDeposit": "重新确认",
    "statusWaiting": "等待入金",
    "statusInsufficient": "入金不足",
    "statusConfirmed": "入金已确认"
```

- [ ] **Step 10-5: JSON構文チェックとコミット**

Run: `node -e "['ja','en','zh'].forEach(l => JSON.parse(require('fs').readFileSync('messages/'+l+'.json','utf8')))"`
Expected: エラーなし

```bash
git add messages/ja.json messages/en.json messages/zh.json
git commit -m "feat: 入金不足・過剰・申請重複の翻訳キーを追加"
```

---

### Task 11: LifaiSellRequestForm — 申請の認証化とポーリング刷新

**Files:**
- Modify: `components/LifaiSellRequestForm.tsx`

- [ ] **Step 11-1: import と state を変更**

`import { useAuth } from '@/contexts/AuthContext'` の下に追加:

```ts
import { authStorage } from '@/lib/auth-storage'
```

`type DepositStatus = 'waiting' | 'confirmed' | 'timeout'` を削除し、以下に置き換え:

```ts
type DepositInfo = {
  state: 'waiting' | 'insufficient' | 'confirmed' | 'timeout'
  receivedEp: number
  shortfallEp: number
  overpaidEp: number
}

const INITIAL_DEPOSIT: DepositInfo = { state: 'waiting', receivedEp: 0, shortfallEp: 0, overpaidEp: 0 }
```

`const [depositStatus, setDepositStatus] = useState<DepositStatus>('waiting')` を:

```ts
  const [depositInfo, setDepositInfo] = useState<DepositInfo>(INITIAL_DEPOSIT)
```

- [ ] **Step 11-2: アンマウント時のintervalクリーンアップを追加**（既存のレート取得useEffectの直後）

```ts
  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
    }
  }, [])
```

- [ ] **Step 11-3: startPolling を deposit-status ベースに全面書き換え**（62-85行の関数を置き換え）

```ts
  const POLL_INTERVAL_MS = 30_000
  const MAX_ATTEMPTS = 20 // 30秒 × 20回 = 10分

  async function checkDepositOnce(requestId: string): Promise<boolean> {
    const token = authStorage.getToken()
    if (!token) return false
    try {
      const res = await fetch('/api/lifai/deposit-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_token: token, request_id: requestId }),
      })
      const data = await res.json()
      if (data.ok) {
        setDepositInfo({
          state: data.state,
          receivedEp: data.received_ep ?? 0,
          shortfallEp: data.shortfall_ep ?? 0,
          overpaidEp: data.overpaid_ep ?? 0,
        })
        return data.state === 'confirmed'
      }
    } catch {}
    return false
  }

  function startPolling(requestId: string) {
    if (pollRef.current) clearInterval(pollRef.current)
    setDepositInfo(INITIAL_DEPOSIT)
    let attempts = 0
    void checkDepositOnce(requestId)
    pollRef.current = setInterval(async () => {
      attempts++
      const confirmed = await checkDepositOnce(requestId)
      if (confirmed) {
        if (pollRef.current) clearInterval(pollRef.current)
        return
      }
      if (attempts >= MAX_ATTEMPTS) {
        setDepositInfo((prev) => (prev.state === 'confirmed' ? prev : { ...prev, state: 'timeout' }))
        if (pollRef.current) clearInterval(pollRef.current)
      }
    }, POLL_INTERVAL_MS)
  }
```

- [ ] **Step 11-4: handleSubmit の送信処理を変更**（109-137行）

```ts
    const token = authStorage.getToken()
    if (!token) {
      setError(t('submitError'))
      return
    }

    setSubmitting(true)
    try {
      const response = await fetch('/api/lifai/sell-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_token: token,
          lifai_plan: selectedPlan,
          ep_amount: epValue,
          payout_network: payoutNetwork,
          payout_wallet: payoutWallet.trim(),
        }),
      })
      const data = await response.json()
      if (data.ok) {
        setSubmitted({ request_id: data.request_id, net_usdt: data.net_usdt })
        startPolling(data.request_id)
      } else if (data.error === 'OPEN_REQUEST_EXISTS') {
        setError(t('openRequestExists'))
      } else {
        setError(t('submitError'))
      }
    } catch {
      setError(t('submitError'))
    } finally {
      setSubmitting(false)
    }
```

注: 旧コードの `setDepositStatus('waiting')` と `if (user?.wallet_address) startPolling(...)` は削除（request_id ベースに変更）。`source_wallet` と `platform_wallet` はもう送らない。

- [ ] **Step 11-5: 申請後画面の状態表示を置き換え**（158-166行の3ブロック）

```tsx
          {depositInfo.state === 'waiting' && (
            <p className="text-sm text-amber-700">{t('depositWaiting')}</p>
          )}
          {depositInfo.state === 'insufficient' && (
            <p className="text-sm font-semibold text-red-600">
              {t('depositInsufficient', { received: String(depositInfo.receivedEp), shortfall: String(depositInfo.shortfallEp) })}
            </p>
          )}
          {depositInfo.state === 'confirmed' && (
            <div className="space-y-1">
              <p className="text-sm font-semibold text-emerald-700">{t('depositConfirmed')}</p>
              {depositInfo.overpaidEp > 0 && (
                <p className="text-xs text-gray-500">{t('depositOverpaid', { overpaid: String(depositInfo.overpaidEp) })}</p>
              )}
            </div>
          )}
          {depositInfo.state === 'timeout' && (
            <div className="space-y-2">
              <p className="text-sm text-gray-500">{t('depositTimeout')}</p>
              <button
                type="button"
                onClick={() => submitted && startPolling(submitted.request_id)}
                className="rounded border border-sky-200 bg-sky-50 px-3 py-1.5 text-xs font-medium text-sky-700 hover:bg-sky-100"
              >
                {t('recheckDeposit')}
              </button>
            </div>
          )}
```

- [ ] **Step 11-6: 型チェック**

Run: `npx tsc --noEmit`
Expected: エラー0件

- [ ] **Step 11-7: コミット**

```bash
git add components/LifaiSellRequestForm.tsx
git commit -m "feat: 売却フォームを認証付き申請+不足/過剰表示ポーリングに刷新"
```

---

### Task 12: LifaiSellHistory — 不足表示とステータスバッジ

**Files:**
- Modify: `components/LifaiSellHistory.tsx`

- [ ] **Step 12-1: 型とチェック処理を置き換え**

`SellRequest` 型に追加: `received_ep: number` `shortfall_ep: number`（GASレスポンスに含まれる）

`type DepositResult ...` と `checkDeposit` 関数（18行・45-59行）を以下に置き換え:

```ts
type DepositCheck = {
  state: 'checking' | 'waiting' | 'insufficient' | 'confirmed'
  receivedEp?: number
  shortfallEp?: number
}
```

```ts
  async function checkDeposit(req: SellRequest) {
    const token = authStorage.getToken()
    if (!token) return
    setDepositMap(prev => ({ ...prev, [req.request_id]: { state: 'checking' } }))
    try {
      const res = await fetch('/api/lifai/deposit-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_token: token, request_id: req.request_id }),
      })
      const data = await res.json()
      if (data.ok) {
        const state =
          data.state === 'confirmed' ? 'confirmed' :
          data.state === 'insufficient' ? 'insufficient' : 'waiting'
        setDepositMap(prev => ({
          ...prev,
          [req.request_id]: { state, receivedEp: data.received_ep, shortfallEp: data.shortfall_ep },
        }))
        if (state === 'confirmed') {
          setRequests(prev => prev.map(r => (r.request_id === req.request_id ? { ...r, status: '入金確認済み' } : r)))
        }
        return
      }
    } catch {}
    setDepositMap(prev => ({ ...prev, [req.request_id]: { state: 'waiting' } }))
  }
```

`depositMap` のstate型も更新: `useState<Record<string, DepositCheck>>({})`

- [ ] **Step 12-2: ステータス表示ヘルパーを追加**（コンポーネント関数内、return文の前）

```ts
  function statusBadgeClass(status: string) {
    if (status === '入金確認済み') return 'bg-emerald-100 text-emerald-700'
    if (status === '入金不足') return 'bg-red-100 text-red-700'
    return 'bg-amber-100 text-amber-700'
  }

  function statusLabel(status: string) {
    if (status === '入金確認済み') return t('statusConfirmed')
    if (status === '入金不足') return t('statusInsufficient')
    if (status === '入金待ち' || status === 'pending') return t('statusWaiting')
    return status
  }
```

- [ ] **Step 12-3: バッジとボタン・状態表示のJSXを置き換え**（83-101行の右カラム）

```tsx
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${statusBadgeClass(req.status)}`}>
                    {statusLabel(req.status)}
                  </span>
                  {req.status !== '入金確認済み' && depositStatus?.state !== 'checking' && depositStatus?.state !== 'confirmed' && (
                    <button
                      onClick={() => checkDeposit(req)}
                      className="rounded border border-sky-200 bg-sky-50 px-2 py-1 text-xs text-sky-700 hover:bg-sky-100"
                    >
                      {depositStatus ? t('recheckDeposit') : t('checkDeposit')}
                    </button>
                  )}
                  {depositStatus?.state === 'checking' && (
                    <p className="text-xs text-amber-600">{t('depositWaiting')}</p>
                  )}
                  {depositStatus?.state === 'insufficient' && (
                    <p className="max-w-[220px] text-right text-xs font-semibold text-red-600">
                      {t('depositInsufficient', {
                        received: String(depositStatus.receivedEp ?? 0),
                        shortfall: String(depositStatus.shortfallEp ?? 0),
                      })}
                    </p>
                  )}
                  {depositStatus?.state === 'confirmed' && (
                    <p className="text-xs font-semibold text-emerald-600">{t('depositConfirmed')}</p>
                  )}
                </div>
```

注: `const depositStatus = depositMap[req.request_id]` は既存のmap内変数（型が `DepositCheck | undefined` になる）。

- [ ] **Step 12-4: 型チェックとコミット**

Run: `npx tsc --noEmit`
Expected: エラー0件

```bash
git add components/LifaiSellHistory.tsx
git commit -m "feat: 申請履歴に不足表示とステータスバッジ色分けを追加"
```

この後、**Task 9 の削除とコミットを実行**する。

---

### Task 13: 環境変数ドキュメントと総合検証

**Files:**
- Modify: `.env.local.example`

- [ ] **Step 13-1: .env.local.example を更新**

```
NEXT_PUBLIC_GAS_URL=https://script.google.com/macros/s/your-web-app-id/exec

# LIFAIOV側GAS（入金確認・消費）— サーバー専用
LIFAIOV_GAS_URL=https://script.google.com/macros/s/your-lifaiov-web-app-id/exec
LIFAIOV_GAS_KEY=your-lifaiov-secret

# Lootify GASのシート書き戻し用キー（GASのScript Properties LOOTIFY_API_KEY と同値にする）
LOOTIFY_GAS_KEY=your-lootify-update-api-key
```

- [ ] **Step 13-2: 総合検証**

Run: `npx jest` → Expected: 全テストパス
Run: `npx tsc --noEmit` → Expected: エラー0件
Run: `npx next build` → Expected: ビルド成功。ルート一覧に `/api/lifai/deposit-status` があり `/api/ep/lfw-check` が無いこと

- [ ] **Step 13-3: APIエラーパスの手動確認**（dev起動して curl）

```bash
npx next dev -p 3100  # バックグラウンド起動
# 不正JSON → 400
curl -s -X POST http://localhost:3100/api/lifai/deposit-status -H "Content-Type: application/json" -d "{bad"
# トークンなし → 400 missing_fields
curl -s -X POST http://localhost:3100/api/lifai/deposit-status -H "Content-Type: application/json" -d "{}"
# 申請APIトークンなし → 401 MISSING_TOKEN
curl -s -X POST http://localhost:3100/api/lifai/sell-request -H "Content-Type: application/json" -d "{\"lifai_plan\":\"starter\",\"ep_amount\":1000,\"payout_network\":\"TRC20\",\"payout_wallet\":\"x\"}"
# 旧ルートが消えていること → 404
curl -s -o NUL -w "%{http_code}" -X POST http://localhost:3100/api/ep/lfw-check
```
確認後にdevサーバーを停止。

- [ ] **Step 13-4: コミット**

```bash
git add .env.local.example
git commit -m "docs: LIFAIOV/LOOTIFY GAS用の環境変数をexampleに追記"
```

- [ ] **Step 13-5: ユーザー向けデプロイ手順を最終報告に含める**

実装完了報告に以下を必ず記載:
1. `.env.local` に `LIFAIOV_GAS_URL` / `LIFAIOV_GAS_KEY`（Vercelからコピー）と `LOOTIFY_GAS_KEY`（新規生成した強いランダム文字列）を追加
2. Vercel に `LOOTIFY_GAS_KEY` を追加
3. Lootify GAS: エディタで `gas/Code.gs` の内容に置き換え → Script Properties に `LOOTIFY_API_KEY`（= `LOOTIFY_GAS_KEY` と同値）を追加 → 再デプロイ
4. LIFAIOV GAS: `C:\Users\unitu\lifaiov\gas\Code.gs` の内容に置き換え → 再デプロイ
5. エンドツーエンド確認: 申請 → LIFAIOVからEP送付（少なめ）→ 不足表示 → 残りを送付 → 確認済み → スプレッドシートの status / 受領EP合計 / 充当入金ID を確認

---

## セルフレビュー結果

- スペック網羅: ステータスモデル(T4)、不足/過剰(T2,T8,T10-12)、消費マーク(T1,T8)、1件制限(T4)、認証+ウォレットのサーバー導出(T4,T7)、lfw-check廃止(T9)、英語メール(T5)、シート新列(T4)、環境変数(T13) — 全項目にタスクあり
- 型整合: `evaluateDeposits` の戻り値フィールド（usableDepositIds等）はT2定義とT8使用で一致。GASレスポンスの received_ep/shortfall_ep はT4(GAS)→T6(型)→T12(使用)で一致
- 実行順の注意: **Task 9（lfw-check削除）はTask 11/12の後に実行**（ポーリング404を防ぐ）
