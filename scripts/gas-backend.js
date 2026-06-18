// ============================================================
//  Lootify – Google Apps Script バックエンド
//  スプレッドシート ID は下の SPREADSHEET_ID に設定済み
// ============================================================

const SPREADSHEET_ID = '1saLEUcSmnUf-J6d-bT63UZeZoqolAmi6XpU7R704C_k'
const SESSION_EXPIRE_HOURS = 24 * 7        // 7日間
const VERIFY_CODE_EXPIRE_MIN = 30          // 確認コード有効期限（分）
const SITE_NAME = 'Lootify'
const SALT = 'lootify_salt_9x2k'           // パスワードハッシュ用ソルト

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
    default:
      return { ok: false, code: 'UNKNOWN_ACTION', message: 'Unknown action: ' + action }
  }
}

// ──────────────────────────────────────────
//  シートユーティリティ
// ──────────────────────────────────────────

const SHEET_HEADERS = {
  Users:            ['id','email','password_hash','display_name','first_name','last_name','country','phone','marketing_opt_in','email_verified','created_at','last_login'],
  Sessions:         ['token','user_id','created_at','expires_at'],
  VerifyCodes:      ['email','code','created_at','expires_at'],
  Purchases:        ['id','user_id','item_id','item_title','item_price','currency','quantity','status','payment_url','created_at'],
  LifaiWallets:     ['slot','wallet_address','label','active'],
  LifaiSellRequests:['request_id','plan','ep_amount','ep_rate_jpy','usdt_rate_jpy','gross_usdt','fee_usdt','net_usdt','source_wallet','payout_network','payout_wallet','platform_wallet','status','created_at'],
}

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

// ──────────────────────────────────────────
//  暗号ユーティリティ
// ──────────────────────────────────────────

function hashPassword(password) {
  const bytes = Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256,
    password + SALT,
    Utilities.Charset.UTF_8
  )
  return bytes.map(b => ('0' + (b & 0xFF).toString(16)).slice(-2)).join('')
}

function newToken() {
  return Utilities.getUuid().replace(/-/g, '') + Utilities.getUuid().replace(/-/g, '')
}

function newCode() {
  return String(Math.floor(100000 + Math.random() * 900000))
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
  usersSheet.appendRow([
    id, email.trim().toLowerCase(), hashPassword(password),
    display_name, first_name || '', last_name || '', country || '',
    phone || '', marketing_opt_in ? 'true' : 'false',
    'false', now, ''
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
      subject: `[${SITE_NAME}] メールアドレスの確認`,
      htmlBody: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
          <h2 style="color:#0b1929">${SITE_NAME} へようこそ</h2>
          <p>${display_name} 様、ご登録ありがとうございます。</p>
          <p>以下の確認コードを入力してください：</p>
          <div style="font-size:36px;font-weight:bold;letter-spacing:8px;color:#0b1929;padding:16px;background:#f0f7ff;border-radius:8px;text-align:center">
            ${code}
          </div>
          <p style="color:#888;font-size:12px">このコードは${VERIFY_CODE_EXPIRE_MIN}分間有効です。</p>
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
      subject: `[${SITE_NAME}] 確認コードの再送信`,
      htmlBody: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
          <h2 style="color:#0b1929">確認コードを再送しました</h2>
          <p>${user.display_name} 様</p>
          <div style="font-size:36px;font-weight:bold;letter-spacing:8px;color:#0b1929;padding:16px;background:#f0f7ff;border-radius:8px;text-align:center">
            ${code}
          </div>
          <p style="color:#888;font-size:12px">有効期限：${VERIFY_CODE_EXPIRE_MIN}分</p>
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
  if (user.password_hash !== hashPassword(password))
    return { ok: false, code: 'INVALID_CREDENTIALS', message: 'メールアドレスまたはパスワードが正しくありません。' }
  if (String(user.email_verified) !== 'true')
    return { ok: false, code: 'EMAIL_NOT_VERIFIED', message: 'メールアドレスの確認が完了していません。' }

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

function createLifaiSellRequest(params) {
  const { request_id, lifai_plan, ep_amount, ep_rate_jpy, usdt_rate_jpy,
          gross_usdt, fee_usdt, net_usdt, source_wallet,
          payout_network, payout_wallet, platform_wallet } = params

  getSheet('LifaiSellRequests').appendRow([
    request_id, lifai_plan, ep_amount, ep_rate_jpy, usdt_rate_jpy,
    gross_usdt, fee_usdt, net_usdt, source_wallet,
    payout_network, payout_wallet, platform_wallet,
    'pending', new Date().toISOString()
  ])

  return { ok: true, code: 'SELL_REQUEST_OK', data: { request_id } }
}
