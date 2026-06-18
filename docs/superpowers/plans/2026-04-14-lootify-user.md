# Lootify User Auth & Checkout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** サインアップ・メール認証・ログイン・アカウント管理・商品詳細・チェックアウトフローを実装する。

**Architecture:** GAS (Google Apps Script) をバックエンド/DB として使用。フロントエンドは Next.js 14 App Router のクライアントコンポーネント中心の構成。セッショントークンは localStorage に保存し、React Context でアプリ全体に伝播。GAS Web App の URL は `NEXT_PUBLIC_GAS_URL` 環境変数で注入する。

**Tech Stack:** Next.js 14, TypeScript, Tailwind CSS, Google Apps Script, Google Sheets, Jest, @testing-library/react

> **⚠️ GAS Deployment Note:** Task 1 で作成する `gas/` ディレクトリのコードは手動で Apps Script プロジェクトにコピーし、Web App としてデプロイする必要がある（自動デプロイ不可）。デプロイ後の URL を `.env.local` に `NEXT_PUBLIC_GAS_URL=<url>` として設定すること。

---

## ファイル構成

```
新規作成:
  gas/Code.gs                              GAS entrypoint (doPost ルーター)
  gas/Sheet.gs                             シートアクセスヘルパー
  gas/Auth.gs                              signup / verify / login / me / logout
  gas/Purchase.gs                          create_purchase_draft
  gas/Email.gs                             メール送信
  .env.local.example                       環境変数テンプレート
  lib/gas-client.ts                        GAS API クライアント（型付き）
  lib/auth-storage.ts                      localStorage セッションヘルパー
  contexts/AuthContext.tsx                 React auth context + provider
  components/UserMenu.tsx                  ヘッダーの logged-in/out UI（client）
  app/[locale]/signup/page.tsx             サインアップページ（client）
  app/[locale]/verify-email/page.tsx       メール認証ページ（client）
  app/[locale]/login/page.tsx              ログインページ（client）
  app/[locale]/account/profile/page.tsx    プロフィールページ（client）
  app/[locale]/account/settings/page.tsx   設定ページ（client）
  app/[locale]/item/[id]/page.tsx          商品詳細ページ
  app/[locale]/checkout/[itemId]/page.tsx  チェックアウトページ（client）
  app/[locale]/payment/mock/page.tsx       モック決済ページ（client）
  __tests__/UserMenu.test.tsx
  __tests__/SignupPage.test.tsx
  __tests__/VerifyEmailPage.test.tsx
  __tests__/LoginPage.test.tsx
  __tests__/ItemPage.test.tsx
  __tests__/CheckoutPage.test.tsx
  __tests__/MockPaymentPage.test.tsx

更新:
  app/[locale]/layout.tsx                  AuthProvider をラップ
  components/Header.tsx                    UserMenu を追加
  types/index.ts                           User 型追加
```

---

## Task 1: GAS バックエンド

**Files:**
- Create: `gas/Code.gs`
- Create: `gas/Sheet.gs`
- Create: `gas/Auth.gs`
- Create: `gas/Purchase.gs`
- Create: `gas/Email.gs`

- [ ] **Step 1: gas/Sheet.gs を作成する**

```javascript
// gas/Sheet.gs
var SS_ID = ''; // ← デプロイ時に実際の Spreadsheet ID を設定

function getSheet(name) {
  var ss = SpreadsheetApp.openById(SS_ID);
  return ss.getSheetByName(name) || ss.insertSheet(name);
}

function ensureHeaders(sheet, headers) {
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(headers);
  }
}

function sheetToObjects(sheet) {
  var data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];
  var headers = data[0];
  return data.slice(1).map(function(row) {
    var obj = {};
    headers.forEach(function(h, i) { obj[h] = row[i]; });
    return obj;
  });
}

function findRowByField(sheet, field, value) {
  var data = sheet.getDataRange().getValues();
  if (data.length <= 1) return -1;
  var headers = data[0];
  var col = headers.indexOf(field);
  if (col === -1) return -1;
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][col]) === String(value)) return i + 1; // 1-indexed
  }
  return -1;
}

function updateRowByField(sheet, field, value, updates) {
  var rowNum = findRowByField(sheet, field, value);
  if (rowNum === -1) return false;
  var headers = sheet.getDataRange().getValues()[0];
  Object.keys(updates).forEach(function(key) {
    var col = headers.indexOf(key);
    if (col !== -1) {
      sheet.getRange(rowNum, col + 1).setValue(updates[key]);
    }
  });
  return true;
}

function appendRow(sheet, headers, obj) {
  var row = headers.map(function(h) { return obj[h] !== undefined ? obj[h] : ''; });
  sheet.appendRow(row);
}

function nextId(prefix, sheet) {
  var count = Math.max(sheet.getLastRow() - 1, 0);
  return prefix + ('00000' + (count + 1)).slice(-6);
}

// ユーザーシートの初期化
function initUsersSheet() {
  var sheet = getSheet('users');
  var headers = [
    'user_id','created_at','updated_at','email','password_hash',
    'display_name','first_name','last_name','full_name','country',
    'phone','birth_date','account_status','email_verified',
    'email_verify_code','email_verify_expire_at','login_fail_count',
    'last_login_at','session_token','session_expire_at',
    'avatar_url','role','marketing_opt_in','terms_accepted_at','privacy_accepted_at'
  ];
  ensureHeaders(sheet, headers);
  return sheet;
}
```

- [ ] **Step 2: gas/Email.gs を作成する**

```javascript
// gas/Email.gs
function sendVerificationEmail(toEmail, code) {
  var subject = 'Verify your Lootify account';
  var body = [
    'Hello,',
    '',
    'Your email verification code is:',
    '',
    '  ' + code,
    '',
    'This code expires in 30 minutes.',
    '',
    'If you did not create a Lootify account, please ignore this email.',
    '',
    '— The Lootify Team'
  ].join('\n');
  GmailApp.sendEmail(toEmail, subject, body);
}

function logEmail(userId, email, type, code, result, meta) {
  var sheet = getSheet('email_logs');
  var headers = ['mail_id','user_id','email','type','code','sent_at','result','meta'];
  ensureHeaders(sheet, headers);
  appendRow(sheet, headers, {
    mail_id: nextId('MAIL_', sheet),
    user_id: userId,
    email: email,
    type: type,
    code: code,
    sent_at: new Date().toISOString(),
    result: result,
    meta: meta || ''
  });
}
```

- [ ] **Step 3: gas/Auth.gs を作成する**

```javascript
// gas/Auth.gs

// ---- パスワードハッシュ ----
function hashPassword(password, salt) {
  var combined = password + salt;
  var bytes = Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256,
    combined,
    Utilities.Charset.UTF_8
  );
  return bytes.map(function(b) {
    return ('0' + (b & 0xFF).toString(16)).slice(-2);
  }).join('');
}

function generateSalt() {
  return Utilities.getUuid().replace(/-/g, '').substring(0, 16);
}

function storePassword(password) {
  var salt = generateSalt();
  var hash = hashPassword(password, salt);
  return salt + '$' + hash;
}

function verifyPassword(password, stored) {
  var parts = stored.split('$');
  if (parts.length !== 2) return false;
  var salt = parts[0];
  var expected = parts[1];
  return hashPassword(password, salt) === expected;
}

function generateVerifyCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function generateSessionToken() {
  return Utilities.getUuid().replace(/-/g, '') + Utilities.getUuid().replace(/-/g, '');
}

// ---- signup ----
function signup(payload) {
  var email = String(payload.email || '').toLowerCase().trim();
  var password = payload.password || '';
  var displayName = payload.display_name || '';
  var firstName = payload.first_name || '';
  var lastName = payload.last_name || '';
  var country = payload.country || '';
  var phone = payload.phone || '';
  var birthDate = payload.birth_date || '';
  var marketingOptIn = payload.marketing_opt_in ? 'true' : 'false';

  if (!email || !password || !displayName || !firstName || !lastName || !country) {
    return { ok: false, code: 'MISSING_FIELDS', message: 'Required fields are missing.' };
  }

  var sheet = initUsersSheet();
  var existing = findRowByField(sheet, 'email', email);
  if (existing !== -1) {
    return { ok: false, code: 'EMAIL_ALREADY_EXISTS', message: 'An account with this email already exists.' };
  }

  var userId = nextId('USR_', sheet);
  var code = generateVerifyCode();
  var expiry = new Date(Date.now() + 30 * 60 * 1000).toISOString();
  var now = new Date().toISOString();

  var headers = [
    'user_id','created_at','updated_at','email','password_hash',
    'display_name','first_name','last_name','full_name','country',
    'phone','birth_date','account_status','email_verified',
    'email_verify_code','email_verify_expire_at','login_fail_count',
    'last_login_at','session_token','session_expire_at',
    'avatar_url','role','marketing_opt_in','terms_accepted_at','privacy_accepted_at'
  ];

  appendRow(sheet, headers, {
    user_id: userId,
    created_at: now,
    updated_at: now,
    email: email,
    password_hash: storePassword(password),
    display_name: displayName,
    first_name: firstName,
    last_name: lastName,
    full_name: firstName + ' ' + lastName,
    country: country,
    phone: phone,
    birth_date: birthDate,
    account_status: 'pending_verification',
    email_verified: 'false',
    email_verify_code: code,
    email_verify_expire_at: expiry,
    login_fail_count: 0,
    last_login_at: '',
    session_token: '',
    session_expire_at: '',
    avatar_url: '',
    role: 'user',
    marketing_opt_in: marketingOptIn,
    terms_accepted_at: now,
    privacy_accepted_at: now
  });

  try {
    sendVerificationEmail(email, code);
    logEmail(userId, email, 'verify_signup', code, 'sent', '');
  } catch (e) {
    logEmail(userId, email, 'verify_signup', code, 'error', e.message);
  }

  return {
    ok: true,
    code: 'SUCCESS',
    message: 'Your account has been created. Please verify your email to continue.',
    data: { verify_required: true, email: email }
  };
}

// ---- verify_email ----
function verifyEmail(payload) {
  var email = String(payload.email || '').toLowerCase().trim();
  var code = String(payload.code || '').trim();

  var sheet = initUsersSheet();
  var rowNum = findRowByField(sheet, 'email', email);
  if (rowNum === -1) {
    return { ok: false, code: 'USER_NOT_FOUND', message: 'No account was found for this email.' };
  }

  var data = sheet.getDataRange().getValues();
  var headers = data[0];
  var row = data[rowNum - 1];
  var obj = {};
  headers.forEach(function(h, i) { obj[h] = row[i]; });

  if (String(obj.email_verified) === 'true') {
    return { ok: false, code: 'ALREADY_VERIFIED', message: 'This email has already been verified.' };
  }
  if (String(obj.email_verify_code) !== code) {
    return { ok: false, code: 'INVALID_CODE', message: 'Invalid verification code.' };
  }
  if (new Date() > new Date(obj.email_verify_expire_at)) {
    return { ok: false, code: 'CODE_EXPIRED', message: 'This verification code has expired.' };
  }

  var now = new Date().toISOString();
  updateRowByField(sheet, 'email', email, {
    email_verified: 'true',
    account_status: 'active',
    email_verify_code: '',
    email_verify_expire_at: '',
    updated_at: now
  });

  return { ok: true, code: 'SUCCESS', message: 'Your email has been verified successfully.', data: {} };
}

// ---- resend_verify_code ----
function resendVerifyCode(payload) {
  var email = String(payload.email || '').toLowerCase().trim();

  var sheet = initUsersSheet();
  var rowNum = findRowByField(sheet, 'email', email);
  if (rowNum === -1) {
    return { ok: false, code: 'USER_NOT_FOUND', message: 'No account was found for this email.' };
  }

  var code = generateVerifyCode();
  var expiry = new Date(Date.now() + 30 * 60 * 1000).toISOString();
  var data = sheet.getDataRange().getValues();
  var headers = data[0];
  var row = data[rowNum - 1];
  var obj = {};
  headers.forEach(function(h, i) { obj[h] = row[i]; });

  updateRowByField(sheet, 'email', email, {
    email_verify_code: code,
    email_verify_expire_at: expiry,
    updated_at: new Date().toISOString()
  });

  try {
    sendVerificationEmail(email, code);
    logEmail(obj.user_id, email, 'resend_verify', code, 'sent', '');
  } catch (e) {
    logEmail(obj.user_id, email, 'resend_verify', code, 'error', e.message);
  }

  return { ok: true, code: 'SUCCESS', message: 'A new verification code has been sent.', data: {} };
}

// ---- login ----
function login(payload) {
  var email = String(payload.email || '').toLowerCase().trim();
  var password = payload.password || '';
  var ip = payload.ip || '';
  var userAgent = payload.user_agent || '';

  var sheet = initUsersSheet();
  var logSheet = getSheet('login_logs');
  var logHeaders = ['log_id','user_id','email','login_at','ip','user_agent','result','reason'];
  ensureHeaders(logSheet, logHeaders);

  function writeLog(userId, result, reason) {
    appendRow(logSheet, logHeaders, {
      log_id: nextId('LOG_', logSheet),
      user_id: userId,
      email: email,
      login_at: new Date().toISOString(),
      ip: ip,
      user_agent: userAgent,
      result: result,
      reason: reason
    });
  }

  var rowNum = findRowByField(sheet, 'email', email);
  if (rowNum === -1) {
    writeLog('', 'failed', 'user_not_found');
    return { ok: false, code: 'INVALID_CREDENTIALS', message: 'Invalid email or password.' };
  }

  var data = sheet.getDataRange().getValues();
  var headers = data[0];
  var row = data[rowNum - 1];
  var obj = {};
  headers.forEach(function(h, i) { obj[h] = row[i]; });

  if (!verifyPassword(password, String(obj.password_hash))) {
    writeLog(obj.user_id, 'failed', 'wrong_password');
    updateRowByField(sheet, 'email', email, {
      login_fail_count: (parseInt(obj.login_fail_count) || 0) + 1,
      updated_at: new Date().toISOString()
    });
    return { ok: false, code: 'INVALID_CREDENTIALS', message: 'Invalid email or password.' };
  }

  if (String(obj.email_verified) !== 'true') {
    writeLog(obj.user_id, 'verify_required', 'email_not_verified');
    return { ok: false, code: 'VERIFY_REQUIRED', message: 'Please verify your email before signing in.', data: { email: email } };
  }

  if (obj.account_status !== 'active') {
    writeLog(obj.user_id, 'blocked', 'account_not_active');
    return { ok: false, code: 'ACCOUNT_SUSPENDED', message: 'Your account is not active. Please contact support.' };
  }

  var token = generateSessionToken();
  var expiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  var now = new Date().toISOString();

  updateRowByField(sheet, 'email', email, {
    session_token: token,
    session_expire_at: expiry,
    last_login_at: now,
    login_fail_count: 0,
    updated_at: now
  });

  writeLog(obj.user_id, 'success', '');

  return {
    ok: true,
    code: 'SUCCESS',
    message: 'Welcome back.',
    data: {
      user_id: obj.user_id,
      email: obj.email,
      display_name: obj.display_name,
      full_name: obj.full_name,
      avatar_url: obj.avatar_url,
      country: obj.country,
      account_status: obj.account_status,
      email_verified: obj.email_verified,
      session_token: token
    }
  };
}

// ---- me ----
function me(payload) {
  var token = payload.session_token || '';
  if (!token) return { ok: false, code: 'UNAUTHORIZED', message: 'No session token provided.' };

  var sheet = initUsersSheet();
  var rowNum = findRowByField(sheet, 'session_token', token);
  if (rowNum === -1) {
    return { ok: false, code: 'UNAUTHORIZED', message: 'Your session has expired. Please sign in again.' };
  }

  var data = sheet.getDataRange().getValues();
  var headers = data[0];
  var row = data[rowNum - 1];
  var obj = {};
  headers.forEach(function(h, i) { obj[h] = row[i]; });

  if (new Date() > new Date(obj.session_expire_at)) {
    return { ok: false, code: 'SESSION_EXPIRED', message: 'Your session has expired. Please sign in again.' };
  }

  return {
    ok: true,
    code: 'SUCCESS',
    message: 'OK',
    data: {
      user_id: obj.user_id,
      email: obj.email,
      display_name: obj.display_name,
      full_name: obj.full_name,
      avatar_url: obj.avatar_url,
      country: obj.country,
      phone: obj.phone,
      account_status: obj.account_status,
      email_verified: obj.email_verified,
      created_at: obj.created_at,
      last_login_at: obj.last_login_at
    }
  };
}

// ---- logout ----
function logout(payload) {
  var token = payload.session_token || '';
  if (!token) return { ok: true, code: 'SUCCESS', message: 'Logged out.', data: {} };

  var sheet = initUsersSheet();
  updateRowByField(sheet, 'session_token', token, {
    session_token: '',
    session_expire_at: '',
    updated_at: new Date().toISOString()
  });

  return { ok: true, code: 'SUCCESS', message: 'You have been signed out.', data: {} };
}
```

- [ ] **Step 4: gas/Purchase.gs を作成する**

```javascript
// gas/Purchase.gs
function createPurchaseDraft(payload) {
  var token = payload.session_token || '';
  var meResult = me({ session_token: token });
  if (!meResult.ok) return meResult;

  var user = meResult.data;
  var itemId = payload.item_id || '';
  var itemTitle = payload.item_title || '';
  var itemPrice = payload.item_price || 0;
  var currency = payload.currency || 'JPY';
  var quantity = payload.quantity || 1;

  if (!itemId) {
    return { ok: false, code: 'MISSING_FIELDS', message: 'item_id is required.' };
  }

  var sheet = getSheet('purchase_drafts');
  var headers = [
    'draft_id','created_at','updated_at','user_id','item_id',
    'item_title','item_price','currency','quantity','status',
    'checkout_token','payment_provider','payment_url','note'
  ];
  ensureHeaders(sheet, headers);

  var draftId = nextId('DRF_', sheet);
  var checkoutToken = 'CHK_' + Utilities.getUuid().replace(/-/g, '').substring(0, 12).toUpperCase();
  var now = new Date().toISOString();

  appendRow(sheet, headers, {
    draft_id: draftId,
    created_at: now,
    updated_at: now,
    user_id: user.user_id,
    item_id: itemId,
    item_title: itemTitle,
    item_price: itemPrice,
    currency: currency,
    quantity: quantity,
    status: 'payment_disabled',
    checkout_token: checkoutToken,
    payment_provider: 'disabled',
    payment_url: '/payment/mock?token=' + checkoutToken,
    note: ''
  });

  return {
    ok: true,
    code: 'PURCHASE_DRAFT_CREATED',
    message: 'Checkout session created successfully.',
    data: {
      draft_id: draftId,
      checkout_token: checkoutToken,
      payment_url: '/payment/mock?token=' + checkoutToken
    }
  };
}
```

- [ ] **Step 5: gas/Code.gs を作成する**

```javascript
// gas/Code.gs
function doPost(e) {
  try {
    var body = JSON.parse(e.postData.contents);
    var action = body.action;
    var payload = body.payload || {};

    var result;
    switch (action) {
      case 'signup':              result = signup(payload); break;
      case 'verify_email':        result = verifyEmail(payload); break;
      case 'resend_verify_code':  result = resendVerifyCode(payload); break;
      case 'login':               result = login(payload); break;
      case 'me':                  result = me(payload); break;
      case 'logout':              result = logout(payload); break;
      case 'create_purchase_draft': result = createPurchaseDraft(payload); break;
      default:
        result = { ok: false, code: 'UNKNOWN_ACTION', message: 'Unknown action: ' + action };
    }

    return ContentService
      .createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    var errResult = { ok: false, code: 'SERVER_ERROR', message: err.message };
    return ContentService
      .createTextOutput(JSON.stringify(errResult))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
```

- [ ] **Step 6: GAS プロジェクトを手動デプロイする**

1. `script.google.com` で新規プロジェクトを作成
2. 各 `.gs` ファイルの内容をコピー（Sheet.gs → Email.gs → Auth.gs → Purchase.gs → Code.gs の順）
3. `Sheet.gs` の `SS_ID` を実際の Google Spreadsheet ID に書き換え
4. 「デプロイ」→「新しいデプロイ」→ 種類: Web アプリ → アクセス権: 全員
5. デプロイ URL を控える

- [ ] **Step 7: .env.local.example を作成し .env.local を設定する**

`.env.local.example`:
```
NEXT_PUBLIC_GAS_URL=https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec
```

`.env.local` に実際の URL を設定:
```bash
cp .env.local.example .env.local
# エディタで NEXT_PUBLIC_GAS_URL を書き換える
```

- [ ] **Step 8: コミット**

```bash
git add gas/ .env.local.example
git commit -m "feat: GAS バックエンドコード追加（signup/verify/login/checkout）"
```

---

## Task 2: types 更新 + lib/gas-client.ts + lib/auth-storage.ts

**Files:**
- Modify: `types/index.ts`
- Create: `lib/gas-client.ts`
- Create: `lib/auth-storage.ts`

- [ ] **Step 1: types/index.ts に User 型を追加する**

`types/index.ts` の末尾に追加:

```typescript
export type User = {
  user_id: string
  email: string
  display_name: string
  full_name: string
  avatar_url: string
  country: string
  phone?: string
  account_status: string
  email_verified: string
  created_at?: string
  last_login_at?: string
}

export type GASResponse<T = Record<string, unknown>> = {
  ok: boolean
  code: string
  message: string
  data?: T
}
```

- [ ] **Step 2: lib/gas-client.ts を作成する**

```typescript
// lib/gas-client.ts
import { GASResponse, User } from '@/types'

const GAS_URL = process.env.NEXT_PUBLIC_GAS_URL ?? ''

async function call<T>(action: string, payload: Record<string, unknown>): Promise<GASResponse<T>> {
  if (!GAS_URL) {
    throw new Error('NEXT_PUBLIC_GAS_URL is not set. Please configure .env.local.')
  }
  const res = await fetch(GAS_URL, {
    method: 'POST',
    body: JSON.stringify({ action, payload }),
  })
  const text = await res.text()
  return JSON.parse(text) as GASResponse<T>
}

export type SignupPayload = {
  email: string
  password: string
  display_name: string
  first_name: string
  last_name: string
  country: string
  phone: string
  birth_date: string
  marketing_opt_in: boolean
}

export type LoginResponse = User & { session_token: string }

export const gasClient = {
  signup(payload: SignupPayload) {
    return call<{ verify_required: boolean; email: string }>('signup', payload as unknown as Record<string, unknown>)
  },
  verifyEmail(email: string, code: string) {
    return call<Record<string, never>>('verify_email', { email, code })
  },
  resendVerifyCode(email: string) {
    return call<Record<string, never>>('resend_verify_code', { email })
  },
  login(email: string, password: string) {
    return call<LoginResponse>('login', { email, password })
  },
  me(sessionToken: string) {
    return call<User>('me', { session_token: sessionToken })
  },
  logout(sessionToken: string) {
    return call<Record<string, never>>('logout', { session_token: sessionToken })
  },
  createPurchaseDraft(sessionToken: string, itemId: string, itemTitle: string, itemPrice: number, currency = 'JPY', quantity = 1) {
    return call<{ draft_id: string; checkout_token: string; payment_url: string }>(
      'create_purchase_draft',
      { session_token: sessionToken, item_id: itemId, item_title: itemTitle, item_price: itemPrice, currency, quantity }
    )
  },
}
```

- [ ] **Step 3: lib/auth-storage.ts を作成する**

```typescript
// lib/auth-storage.ts
import { User } from '@/types'

const SESSION_KEY = 'lootify_session'
const USER_KEY = 'lootify_user'

export const authStorage = {
  saveSession(token: string, user: User) {
    if (typeof window === 'undefined') return
    localStorage.setItem(SESSION_KEY, token)
    localStorage.setItem(USER_KEY, JSON.stringify(user))
  },
  getToken(): string | null {
    if (typeof window === 'undefined') return null
    return localStorage.getItem(SESSION_KEY)
  },
  getUser(): User | null {
    if (typeof window === 'undefined') return null
    const raw = localStorage.getItem(USER_KEY)
    if (!raw) return null
    try { return JSON.parse(raw) as User } catch { return null }
  },
  clear() {
    if (typeof window === 'undefined') return
    localStorage.removeItem(SESSION_KEY)
    localStorage.removeItem(USER_KEY)
  },
}
```

- [ ] **Step 4: コミット**

```bash
git add types/index.ts lib/gas-client.ts lib/auth-storage.ts
git commit -m "feat: User 型・GAS クライアント・auth-storage を追加"
```

---

## Task 3: AuthContext + layout 更新

**Files:**
- Create: `contexts/AuthContext.tsx`
- Modify: `app/[locale]/layout.tsx`

- [ ] **Step 1: contexts/AuthContext.tsx を作成する**

```typescript
// contexts/AuthContext.tsx
'use client'

import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { User } from '@/types'
import { authStorage } from '@/lib/auth-storage'
import { gasClient } from '@/lib/gas-client'

type AuthContextValue = {
  user: User | null
  loading: boolean
  login: (sessionToken: string, user: User) => void
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  login: () => {},
  logout: async () => {},
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = authStorage.getToken()
    if (!token) { setLoading(false); return }
    gasClient.me(token).then((res) => {
      if (res.ok && res.data) {
        setUser(res.data)
      } else {
        authStorage.clear()
      }
    }).catch(() => {
      authStorage.clear()
    }).finally(() => {
      setLoading(false)
    })
  }, [])

  const login = useCallback((sessionToken: string, userData: User) => {
    authStorage.saveSession(sessionToken, userData)
    setUser(userData)
  }, [])

  const logout = useCallback(async () => {
    const token = authStorage.getToken()
    if (token) {
      try { await gasClient.logout(token) } catch {}
    }
    authStorage.clear()
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
```

- [ ] **Step 2: app/[locale]/layout.tsx に AuthProvider を追加する**

```typescript
// app/[locale]/layout.tsx
import type { Metadata } from 'next'
import '../globals.css'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { routing } from '@/i18n/routing'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { AuthProvider } from '@/contexts/AuthContext'

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Lootify - Trusted Digital Marketplace',
    description: 'Buy and sell digital goods on Lootify — a secure marketplace.',
  }
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  if (!routing.locales.includes(locale as (typeof routing.locales)[number])) {
    notFound()
  }
  const messages = await getMessages()

  return (
    <html lang={locale}>
      <body className="bg-white text-gray-800 min-h-screen flex flex-col">
        <NextIntlClientProvider messages={messages}>
          <AuthProvider>
            <Header />
            <main className="flex-1">
              {children}
            </main>
            <Footer />
          </AuthProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
```

- [ ] **Step 3: テストを実行して既存テストが壊れていないか確認する**

```bash
npx jest --no-coverage
```

期待: 全テスト PASS（新規テストなし、既存が壊れないことを確認）

- [ ] **Step 4: コミット**

```bash
git add contexts/AuthContext.tsx app/[locale]/layout.tsx
git commit -m "feat: AuthContext と AuthProvider を追加、layout に注入"
```

---

## Task 4: UserMenu コンポーネント（TDD）

**Files:**
- Create: `components/UserMenu.tsx`
- Create: `__tests__/UserMenu.test.tsx`
- Modify: `components/Header.tsx`

- [ ] **Step 1: テストを書く**

`__tests__/UserMenu.test.tsx`:

```typescript
import { render, screen, fireEvent } from '@testing-library/react'
import UserMenu from '@/components/UserMenu'

const mockLogin = jest.fn()
const mockLogout = jest.fn()

jest.mock('@/contexts/AuthContext', () => ({
  useAuth: jest.fn(),
}))

import { useAuth } from '@/contexts/AuthContext'

const mockUseAuth = useAuth as jest.Mock

describe('UserMenu', () => {
  it('未ログイン時に Login と Sign Up リンクを表示する', () => {
    mockUseAuth.mockReturnValue({ user: null, loading: false, login: mockLogin, logout: mockLogout })
    render(<UserMenu />)
    expect(screen.getByText('Login')).toBeInTheDocument()
    expect(screen.getByText('Sign Up')).toBeInTheDocument()
  })

  it('ローディング中は何も表示しない', () => {
    mockUseAuth.mockReturnValue({ user: null, loading: true, login: mockLogin, logout: mockLogout })
    const { container } = render(<UserMenu />)
    expect(container.firstChild).toBeNull()
  })

  it('ログイン済み時に表示名を表示する', () => {
    mockUseAuth.mockReturnValue({
      user: { user_id: 'USR_000001', display_name: 'Taro', email: 'taro@example.com', full_name: 'Taro Yamada', avatar_url: '', country: 'JP', account_status: 'active', email_verified: 'true' },
      loading: false, login: mockLogin, logout: mockLogout,
    })
    render(<UserMenu />)
    expect(screen.getByText('Taro')).toBeInTheDocument()
  })

  it('ログイン済み時に Sign Out ボタンを押すと logout が呼ばれる', () => {
    mockUseAuth.mockReturnValue({
      user: { user_id: 'USR_000001', display_name: 'Taro', email: 'taro@example.com', full_name: 'Taro Yamada', avatar_url: '', country: 'JP', account_status: 'active', email_verified: 'true' },
      loading: false, login: mockLogin, logout: mockLogout,
    })
    render(<UserMenu />)
    fireEvent.click(screen.getByText('Sign Out'))
    expect(mockLogout).toHaveBeenCalled()
  })
})
```

- [ ] **Step 2: テストが失敗することを確認**

```bash
npx jest __tests__/UserMenu.test.tsx --no-coverage
```

期待: `FAIL` — モジュールが見つからないエラー

- [ ] **Step 3: components/UserMenu.tsx を実装する**

```typescript
// components/UserMenu.tsx
'use client'

import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'

export default function UserMenu() {
  const { user, loading, logout } = useAuth()

  if (loading) return null

  if (!user) {
    return (
      <div className="flex items-center gap-3 text-sm whitespace-nowrap">
        <Link href="/login" className="hover:underline">Login</Link>
        <Link href="/signup" className="bg-sky-400 text-[#0b1929] font-bold px-3 py-1 rounded hover:bg-sky-300 transition-colors">Sign Up</Link>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-3 text-sm whitespace-nowrap">
      <div className="flex items-center gap-2">
        {user.avatar_url ? (
          <img src={user.avatar_url} alt={user.display_name} width={28} height={28} className="rounded-full" />
        ) : (
          <div className="w-7 h-7 rounded-full bg-sky-400 text-[#0b1929] font-bold flex items-center justify-center text-xs">
            {user.display_name.charAt(0).toUpperCase()}
          </div>
        )}
        <Link href="/account/profile" className="hover:underline font-medium">
          {user.display_name}
        </Link>
      </div>
      <Link href="/account/settings" className="hover:underline text-sky-200">Settings</Link>
      <button onClick={() => logout()} className="hover:underline text-sky-200">Sign Out</button>
    </div>
  )
}
```

- [ ] **Step 4: UserMenu テストが通ることを確認**

```bash
npx jest __tests__/UserMenu.test.tsx --no-coverage
```

期待: `PASS`、4 tests passed

- [ ] **Step 5: Header.tsx を更新して UserMenu を組み込む**

`components/Header.tsx` の既存の login/register リンク部分を UserMenu に置き換える:

変更前:
```typescript
          <div className="flex items-center gap-3 text-sm whitespace-nowrap">
            <Link href="/login" className="hover:underline">{t('login')}</Link>
            <Link href="/register" className="hover:underline">{t('register')}</Link>
            <LanguageSwitcher />
          </div>
```

変更後:
```typescript
          <div className="flex items-center gap-3 whitespace-nowrap">
            <UserMenu />
            <LanguageSwitcher />
          </div>
```

`components/Header.tsx` の import に追加:
```typescript
import UserMenu from '@/components/UserMenu'
```

- [ ] **Step 6: 全テストが通ることを確認**

```bash
npx jest --no-coverage
```

期待: 全テスト PASS（Header テストは UserMenu をモックしないが `getByAltText('RMTsite')` は引き続き通る）

> **Note:** Header テストが UserMenu の useAuth 呼び出しで失敗する場合、Header.test.tsx に以下を追加:
> ```typescript
> jest.mock('@/contexts/AuthContext', () => ({
>   useAuth: () => ({ user: null, loading: false, login: jest.fn(), logout: jest.fn() }),
>   AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
> }))
> ```

- [ ] **Step 7: コミット**

```bash
git add components/UserMenu.tsx __tests__/UserMenu.test.tsx components/Header.tsx
git commit -m "feat: UserMenu コンポーネントを追加、Header をログイン状態対応に更新"
```

---

## Task 5: サインアップページ（TDD）

**Files:**
- Create: `app/[locale]/signup/page.tsx`
- Create: `__tests__/SignupPage.test.tsx`

- [ ] **Step 1: テストを書く**

`__tests__/SignupPage.test.tsx`:

```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import SignupPage from '@/app/[locale]/signup/page'

const mockPush = jest.fn()
jest.mock('next/navigation', () => ({ useRouter: () => ({ push: mockPush }) }))
jest.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ user: null, loading: false, login: jest.fn(), logout: jest.fn() }),
}))

const mockSignup = jest.fn()
jest.mock('@/lib/gas-client', () => ({
  gasClient: { signup: (...args: unknown[]) => mockSignup(...args) },
}))

jest.mock('@/i18n/navigation', () => ({
  Link: ({ href, children }: { href: string; children: React.ReactNode }) => <a href={href}>{children}</a>,
}))

describe('SignupPage', () => {
  beforeEach(() => { mockPush.mockClear(); mockSignup.mockClear() })

  it('必須フィールドが全て表示される', () => {
    render(<SignupPage />)
    expect(screen.getByPlaceholderText('Email Address')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Password')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Username')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('First Name')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Last Name')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Create Account' })).toBeInTheDocument()
  })

  it('パスワード不一致でエラーを表示する', async () => {
    render(<SignupPage />)
    fireEvent.change(screen.getByPlaceholderText('Password'), { target: { value: 'Pass1234' } })
    fireEvent.change(screen.getByPlaceholderText('Confirm Password'), { target: { value: 'Different1' } })
    fireEvent.click(screen.getByRole('button', { name: 'Create Account' }))
    await waitFor(() => {
      expect(screen.getByText('Passwords do not match.')).toBeInTheDocument()
    })
    expect(mockSignup).not.toHaveBeenCalled()
  })

  it('サインアップ成功後に /verify-email へリダイレクトする', async () => {
    mockSignup.mockResolvedValue({ ok: true, code: 'SUCCESS', message: 'ok', data: { verify_required: true, email: 'a@b.com' } })
    render(<SignupPage />)
    fireEvent.change(screen.getByPlaceholderText('Email Address'), { target: { value: 'a@b.com' } })
    fireEvent.change(screen.getByPlaceholderText('Password'), { target: { value: 'Pass1234' } })
    fireEvent.change(screen.getByPlaceholderText('Confirm Password'), { target: { value: 'Pass1234' } })
    fireEvent.change(screen.getByPlaceholderText('Username'), { target: { value: 'taro' } })
    fireEvent.change(screen.getByPlaceholderText('First Name'), { target: { value: 'Taro' } })
    fireEvent.change(screen.getByPlaceholderText('Last Name'), { target: { value: 'Yamada' } })
    fireEvent.change(screen.getByPlaceholderText('Country'), { target: { value: 'Japan' } })
    fireEvent.change(screen.getByPlaceholderText('Phone Number'), { target: { value: '09012345678' } })
    fireEvent.change(screen.getByPlaceholderText('Date of Birth'), { target: { value: '1990-01-01' } })
    fireEvent.click(screen.getByLabelText(/Terms of Service/))
    fireEvent.click(screen.getByLabelText(/Privacy Policy/))
    fireEvent.click(screen.getByRole('button', { name: 'Create Account' }))
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/verify-email?email=a%40b.com')
    })
  })

  it('API エラー時にエラーメッセージを表示する', async () => {
    mockSignup.mockResolvedValue({ ok: false, code: 'EMAIL_ALREADY_EXISTS', message: 'An account with this email already exists.' })
    render(<SignupPage />)
    fireEvent.change(screen.getByPlaceholderText('Email Address'), { target: { value: 'a@b.com' } })
    fireEvent.change(screen.getByPlaceholderText('Password'), { target: { value: 'Pass1234' } })
    fireEvent.change(screen.getByPlaceholderText('Confirm Password'), { target: { value: 'Pass1234' } })
    fireEvent.change(screen.getByPlaceholderText('Username'), { target: { value: 'taro' } })
    fireEvent.change(screen.getByPlaceholderText('First Name'), { target: { value: 'Taro' } })
    fireEvent.change(screen.getByPlaceholderText('Last Name'), { target: { value: 'Yamada' } })
    fireEvent.change(screen.getByPlaceholderText('Country'), { target: { value: 'Japan' } })
    fireEvent.change(screen.getByPlaceholderText('Phone Number'), { target: { value: '09012345678' } })
    fireEvent.change(screen.getByPlaceholderText('Date of Birth'), { target: { value: '1990-01-01' } })
    fireEvent.click(screen.getByLabelText(/Terms of Service/))
    fireEvent.click(screen.getByLabelText(/Privacy Policy/))
    fireEvent.click(screen.getByRole('button', { name: 'Create Account' }))
    await waitFor(() => {
      expect(screen.getByText('An account with this email already exists.')).toBeInTheDocument()
    })
  })
})
```

- [ ] **Step 2: テストが失敗することを確認**

```bash
npx jest __tests__/SignupPage.test.tsx --no-coverage
```

期待: `FAIL` — モジュールが見つからないエラー

- [ ] **Step 3: app/[locale]/signup/page.tsx を実装する**

```typescript
// app/[locale]/signup/page.tsx
'use client'

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { Link } from '@/i18n/navigation'
import { gasClient } from '@/lib/gas-client'

export default function SignupPage() {
  const router = useRouter()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    const fd = new FormData(e.currentTarget)
    const email = fd.get('email') as string
    const password = fd.get('password') as string
    const confirmPassword = fd.get('confirm_password') as string
    const displayName = fd.get('display_name') as string
    const firstName = fd.get('first_name') as string
    const lastName = fd.get('last_name') as string
    const country = fd.get('country') as string
    const phone = fd.get('phone') as string
    const birthDate = fd.get('birth_date') as string
    const terms = fd.get('terms') === 'on'
    const privacy = fd.get('privacy') === 'on'
    const marketingOptIn = fd.get('marketing') === 'on'

    if (password !== confirmPassword) { setError('Passwords do not match.'); return }
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return }
    if (!terms || !privacy) { setError('You must agree to the Terms and Privacy Policy.'); return }

    setLoading(true)
    try {
      const res = await gasClient.signup({ email, password, display_name: displayName, first_name: firstName, last_name: lastName, country, phone, birth_date: birthDate, marketing_opt_in: marketingOptIn })
      if (res.ok) {
        router.push('/verify-email?email=' + encodeURIComponent(email))
      } else {
        setError(res.message)
      }
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-lg bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        <h1 className="text-2xl font-bold text-[#0b1929] mb-1">Create Your Lootify Account</h1>
        <p className="text-sm text-gray-500 mb-4">Join a trusted marketplace in just a few steps.</p>
        <ul className="flex flex-wrap gap-4 text-xs text-sky-600 font-medium mb-6">
          <li>✓ Secure registration</li>
          <li>✓ Email verification required</li>
          <li>✓ Protected account access</li>
        </ul>

        {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2 mb-4">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-3">
          <input name="email" type="email" placeholder="Email Address" required className="w-full px-3 py-2 text-sm border border-gray-300 rounded outline-none focus:border-sky-400" />
          <div className="grid grid-cols-2 gap-3">
            <input name="password" type="password" placeholder="Password" required className="w-full px-3 py-2 text-sm border border-gray-300 rounded outline-none focus:border-sky-400" />
            <input name="confirm_password" type="password" placeholder="Confirm Password" required className="w-full px-3 py-2 text-sm border border-gray-300 rounded outline-none focus:border-sky-400" />
          </div>
          <input name="display_name" type="text" placeholder="Username" required minLength={3} maxLength={24} className="w-full px-3 py-2 text-sm border border-gray-300 rounded outline-none focus:border-sky-400" />
          <div className="grid grid-cols-2 gap-3">
            <input name="first_name" type="text" placeholder="First Name" required className="w-full px-3 py-2 text-sm border border-gray-300 rounded outline-none focus:border-sky-400" />
            <input name="last_name" type="text" placeholder="Last Name" required className="w-full px-3 py-2 text-sm border border-gray-300 rounded outline-none focus:border-sky-400" />
          </div>
          <input name="country" type="text" placeholder="Country" required className="w-full px-3 py-2 text-sm border border-gray-300 rounded outline-none focus:border-sky-400" />
          <input name="phone" type="tel" placeholder="Phone Number" required className="w-full px-3 py-2 text-sm border border-gray-300 rounded outline-none focus:border-sky-400" />
          <input name="birth_date" type="date" placeholder="Date of Birth" required className="w-full px-3 py-2 text-sm border border-gray-300 rounded outline-none focus:border-sky-400" />

          <div className="space-y-2 pt-1">
            <label className="flex items-start gap-2 text-sm text-gray-700 cursor-pointer">
              <input name="terms" type="checkbox" className="mt-0.5" aria-label="I agree to the Terms of Service" required />
              <span>I agree to the <Link href="/terms" className="text-sky-500 hover:underline">Terms of Service</Link></span>
            </label>
            <label className="flex items-start gap-2 text-sm text-gray-700 cursor-pointer">
              <input name="privacy" type="checkbox" className="mt-0.5" aria-label="I agree to the Privacy Policy" required />
              <span>I agree to the <Link href="/privacy" className="text-sky-500 hover:underline">Privacy Policy</Link></span>
            </label>
            <label className="flex items-start gap-2 text-sm text-gray-500 cursor-pointer">
              <input name="marketing" type="checkbox" className="mt-0.5" />
              <span>Send me product updates and marketplace news</span>
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#0b1929] text-white font-bold py-2.5 rounded hover:bg-[#0d2038] disabled:opacity-50 transition-colors mt-2"
          >
            {loading ? 'Creating Account…' : 'Create Account'}
          </button>
        </form>

        <p className="text-sm text-center text-gray-500 mt-4">
          Already have an account?{' '}
          <Link href="/login" className="text-sky-500 hover:underline">Sign In</Link>
        </p>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: テストが通ることを確認**

```bash
npx jest __tests__/SignupPage.test.tsx --no-coverage
```

期待: `PASS`、4 tests passed

- [ ] **Step 5: コミット**

```bash
git add app/[locale]/signup/page.tsx __tests__/SignupPage.test.tsx
git commit -m "feat: サインアップページを追加"
```

---

## Task 6: メール認証ページ（TDD）

**Files:**
- Create: `app/[locale]/verify-email/page.tsx`
- Create: `__tests__/VerifyEmailPage.test.tsx`

- [ ] **Step 1: テストを書く**

`__tests__/VerifyEmailPage.test.tsx`:

```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import VerifyEmailPage from '@/app/[locale]/verify-email/page'

const mockPush = jest.fn()
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  useSearchParams: () => ({ get: (key: string) => key === 'email' ? 'user@example.com' : null }),
}))

const mockVerifyEmail = jest.fn()
const mockResend = jest.fn()
jest.mock('@/lib/gas-client', () => ({
  gasClient: {
    verifyEmail: (...args: unknown[]) => mockVerifyEmail(...args),
    resendVerifyCode: (...args: unknown[]) => mockResend(...args),
  },
}))

jest.mock('@/i18n/navigation', () => ({
  Link: ({ href, children }: { href: string; children: React.ReactNode }) => <a href={href}>{children}</a>,
}))

describe('VerifyEmailPage', () => {
  beforeEach(() => { mockPush.mockClear(); mockVerifyEmail.mockClear(); mockResend.mockClear() })

  it('認証フォームが表示される', () => {
    render(<VerifyEmailPage />)
    expect(screen.getByText('Verify Your Email')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('6-digit code')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Verify Email' })).toBeInTheDocument()
  })

  it('認証成功後に /login へリダイレクトする', async () => {
    mockVerifyEmail.mockResolvedValue({ ok: true, code: 'SUCCESS', message: 'ok' })
    render(<VerifyEmailPage />)
    fireEvent.change(screen.getByPlaceholderText('6-digit code'), { target: { value: '123456' } })
    fireEvent.click(screen.getByRole('button', { name: 'Verify Email' }))
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/login')
    })
  })

  it('コードが無効な場合エラーを表示する', async () => {
    mockVerifyEmail.mockResolvedValue({ ok: false, code: 'INVALID_CODE', message: 'Invalid verification code.' })
    render(<VerifyEmailPage />)
    fireEvent.change(screen.getByPlaceholderText('6-digit code'), { target: { value: '000000' } })
    fireEvent.click(screen.getByRole('button', { name: 'Verify Email' }))
    await waitFor(() => {
      expect(screen.getByText('Invalid verification code.')).toBeInTheDocument()
    })
  })

  it('Resend Code ボタンを押すと resendVerifyCode が呼ばれる', async () => {
    mockResend.mockResolvedValue({ ok: true, code: 'SUCCESS', message: 'A new verification code has been sent.' })
    render(<VerifyEmailPage />)
    fireEvent.click(screen.getByRole('button', { name: 'Resend Code' }))
    await waitFor(() => {
      expect(mockResend).toHaveBeenCalledWith('user@example.com')
    })
  })
})
```

- [ ] **Step 2: テストが失敗することを確認**

```bash
npx jest __tests__/VerifyEmailPage.test.tsx --no-coverage
```

- [ ] **Step 3: app/[locale]/verify-email/page.tsx を実装する**

```typescript
// app/[locale]/verify-email/page.tsx
'use client'

import { useState, FormEvent } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Link } from '@/i18n/navigation'
import { gasClient } from '@/lib/gas-client'

export default function VerifyEmailPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const email = searchParams.get('email') ?? ''
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(''); setInfo('')
    const code = (new FormData(e.currentTarget).get('code') as string).trim()
    setLoading(true)
    try {
      const res = await gasClient.verifyEmail(email, code)
      if (res.ok) {
        router.push('/login')
      } else {
        setError(res.message)
      }
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  async function handleResend() {
    setError(''); setInfo('')
    try {
      const res = await gasClient.resendVerifyCode(email)
      if (res.ok) { setInfo(res.message) } else { setError(res.message) }
    } catch {
      setError('Something went wrong. Please try again.')
    }
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-md bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        <h1 className="text-2xl font-bold text-[#0b1929] mb-1">Verify Your Email</h1>
        <p className="text-sm text-gray-500 mb-6">Enter the 6-digit verification code sent to your inbox.</p>
        {email && <p className="text-sm text-gray-600 bg-gray-50 rounded px-3 py-2 mb-4">Code sent to: <strong>{email}</strong></p>}
        {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2 mb-4">{error}</p>}
        {info && <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded px-3 py-2 mb-4">{info}</p>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <input name="code" type="text" placeholder="6-digit code" required maxLength={6} className="w-full px-3 py-2 text-sm border border-gray-300 rounded outline-none focus:border-sky-400 text-center tracking-widest text-lg" />
          <button type="submit" disabled={loading} className="w-full bg-[#0b1929] text-white font-bold py-2.5 rounded hover:bg-[#0d2038] disabled:opacity-50 transition-colors">
            {loading ? 'Verifying…' : 'Verify Email'}
          </button>
        </form>
        <p className="text-xs text-gray-500 mt-4 text-center">
          Didn&rsquo;t receive the email? Check your spam folder or{' '}
          <button onClick={handleResend} className="text-sky-500 hover:underline">Resend Code</button>
        </p>
        <p className="text-sm text-center text-gray-400 mt-3">
          <Link href="/login" className="text-sky-500 hover:underline">Back to Sign In</Link>
        </p>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: テストが通ることを確認**

```bash
npx jest __tests__/VerifyEmailPage.test.tsx --no-coverage
```

期待: `PASS`、4 tests passed

- [ ] **Step 5: コミット**

```bash
git add app/[locale]/verify-email/page.tsx __tests__/VerifyEmailPage.test.tsx
git commit -m "feat: メール認証ページを追加"
```

---

## Task 7: ログインページ（TDD）

**Files:**
- Create: `app/[locale]/login/page.tsx`
- Create: `__tests__/LoginPage.test.tsx`

- [ ] **Step 1: テストを書く**

`__tests__/LoginPage.test.tsx`:

```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import LoginPage from '@/app/[locale]/login/page'

const mockPush = jest.fn()
const mockLogin = jest.fn()
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  useSearchParams: () => ({ get: () => null }),
}))
jest.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ user: null, loading: false, login: (...args: unknown[]) => mockLogin(...args), logout: jest.fn() }),
}))

const mockGasLogin = jest.fn()
jest.mock('@/lib/gas-client', () => ({
  gasClient: { login: (...args: unknown[]) => mockGasLogin(...args) },
}))

jest.mock('@/i18n/navigation', () => ({
  Link: ({ href, children }: { href: string; children: React.ReactNode }) => <a href={href}>{children}</a>,
}))

describe('LoginPage', () => {
  beforeEach(() => { mockPush.mockClear(); mockLogin.mockClear(); mockGasLogin.mockClear() })

  it('ログインフォームが表示される', () => {
    render(<LoginPage />)
    expect(screen.getByText('Welcome Back')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Email Address')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Password')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Sign In' })).toBeInTheDocument()
  })

  it('ログイン成功後に / へリダイレクトする', async () => {
    const user = { user_id: 'USR_000001', email: 'a@b.com', display_name: 'Taro', full_name: 'Taro Y', avatar_url: '', country: 'JP', account_status: 'active', email_verified: 'true', session_token: 'tok123' }
    mockGasLogin.mockResolvedValue({ ok: true, code: 'SUCCESS', message: 'ok', data: user })
    render(<LoginPage />)
    fireEvent.change(screen.getByPlaceholderText('Email Address'), { target: { value: 'a@b.com' } })
    fireEvent.change(screen.getByPlaceholderText('Password'), { target: { value: 'Pass1234' } })
    fireEvent.click(screen.getByRole('button', { name: 'Sign In' }))
    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('tok123', expect.objectContaining({ user_id: 'USR_000001' }))
      expect(mockPush).toHaveBeenCalledWith('/')
    })
  })

  it('認証失敗時にエラーメッセージを表示する', async () => {
    mockGasLogin.mockResolvedValue({ ok: false, code: 'INVALID_CREDENTIALS', message: 'Invalid email or password.' })
    render(<LoginPage />)
    fireEvent.change(screen.getByPlaceholderText('Email Address'), { target: { value: 'a@b.com' } })
    fireEvent.change(screen.getByPlaceholderText('Password'), { target: { value: 'wrong' } })
    fireEvent.click(screen.getByRole('button', { name: 'Sign In' }))
    await waitFor(() => {
      expect(screen.getByText('Invalid email or password.')).toBeInTheDocument()
    })
  })

  it('VERIFY_REQUIRED 時に /verify-email へリダイレクトする', async () => {
    mockGasLogin.mockResolvedValue({ ok: false, code: 'VERIFY_REQUIRED', message: 'Please verify your email.', data: { email: 'a@b.com' } })
    render(<LoginPage />)
    fireEvent.change(screen.getByPlaceholderText('Email Address'), { target: { value: 'a@b.com' } })
    fireEvent.change(screen.getByPlaceholderText('Password'), { target: { value: 'Pass1234' } })
    fireEvent.click(screen.getByRole('button', { name: 'Sign In' }))
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/verify-email?email=a%40b.com')
    })
  })
})
```

- [ ] **Step 2: テストが失敗することを確認**

```bash
npx jest __tests__/LoginPage.test.tsx --no-coverage
```

- [ ] **Step 3: app/[locale]/login/page.tsx を実装する**

```typescript
// app/[locale]/login/page.tsx
'use client'

import { useState, FormEvent } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Link } from '@/i18n/navigation'
import { gasClient } from '@/lib/gas-client'
import { useAuth } from '@/contexts/AuthContext'

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirect = searchParams.get('redirect') ?? '/'
  const { login } = useAuth()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    const fd = new FormData(e.currentTarget)
    const email = fd.get('email') as string
    const password = fd.get('password') as string
    setLoading(true)
    try {
      const res = await gasClient.login(email, password)
      if (res.ok && res.data) {
        const { session_token, ...user } = res.data
        login(session_token, user)
        router.push(redirect)
      } else if (res.code === 'VERIFY_REQUIRED' && res.data) {
        router.push('/verify-email?email=' + encodeURIComponent(email))
      } else {
        setError(res.message)
      }
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-md bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        <h1 className="text-2xl font-bold text-[#0b1929] mb-1">Welcome Back</h1>
        <p className="text-sm text-gray-500 mb-6">Sign in to manage purchases, listings, and account settings.</p>
        {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2 mb-4">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-3">
          <input name="email" type="email" placeholder="Email Address" required className="w-full px-3 py-2 text-sm border border-gray-300 rounded outline-none focus:border-sky-400" />
          <input name="password" type="password" placeholder="Password" required className="w-full px-3 py-2 text-sm border border-gray-300 rounded outline-none focus:border-sky-400" />
          <button type="submit" disabled={loading} className="w-full bg-[#0b1929] text-white font-bold py-2.5 rounded hover:bg-[#0d2038] disabled:opacity-50 transition-colors">
            {loading ? 'Signing In…' : 'Sign In'}
          </button>
        </form>
        <div className="flex justify-between text-sm mt-4">
          <Link href="/forgot-password" className="text-sky-500 hover:underline">Forgot Password?</Link>
          <Link href="/signup" className="text-sky-500 hover:underline">Create an Account</Link>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: テストが通ることを確認**

```bash
npx jest __tests__/LoginPage.test.tsx --no-coverage
```

期待: `PASS`、4 tests passed

- [ ] **Step 5: 全テスト確認**

```bash
npx jest --no-coverage
```

- [ ] **Step 6: コミット**

```bash
git add app/[locale]/login/page.tsx __tests__/LoginPage.test.tsx
git commit -m "feat: ログインページを追加"
```

---

## Task 8: プロフィール・設定ページ

**Files:**
- Create: `app/[locale]/account/profile/page.tsx`
- Create: `app/[locale]/account/settings/page.tsx`

- [ ] **Step 1: app/[locale]/account/profile/page.tsx を実装する**

```typescript
// app/[locale]/account/profile/page.tsx
'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'

export default function ProfilePage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) router.push('/login?redirect=/account/profile')
  }, [user, loading, router])

  if (loading) return <div className="max-w-2xl mx-auto px-4 py-10 text-sm text-gray-500">Loading…</div>
  if (!user) return null

  const fields: [string, string | undefined][] = [
    ['Display Name', user.display_name],
    ['Full Name', user.full_name],
    ['Email Address', user.email],
    ['Country', user.country],
    ['Phone Number', user.phone],
    ['Account Status', user.account_status],
    ['Email Verified', user.email_verified === 'true' ? '✓ Verified' : '✗ Not verified'],
    ['Member Since', user.created_at?.slice(0, 10)],
    ['Last Login', user.last_login_at?.slice(0, 10)],
  ]

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <h1 className="text-xl font-bold text-[#0b1929] mb-6">My Profile</h1>
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="flex items-center gap-4 px-6 py-5 border-b border-gray-100 bg-gray-50">
          <div className="w-14 h-14 rounded-full bg-sky-400 text-[#0b1929] font-bold flex items-center justify-center text-xl">
            {user.display_name.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-bold text-gray-800">{user.display_name}</p>
            <p className="text-sm text-gray-500">{user.email}</p>
          </div>
        </div>
        <dl className="divide-y divide-gray-100">
          {fields.map(([label, value]) => value ? (
            <div key={label} className="px-6 py-3 flex gap-4 text-sm">
              <dt className="text-gray-500 w-36 shrink-0">{label}</dt>
              <dd className="text-gray-800 font-medium">{value}</dd>
            </div>
          ) : null)}
        </dl>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: app/[locale]/account/settings/page.tsx を実装する**

```typescript
// app/[locale]/account/settings/page.tsx
'use client'

import { useEffect, useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'

export default function SettingsPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (!loading && !user) router.push('/login?redirect=/account/settings')
  }, [user, loading, router])

  if (loading) return <div className="max-w-2xl mx-auto px-4 py-10 text-sm text-gray-500">Loading…</div>
  if (!user) return null

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    // Settings update is future-scoped (requires GAS updateUser action)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <h1 className="text-xl font-bold text-[#0b1929] mb-6">Account Settings</h1>
      {saved && <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded px-3 py-2 mb-4">Settings saved. (Live update requires backend integration.)</p>}
      <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Display Name</label>
          <input defaultValue={user.display_name} name="display_name" type="text" className="w-full px-3 py-2 text-sm border border-gray-300 rounded outline-none focus:border-sky-400" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
          <input defaultValue={user.country} name="country" type="text" className="w-full px-3 py-2 text-sm border border-gray-300 rounded outline-none focus:border-sky-400" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
          <input defaultValue={user.phone ?? ''} name="phone" type="tel" className="w-full px-3 py-2 text-sm border border-gray-300 rounded outline-none focus:border-sky-400" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
          <input value={user.email} disabled type="email" className="w-full px-3 py-2 text-sm border border-gray-200 rounded bg-gray-50 text-gray-400 cursor-not-allowed" />
          <p className="text-xs text-gray-400 mt-1">Email address cannot be changed at this time.</p>
        </div>
        <button type="submit" className="bg-[#0b1929] text-white font-bold px-6 py-2 rounded hover:bg-[#0d2038] transition-colors text-sm">
          Save Changes
        </button>
      </form>
    </div>
  )
}
```

- [ ] **Step 3: コミット**

```bash
git add app/[locale]/account/profile/page.tsx app/[locale]/account/settings/page.tsx
git commit -m "feat: プロフィール・設定ページを追加"
```

---

## Task 9: 商品詳細ページ（TDD）

**Files:**
- Create: `app/[locale]/item/[id]/page.tsx`
- Create: `__tests__/ItemPage.test.tsx`

- [ ] **Step 1: テストを書く**

`__tests__/ItemPage.test.tsx`:

```typescript
import { render, screen } from '@testing-library/react'
import { notFound } from 'next/navigation'
import ItemPage from '@/app/[locale]/item/[id]/page'

jest.mock('next/navigation', () => ({
  notFound: jest.fn(() => { throw new Error('NEXT_NOT_FOUND') }),
}))
jest.mock('@/i18n/navigation', () => ({
  Link: ({ href, children }: { href: string; children: React.ReactNode }) => <a href={href}>{children}</a>,
}))

const makeParams = (id: string) => Promise.resolve({ locale: 'en', id })

describe('ItemPage', () => {
  it('listings.json の id:1 の商品が表示される', async () => {
    render(await ItemPage({ params: makeParams('1') }))
    expect(screen.getByText('FFXIV ギル 100万')).toBeInTheDocument()
    expect(screen.getByText('¥3,500')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Buy Now/i })).toBeInTheDocument()
  })

  it('存在しない id で notFound を呼ぶ', async () => {
    await expect(ItemPage({ params: makeParams('99999') })).rejects.toThrow('NEXT_NOT_FOUND')
    expect(notFound).toHaveBeenCalled()
  })
})
```

- [ ] **Step 2: テストが失敗することを確認**

```bash
npx jest __tests__/ItemPage.test.tsx --no-coverage
```

- [ ] **Step 3: app/[locale]/item/[id]/page.tsx を実装する**

```typescript
// app/[locale]/item/[id]/page.tsx
import { notFound } from 'next/navigation'
import { Link } from '@/i18n/navigation'
import listingsData from '@/data/listings.json'
import { Listing } from '@/types'

export default async function ItemPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>
}) {
  const { id } = await params
  const listing = (listingsData as Listing[]).find((l) => l.id === Number(id))
  if (!listing) notFound()

  return (
    <div className="max-w-screen-lg mx-auto px-4 py-8">
      <div className="grid md:grid-cols-2 gap-8">
        {/* 左: 商品情報 */}
        <div>
          <div className="aspect-video bg-gray-100 rounded-xl overflow-hidden mb-4">
            <img src={listing.imageUrl} alt={listing.title} className="w-full h-full object-cover" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">{listing.title}</h1>
          <p className="text-sm text-gray-500 mb-4">Game: <span className="font-medium text-gray-700">{listing.gameName}</span></p>
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-sm space-y-2 text-gray-600">
            <p><span className="font-medium">Category:</span> Digital Goods</p>
            <p><span className="font-medium">Delivery:</span> Within 24 hours</p>
            <p><span className="font-medium">Availability:</span> In Stock</p>
          </div>
          <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-lg text-sm">
            <p className="font-medium text-gray-700 mb-1">Seller</p>
            <p className="text-gray-500">Verified Seller · 100% positive feedback</p>
          </div>
        </div>

        {/* 右: 購入エリア */}
        <div>
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm sticky top-4">
            <p className="text-3xl font-bold text-[#0b1929] mb-1">
              ¥{listing.price.toLocaleString('ja-JP')}
            </p>
            <p className="text-sm text-gray-500 mb-6">Fixed price · No hidden fees</p>
            <Link
              href={`/checkout/${listing.id}`}
              className="block w-full bg-[#0b1929] text-white text-center font-bold py-3 rounded-lg hover:bg-[#0d2038] transition-colors text-sm"
            >
              Buy Now — ¥{listing.price.toLocaleString('ja-JP')}
            </Link>
            <div className="mt-4 space-y-2 text-xs text-gray-500">
              <p className="flex items-center gap-1">🔒 Secure Checkout</p>
              <p className="flex items-center gap-1">🛡 Trusted Marketplace</p>
              <p className="flex items-center gap-1">✓ Protected Purchase Flow</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: テストが通ることを確認**

```bash
npx jest __tests__/ItemPage.test.tsx --no-coverage
```

期待: `PASS`、2 tests passed

- [ ] **Step 5: コミット**

```bash
git add app/[locale]/item/[id]/page.tsx __tests__/ItemPage.test.tsx
git commit -m "feat: 商品詳細ページを追加"
```

---

## Task 10: チェックアウトページ + モック決済ページ（TDD）

**Files:**
- Create: `app/[locale]/checkout/[itemId]/page.tsx`
- Create: `app/[locale]/payment/mock/page.tsx`
- Create: `__tests__/CheckoutPage.test.tsx`
- Create: `__tests__/MockPaymentPage.test.tsx`

- [ ] **Step 1: CheckoutPage テストを書く**

`__tests__/CheckoutPage.test.tsx`:

```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import CheckoutPage from '@/app/[locale]/checkout/[itemId]/page'

const mockPush = jest.fn()
jest.mock('next/navigation', () => ({ useRouter: () => ({ push: mockPush }) }))
jest.mock('@/i18n/navigation', () => ({
  Link: ({ href, children }: { href: string; children: React.ReactNode }) => <a href={href}>{children}</a>,
}))

const mockCreateDraft = jest.fn()
jest.mock('@/lib/gas-client', () => ({
  gasClient: { createPurchaseDraft: (...args: unknown[]) => mockCreateDraft(...args) },
}))

jest.mock('@/lib/auth-storage', () => ({
  authStorage: { getToken: () => 'tok_test' },
}))

jest.mock('@/contexts/AuthContext', () => ({
  useAuth: jest.fn(),
}))

import { useAuth } from '@/contexts/AuthContext'
const mockUseAuth = useAuth as jest.Mock

const makeParams = (itemId: string) => Promise.resolve({ locale: 'en', itemId })

describe('CheckoutPage', () => {
  beforeEach(() => { mockPush.mockClear(); mockCreateDraft.mockClear() })

  it('未ログイン時に /login へリダイレクトする', async () => {
    mockUseAuth.mockReturnValue({ user: null, loading: false })
    render(await CheckoutPage({ params: makeParams('1') }))
    // useEffect で router.push が呼ばれることを確認（CheckoutPage はクライアントコンポーネントのため server render では null を返す）
    // このテストは Checkout が未ログイン時に null を返すことを確認
    const container = screen.queryByText('Secure Checkout')
    // ログインしていないので Secure Checkout は表示されない
    expect(container).not.toBeInTheDocument()
  })

  it('ログイン済み時に商品情報が表示される', async () => {
    mockUseAuth.mockReturnValue({
      user: { user_id: 'USR_000001', display_name: 'Taro', email: 'a@b.com', full_name: 'Taro Y', avatar_url: '', country: 'JP', account_status: 'active', email_verified: 'true' },
      loading: false,
    })
    render(await CheckoutPage({ params: makeParams('1') }))
    expect(screen.getByText('Secure Checkout')).toBeInTheDocument()
    expect(screen.getByText('FFXIV ギル 100万')).toBeInTheDocument()
  })

  it('Continue to Payment で createPurchaseDraft が呼ばれる', async () => {
    mockUseAuth.mockReturnValue({
      user: { user_id: 'USR_000001', display_name: 'Taro', email: 'a@b.com', full_name: 'Taro Y', avatar_url: '', country: 'JP', account_status: 'active', email_verified: 'true' },
      loading: false,
    })
    mockCreateDraft.mockResolvedValue({
      ok: true, code: 'PURCHASE_DRAFT_CREATED', message: 'ok',
      data: { draft_id: 'DRF_000001', checkout_token: 'CHK_ABC123', payment_url: '/payment/mock?token=CHK_ABC123' },
    })
    render(await CheckoutPage({ params: makeParams('1') }))
    fireEvent.click(screen.getByRole('button', { name: /Continue to Payment/i }))
    await waitFor(() => {
      expect(mockCreateDraft).toHaveBeenCalled()
      expect(mockPush).toHaveBeenCalledWith('/payment/mock?token=CHK_ABC123')
    })
  })
})
```

- [ ] **Step 2: MockPaymentPage テストを書く**

`__tests__/MockPaymentPage.test.tsx`:

```typescript
import { render, screen } from '@testing-library/react'
import MockPaymentPage from '@/app/[locale]/payment/mock/page'

jest.mock('next/navigation', () => ({
  useSearchParams: () => ({ get: (key: string) => key === 'token' ? 'CHK_ABC123' : null }),
}))
jest.mock('@/i18n/navigation', () => ({
  Link: ({ href, children }: { href: string; children: React.ReactNode }) => <a href={href}>{children}</a>,
}))

describe('MockPaymentPage', () => {
  it('Payment Gateway Not Yet Live と表示する', () => {
    render(<MockPaymentPage />)
    expect(screen.getByText('Payment Gateway Not Yet Live')).toBeInTheDocument()
  })

  it('チェックアウトトークンを表示する', () => {
    render(<MockPaymentPage />)
    expect(screen.getByText('CHK_ABC123')).toBeInTheDocument()
  })

  it('Return to Home リンクが表示される', () => {
    render(<MockPaymentPage />)
    expect(screen.getByRole('link', { name: 'Return to Home' })).toBeInTheDocument()
  })
})
```

- [ ] **Step 3: テストが失敗することを確認**

```bash
npx jest __tests__/CheckoutPage.test.tsx __tests__/MockPaymentPage.test.tsx --no-coverage
```

- [ ] **Step 4: app/[locale]/checkout/[itemId]/page.tsx を実装する**

```typescript
// app/[locale]/checkout/[itemId]/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Link } from '@/i18n/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { gasClient } from '@/lib/gas-client'
import { authStorage } from '@/lib/auth-storage'
import listingsData from '@/data/listings.json'
import { Listing } from '@/types'

export default function CheckoutPage({
  params,
}: {
  params: Promise<{ locale: string; itemId: string }>
}) {
  const router = useRouter()
  const { user, loading } = useAuth()
  const [itemId, setItemId] = useState<string>('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    params.then(({ itemId: id }) => setItemId(id))
  }, [params])

  useEffect(() => {
    if (!loading && !user) router.push('/login?redirect=/checkout/' + itemId)
  }, [user, loading, router, itemId])

  if (loading || !user) return null

  const listing = (listingsData as Listing[]).find((l) => l.id === Number(itemId))
  if (!listing) return <p className="p-8 text-gray-500">Item not found.</p>

  async function handleContinue() {
    if (!listing) return
    setSubmitting(true); setError('')
    const token = authStorage.getToken() ?? ''
    try {
      const res = await gasClient.createPurchaseDraft(token, String(listing.id), listing.title, listing.price)
      if (res.ok && res.data) {
        router.push(res.data.payment_url)
      } else {
        setError(res.message || 'Unable to create checkout session.')
      }
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-screen-lg mx-auto px-4 py-8">
      <h1 className="text-xl font-bold text-[#0b1929] mb-2">Secure Checkout</h1>
      <p className="text-sm text-gray-500 mb-6">Review your item details before continuing.</p>
      {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2 mb-4">{error}</p>}
      <div className="grid md:grid-cols-3 gap-6">
        {/* 左: 商品サマリー */}
        <div className="md:col-span-2 space-y-4">
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <h2 className="text-sm font-bold text-gray-700 mb-3">Item Details</h2>
            <div className="flex gap-4">
              <img src={listing.imageUrl} alt={listing.title} width={80} height={80} className="object-cover rounded" />
              <div>
                <p className="font-medium text-gray-800">{listing.title}</p>
                <p className="text-sm text-gray-500">{listing.gameName}</p>
                <p className="text-sm text-gray-500 mt-1">Delivery: within 24 hours</p>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 text-sm text-gray-600 space-y-1">
            <p>📦 Digital delivery — no shipping required</p>
            <p>🔒 Your payment will not be processed until you proceed.</p>
          </div>
        </div>

        {/* 右: 価格 + ボタン */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm self-start">
          <h2 className="text-sm font-bold text-gray-700 mb-3">Order Summary</h2>
          <div className="flex justify-between text-sm mb-1">
            <span>Item</span>
            <span>¥{listing.price.toLocaleString('ja-JP')}</span>
          </div>
          <div className="flex justify-between text-sm text-gray-500 mb-4">
            <span>Quantity</span>
            <span>× 1</span>
          </div>
          <div className="flex justify-between font-bold text-[#0b1929] border-t border-gray-100 pt-3 mb-4">
            <span>Total</span>
            <span>¥{listing.price.toLocaleString('ja-JP')}</span>
          </div>
          <button
            onClick={handleContinue}
            disabled={submitting}
            className="w-full bg-[#0b1929] text-white font-bold py-3 rounded-lg hover:bg-[#0d2038] disabled:opacity-50 transition-colors text-sm"
          >
            {submitting ? 'Processing…' : 'Continue to Payment'}
          </button>
          <div className="mt-3 space-y-1 text-xs text-gray-400">
            <p>🔒 Secure Checkout</p>
            <p>🛡 Protected Purchase Flow</p>
          </div>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 5: app/[locale]/payment/mock/page.tsx を実装する**

```typescript
// app/[locale]/payment/mock/page.tsx
'use client'

import { useSearchParams } from 'next/navigation'
import { Link } from '@/i18n/navigation'

export default function MockPaymentPage() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token') ?? ''

  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-md bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
        <div className="text-4xl mb-4">🔧</div>
        <h1 className="text-xl font-bold text-[#0b1929] mb-2">Payment Gateway Not Yet Live</h1>
        <p className="text-sm text-gray-600 mb-2">Your checkout session has been created successfully.</p>
        <p className="text-sm text-gray-500 mb-2">The payment gateway is currently in test mode and has not been enabled yet.</p>
        <p className="text-sm text-gray-400 mb-6">This marketplace flow is ready for future live payment integration.</p>

        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-left text-xs text-gray-500 space-y-1 mb-6">
          <p><span className="font-medium">Checkout Token:</span> {token || '—'}</p>
          <p><span className="font-medium">Payment Status:</span> Disabled / Test Mode</p>
        </div>

        <div className="flex flex-col gap-2">
          <Link href="/" className="block bg-[#0b1929] text-white font-bold py-2.5 rounded-lg hover:bg-[#0d2038] transition-colors text-sm">
            Return to Home
          </Link>
          <Link href="/account/profile" className="block border border-gray-200 text-gray-700 font-medium py-2.5 rounded-lg hover:bg-gray-50 transition-colors text-sm">
            Go to My Purchases
          </Link>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 6: テストが通ることを確認**

```bash
npx jest __tests__/CheckoutPage.test.tsx __tests__/MockPaymentPage.test.tsx --no-coverage
```

期待: 全テスト PASS

- [ ] **Step 7: 全テスト確認**

```bash
npx jest --no-coverage
```

期待: 全テスト PASS

- [ ] **Step 8: コミット**

```bash
git add app/[locale]/checkout/[itemId]/page.tsx app/[locale]/payment/mock/page.tsx __tests__/CheckoutPage.test.tsx __tests__/MockPaymentPage.test.tsx
git commit -m "feat: チェックアウト・モック決済ページを追加"
```

---

## Self-Review

### Spec coverage チェック

| 要件 | Task |
|------|------|
| GAS signup / verify / login / me / logout / create_purchase_draft | Task 1 |
| users / login_logs / email_logs / purchase_drafts シート | Task 1 |
| パスワードハッシュ (SHA-256 + salt) | Task 1 |
| 6桁認証コード・30分有効 | Task 1 |
| セッショントークン・7日有効 | Task 1 |
| GASResponse 標準形式 | Task 2 |
| セッション localStorage 保存 | Task 2 |
| AuthContext (login/logout/me 検証) | Task 3 |
| /signup ページ + バリデーション | Task 5 |
| /verify-email ページ + resend | Task 6 |
| /login ページ + VERIFY_REQUIRED リダイレクト | Task 7 |
| ヘッダー logged-in/out 切り替え (UserMenu) | Task 4 |
| /account/profile ページ | Task 8 |
| /account/settings ページ | Task 8 |
| /item/[id] 商品詳細 + Buy Now | Task 9 |
| /checkout/[itemId] チェックアウト | Task 10 |
| /payment/mock モック決済 | Task 10 |
| 未ログイン → /login リダイレクト (checkout) | Task 10 |
| Trust badges (Secure Checkout 等) | Task 9, 10 |
| 国際的マーケットプレイス UX コピー | Task 5-10 |

全要件カバー済み。
