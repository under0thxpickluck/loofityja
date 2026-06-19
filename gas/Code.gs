// ============================================================
//  Lootify – Google Apps Script バックエンド
//  スプレッドシート ID は下の SPREADSHEET_ID に設定済み
// ============================================================

const SPREADSHEET_ID = '1IrLMLZBgGHVXdh1gawhTgE3o72vxqzcKbxl3cyFZq5s'
const SESSION_EXPIRE_HOURS = 24 * 7        // 7日間
const VERIFY_CODE_EXPIRE_MIN = 30          // 確認コード有効期限（分）
const SITE_NAME = 'Lootify'

// ──────────────────────────────────────────
//  HTTP エントリポイント
// ──────────────────────────────────────────

function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents)
    const { action, ...params } = body
    const result = dispatch(action, params)
    return jsonOut(result)
  } catch (err) {
    return jsonOut({ ok: false, code: 'INTERNAL_ERROR', message: err.message })
  }
}

function doGet() {
  return jsonOut({ ok: true, message: 'Lootify API is running' })
}

function jsonOut(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON)
}

function dispatch(action, params) {
  switch (action) {
    case 'signup':                 return signup(params)
    case 'verify_email':           return verifyEmail(params)
    case 'resend_verify_code':     return resendVerifyCode(params)
    case 'login':                  return login(params)
    case 'me':                     return me(params)
    case 'logout':                 return logout(params)
    case 'create_purchase_draft':  return createPurchaseDraft(params)
    case 'get_lifai_wallets':      return getLifaiWallets()
    case 'create_lifai_sell_request': return createLifaiSellRequest(params)
    case 'get_lifai_sell_requests':   return getLifaiSellRequests(params)
    case 'update_lifai_deposit_status': return updateLifaiDepositStatus(params)
    default:
      return { ok: false, code: 'UNKNOWN_ACTION', message: 'Unknown action: ' + action }
  }
}

// ──────────────────────────────────────────
//  シートユーティリティ
// ──────────────────────────────────────────

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

function getSheet(name) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID)
  let sheet = ss.getSheetByName(name)
  if (!sheet) {
    sheet = ss.insertSheet(name)
    const h = SHEET_HEADERS[name]
    if (h) {
      sheet.appendRow(h)
      sheet.getRange(1, 1, 1, h.length).setFontWeight('bold').setBackground('#0b1929').setFontColor('#ffffff')
    }
  }
  return sheet
}

/** 指定フィールドの値が value に一致する最初の行番号（1-indexed）を返す。なければ -1 */
function findRow(sheet, key, value) {
  const data = sheet.getDataRange().getValues()
  if (data.length < 2) return -1
  const col = data[0].indexOf(key)
  if (col === -1) return -1
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][col]).trim().toLowerCase() === String(value).trim().toLowerCase()) return i + 1
  }
  return -1
}

/** sheet の row 行（1-indexed）を Object として返す */
function getRowObj(sheet, row) {
  const data = sheet.getDataRange().getValues()
  const headers = data[0]
  const r = data[row - 1]
  const obj = {}
  headers.forEach((h, i) => { obj[h] = r[i] })
  return obj
}

/** sheet の row 行の key 列を value に更新 */
function setCellByKey(sheet, row, key, value) {
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0]
  const col = headers.indexOf(key) + 1
  if (col > 0) sheet.getRange(row, col).setValue(value)
}

/** 列が存在しなければ末尾に追加する */
function ensureColumn(sheet, colName) {
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0]
  if (!headers.includes(colName)) {
    sheet.getRange(1, headers.length + 1).setValue(colName)
  }
}

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

// ──────────────────────────────────────────
//  ユーティリティ
// ──────────────────────────────────────────

function newToken() {
  return Utilities.getUuid().replace(/-/g, '') + Utilities.getUuid().replace(/-/g, '')
}

function newCode() {
  return String(Math.floor(100000 + Math.random() * 900000))
}

function newWalletAddress() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let s = ''
  for (let i = 0; i < 6; i++) s += chars[Math.floor(Math.random() * chars.length)]
  return 'LFW-' + s
}

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

// ──────────────────────────────────────────
//  アクション実装
// ──────────────────────────────────────────

function signup({ email, password, display_name, first_name, last_name, country, phone, marketing_opt_in }) {
  if (!email || !password || !display_name)
    return { ok: false, code: 'MISSING_FIELDS', message: 'メールアドレス・パスワード・表示名は必須です。' }

  const usersSheet = getSheet('Users')
  if (findRow(usersSheet, 'email', email) > 0)
    return { ok: false, code: 'EMAIL_EXISTS', message: 'このメールアドレスはすでに登録されています。' }

  const id = Utilities.getUuid()
  const now = new Date().toISOString()
  const walletAddress = newWalletAddress()
  usersSheet.appendRow([
    id, email.trim().toLowerCase(), password,
    display_name, first_name || '', last_name || '', country || '',
    phone || '', marketing_opt_in ? 'true' : 'false',
    'false', now, '', walletAddress
  ])

  // 確認コード発行
  const code = newCode()
  const expires = new Date(Date.now() + VERIFY_CODE_EXPIRE_MIN * 60000).toISOString()
  const codesSheet = getSheet('VerifyCodes')
  // 既存コードを削除
  let old = findRow(codesSheet, 'email', email)
  while (old > 0) { codesSheet.deleteRow(old); old = findRow(codesSheet, 'email', email) }
  codesSheet.appendRow([email.trim().toLowerCase(), code, now, expires])

  // 確認メール送信
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

  return { ok: true, code: 'SIGNUP_OK', data: { verify_required: true, email: email.trim().toLowerCase() } }
}

function verifyEmail({ email, code }) {
  if (!email || !code)
    return { ok: false, code: 'MISSING_FIELDS', message: 'メールアドレスとコードは必須です。' }

  const codesSheet = getSheet('VerifyCodes')
  const row = findRow(codesSheet, 'email', email)
  if (row < 0)
    return { ok: false, code: 'CODE_NOT_FOUND', message: '確認コードが見つかりません。再送信してください。' }

  const r = getRowObj(codesSheet, row)
  if (new Date() > new Date(r.expires_at))
    return { ok: false, code: 'CODE_EXPIRED', message: '確認コードの有効期限が切れました。再送信してください。' }
  if (String(r.code) !== String(code).trim())
    return { ok: false, code: 'CODE_INVALID', message: '確認コードが正しくありません。' }

  // メール確認済みにする
  const usersSheet = getSheet('Users')
  const userRow = findRow(usersSheet, 'email', email)
  if (userRow > 0) setCellByKey(usersSheet, userRow, 'email_verified', 'true')

  codesSheet.deleteRow(row)

  return { ok: true, code: 'VERIFY_OK', message: 'メールアドレスの確認が完了しました。' }
}

function resendVerifyCode({ email }) {
  if (!email)
    return { ok: false, code: 'MISSING_FIELDS', message: 'メールアドレスは必須です。' }

  const usersSheet = getSheet('Users')
  const userRow = findRow(usersSheet, 'email', email)
  if (userRow < 0)
    return { ok: false, code: 'USER_NOT_FOUND', message: 'このメールアドレスは登録されていません。' }

  const user = getRowObj(usersSheet, userRow)
  const code = newCode()
  const now = new Date().toISOString()
  const expires = new Date(Date.now() + VERIFY_CODE_EXPIRE_MIN * 60000).toISOString()

  const codesSheet = getSheet('VerifyCodes')
  let old = findRow(codesSheet, 'email', email)
  while (old > 0) { codesSheet.deleteRow(old); old = findRow(codesSheet, 'email', email) }
  codesSheet.appendRow([email.trim().toLowerCase(), code, now, expires])

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

  return { ok: true, code: 'RESEND_OK', message: '確認コードを再送信しました。' }
}

function login({ email, password }) {
  if (!email || !password)
    return { ok: false, code: 'MISSING_FIELDS', message: 'メールアドレスとパスワードは必須です。' }

  const usersSheet = getSheet('Users')
  const userRow = findRow(usersSheet, 'email', email)
  if (userRow < 0)
    return { ok: false, code: 'INVALID_CREDENTIALS', message: 'メールアドレスまたはパスワードが正しくありません。' }

  const user = getRowObj(usersSheet, userRow)
  if (user.password_hash !== password)
    return { ok: false, code: 'INVALID_CREDENTIALS', message: 'メールアドレスまたはパスワードが正しくありません。' }
  if (String(user.email_verified) !== 'true')
    return { ok: false, code: 'EMAIL_NOT_VERIFIED', message: 'メールアドレスの確認が完了していません。' }

  // ウォレットが未設定の場合は生成して保存
  if (!user.wallet_address) {
    ensureColumn(usersSheet, 'wallet_address')
    user.wallet_address = newWalletAddress()
    setCellByKey(usersSheet, userRow, 'wallet_address', user.wallet_address)
  }

  // セッション作成
  const token = newToken()
  const now = new Date()
  const expires = new Date(now.getTime() + SESSION_EXPIRE_HOURS * 3600000)
  getSheet('Sessions').appendRow([token, user.id, now.toISOString(), expires.toISOString()])

  // last_login 更新
  setCellByKey(usersSheet, userRow, 'last_login', now.toISOString())

  return {
    ok: true, code: 'LOGIN_OK',
    data: {
      session_token: token,
      id: user.id,
      email: user.email,
      display_name: user.display_name,
      first_name: user.first_name,
      last_name: user.last_name,
      country: user.country,
      phone: user.phone || null,
      email_verified: true,
      last_login: now.toISOString(),
      wallet_address: user.wallet_address || '',
    }
  }
}

function me({ session_token }) {
  if (!session_token)
    return { ok: false, code: 'MISSING_TOKEN', message: 'セッショントークンが必要です。' }

  const sessionsSheet = getSheet('Sessions')
  const sessionRow = findRow(sessionsSheet, 'token', session_token)
  if (sessionRow < 0)
    return { ok: false, code: 'INVALID_TOKEN', message: '無効なセッションです。再ログインしてください。' }

  const session = getRowObj(sessionsSheet, sessionRow)
  if (new Date() > new Date(session.expires_at)) {
    sessionsSheet.deleteRow(sessionRow)
    return { ok: false, code: 'SESSION_EXPIRED', message: 'セッションの有効期限が切れました。再ログインしてください。' }
  }

  const usersSheet = getSheet('Users')
  const userRow = findRow(usersSheet, 'id', session.user_id)
  if (userRow < 0)
    return { ok: false, code: 'USER_NOT_FOUND', message: 'ユーザーが見つかりません。' }

  const user = getRowObj(usersSheet, userRow)

  // ウォレットが未設定の場合は生成して保存
  if (!user.wallet_address) {
    ensureColumn(usersSheet, 'wallet_address')
    user.wallet_address = newWalletAddress()
    setCellByKey(usersSheet, userRow, 'wallet_address', user.wallet_address)
  }

  return {
    ok: true, code: 'ME_OK',
    data: {
      id: user.id,
      email: user.email,
      display_name: user.display_name,
      first_name: user.first_name,
      last_name: user.last_name,
      country: user.country,
      phone: user.phone || null,
      email_verified: String(user.email_verified) === 'true',
      last_login: user.last_login || null,
      wallet_address: user.wallet_address,
    }
  }
}

function logout({ session_token }) {
  if (session_token) {
    const sessionsSheet = getSheet('Sessions')
    const row = findRow(sessionsSheet, 'token', session_token)
    if (row > 0) sessionsSheet.deleteRow(row)
  }
  return { ok: true, code: 'LOGOUT_OK', message: 'ログアウトしました。' }
}

function createPurchaseDraft({ session_token, item_id, item_title, item_price, currency, quantity }) {
  if (!session_token)
    return { ok: false, code: 'AUTH_REQUIRED', message: 'ログインが必要です。' }

  const sessionsSheet = getSheet('Sessions')
  const sessionRow = findRow(sessionsSheet, 'token', session_token)
  if (sessionRow < 0)
    return { ok: false, code: 'INVALID_TOKEN', message: '無効なセッションです。' }

  const session = getRowObj(sessionsSheet, sessionRow)
  const id = Utilities.getUuid()
  const now = new Date().toISOString()
  const paymentUrl = '/ja/payment/mock?token=' + id

  getSheet('Purchases').appendRow([
    id, session.user_id, item_id, item_title,
    item_price, currency || 'JPY', quantity || 1,
    'pending', paymentUrl, now
  ])

  return { ok: true, code: 'DRAFT_OK', data: { payment_url: paymentUrl } }
}

function getLifaiWallets() {
  const sheet = getSheet('LifaiWallets')
  const data = sheet.getDataRange().getValues()
  if (data.length < 2) return { ok: true, code: 'WALLETS_OK', data: { wallets: [] } }

  const headers = data[0]
  const wallets = data.slice(1)
    .filter(r => String(r[headers.indexOf('active')]).toLowerCase() === 'true')
    .map(r => ({
      slot: Number(r[headers.indexOf('slot')]),
      wallet_address: String(r[headers.indexOf('wallet_address')]),
      label: String(r[headers.indexOf('label')]),
    }))

  return { ok: true, code: 'WALLETS_OK', data: { wallets } }
}

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

function createLifaiSellRequest(params) {
  const auth = requireSessionUser_(params.session_token)
  if (!auth.ok) return auth.res
  const user = auth.user

  const ep = Number(params.ep_amount)
  if (!isFinite(ep) || ep < 100 || Math.floor(ep) !== ep)
    return { ok: false, code: 'INVALID_EP_AMOUNT', message: 'EP数量は100以上の整数で指定してください。' }
  if (!params.request_id || !params.lifai_plan || !params.payout_network || !params.payout_wallet)
    return { ok: false, code: 'MISSING_FIELDS', message: '必須項目が不足しています。' }

  // 同時リクエストで1件制限をすり抜けないようロックする
  const lock = LockService.getScriptLock()
  try { lock.waitLock(10000) } catch (e) {
    return { ok: false, code: 'BUSY', message: '混み合っています。しばらくしてから再試行してください。' }
  }
  try {
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
  } finally {
    lock.releaseLock()
  }
}

function updateLifaiDepositStatus(params) {
  const expected = PropertiesService.getScriptProperties().getProperty('LOOTIFY_API_KEY')
  if (!expected || !params.api_key || String(params.api_key) !== String(expected))
    return { ok: false, code: 'UNAUTHORIZED', message: 'APIキーが不正です。' }
  if (!params.request_id)
    return { ok: false, code: 'MISSING_FIELDS', message: 'request_idは必須です。' }

  // 同時チェックの古いスナップショットで確定済みステータスを退行させないようロックする
  const lock = LockService.getScriptLock()
  try { lock.waitLock(10000) } catch (e) {
    return { ok: false, code: 'BUSY', message: '混み合っています。しばらくしてから再試行してください。' }
  }
  try {
    const sheet = getSheet('LifaiSellRequests')
    ensureLifaiColumns_(sheet)
    const row = findRow(sheet, 'request_id', params.request_id)
    if (row < 0) return { ok: false, code: 'REQUEST_NOT_FOUND', message: '申請が見つかりません。' }

    // ステータス退行ガード: 未完了（入金待ち・入金不足等）以外は上書きしない。
    // 入金確認済みや送金完了などの確定ステータスを古い呼び出しが巻き戻さないため。
    if (params.status !== undefined) {
      const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0]
      const statusCol = headers.indexOf('status') + 1
      const current = statusCol > 0 ? String(sheet.getRange(row, statusCol).getValue()) : ''
      if (LIFAI_OPEN_STATUSES.indexOf(current) === -1) {
        // 冪等なno-op: 最終チェック日時だけ更新して成功を返す
        setCellByKey(sheet, row, '最終チェック日時', new Date().toISOString())
        return { ok: true, code: 'UPDATE_OK', data: { request_id: params.request_id } }
      }
    }

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
  } finally {
    lock.releaseLock()
  }
}
