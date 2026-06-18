import type { JSX, ReactNode } from 'react'
import { Link } from '@/i18n/navigation'

// ──────────────────────────────────────────────────────
// Step illustrations (inline SVG)
// ──────────────────────────────────────────────────────

function IllustLogin() {
  return (
    <svg viewBox="0 0 400 280" className="h-auto w-full" aria-hidden="true">
      <rect width="400" height="280" fill="transparent" />
      {/* Window frame */}
      <rect x="60" y="24" width="280" height="210" rx="16" fill="#0b1929" />
      <rect x="60" y="24" width="280" height="36" rx="16" fill="#1e3a5f" />
      <rect x="60" y="42" width="280" height="18" fill="#1e3a5f" />
      <circle cx="82" cy="42" r="5" fill="#334155" />
      <circle cx="98" cy="42" r="5" fill="#334155" />
      <circle cx="114" cy="42" r="5" fill="#334155" />
      <rect x="134" y="36" width="132" height="14" rx="4" fill="#334155" />
      {/* Avatar */}
      <circle cx="200" cy="100" r="20" fill="#1e3a5f" />
      <circle cx="200" cy="92" r="9" fill="#38bdf8" />
      <path d="M179 122 Q200 110 221 122" fill="#38bdf8" />
      {/* Input fields */}
      <rect x="96" y="138" width="208" height="18" rx="6" fill="#1e3a5f" />
      <rect x="100" y="142" width="80" height="10" rx="3" fill="#334155" />
      <rect x="96" y="164" width="208" height="18" rx="6" fill="#1e3a5f" />
      <rect x="100" y="168" width="60" height="10" rx="3" fill="#334155" />
      {/* Login button */}
      <rect x="116" y="196" width="168" height="26" rx="8" fill="#38bdf8" />
      {/* Shadow ellipse */}
      <ellipse cx="200" cy="266" rx="120" ry="7" fill="#e2e8f0" />
    </svg>
  )
}

function IllustPlan() {
  return (
    <svg viewBox="0 0 400 280" className="h-auto w-full" aria-hidden="true">
      <rect width="400" height="280" fill="transparent" />
      {/* Left card */}
      <rect x="40" y="60" width="86" height="140" rx="12" fill="#e2e8f0" />
      <rect x="52" y="76" width="62" height="8" rx="3" fill="#94a3b8" />
      <rect x="52" y="92" width="46" height="6" rx="3" fill="#cbd5e1" />
      <rect x="52" y="104" width="54" height="6" rx="3" fill="#cbd5e1" />
      <rect x="52" y="116" width="40" height="6" rx="3" fill="#cbd5e1" />
      {/* Center card (selected) */}
      <rect x="156" y="44" width="88" height="168" rx="12" fill="#0b1929" />
      <rect x="168" y="60" width="64" height="8" rx="3" fill="#38bdf8" />
      <rect x="168" y="76" width="48" height="6" rx="3" fill="#475569" />
      <rect x="168" y="88" width="56" height="6" rx="3" fill="#475569" />
      <rect x="168" y="100" width="40" height="6" rx="3" fill="#475569" />
      <rect x="168" y="112" width="52" height="6" rx="3" fill="#475569" />
      <circle cx="200" cy="166" r="16" fill="#38bdf8" />
      <path d="M192 166l6 6 12-12" stroke="#fff" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      {/* Right card */}
      <rect x="274" y="60" width="86" height="140" rx="12" fill="#e2e8f0" />
      <rect x="286" y="76" width="62" height="8" rx="3" fill="#94a3b8" />
      <rect x="286" y="92" width="46" height="6" rx="3" fill="#cbd5e1" />
      <rect x="286" y="104" width="54" height="6" rx="3" fill="#cbd5e1" />
      <rect x="286" y="116" width="40" height="6" rx="3" fill="#cbd5e1" />
      <ellipse cx="200" cy="266" rx="120" ry="7" fill="#e2e8f0" />
    </svg>
  )
}

function IllustWallet() {
  return (
    <svg viewBox="0 0 400 280" className="h-auto w-full" aria-hidden="true">
      <rect width="400" height="280" fill="transparent" />
      {/* Form card */}
      <rect x="40" y="40" width="320" height="184" rx="16" fill="#0b1929" />
      <rect x="40" y="40" width="320" height="48" rx="16" fill="#1e3a5f" />
      <rect x="40" y="68" width="320" height="20" fill="#1e3a5f" />
      {/* TRC20 badge */}
      <rect x="284" y="50" width="60" height="20" rx="6" fill="#1e3250" />
      <rect x="290" y="55" width="48" height="10" rx="3" fill="#38bdf8" opacity="0.5" />
      {/* EP amount field */}
      <rect x="64" y="110" width="80" height="8" rx="3" fill="#475569" />
      <rect x="64" y="124" width="272" height="22" rx="6" fill="#1e3a5f" />
      <rect x="68" y="128" width="56" height="14" rx="3" fill="#334155" />
      {/* Wallet address field */}
      <rect x="64" y="158" width="100" height="8" rx="3" fill="#475569" />
      <rect x="64" y="172" width="272" height="22" rx="6" fill="#1e3a5f" />
      <rect x="68" y="176" width="148" height="14" rx="3" fill="#334155" />
      {/* Cursor */}
      <rect x="220" y="176" width="2" height="14" rx="1" fill="#38bdf8" />
      <ellipse cx="200" cy="266" rx="120" ry="7" fill="#e2e8f0" />
    </svg>
  )
}

function IllustSend() {
  return (
    <svg viewBox="0 0 400 280" className="h-auto w-full" aria-hidden="true">
      <rect width="400" height="280" fill="transparent" />
      {/* EP coin (left) */}
      <circle cx="96" cy="134" r="52" fill="#0b1929" />
      <circle cx="96" cy="134" r="40" fill="#1e3a5f" />
      <circle cx="96" cy="134" r="26" fill="#0b1929" />
      <rect x="80" y="126" width="32" height="5" rx="2" fill="#38bdf8" />
      <rect x="82" y="136" width="28" height="5" rx="2" fill="#38bdf8" opacity="0.6" />
      {/* Arrow */}
      <path d="M158 134 L236 134" stroke="#38bdf8" strokeWidth="5" strokeLinecap="round" />
      <path d="M220 117 L240 134 L220 151" stroke="#38bdf8" strokeWidth="5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      {/* Wallet (right) */}
      <rect x="248" y="98" width="104" height="72" rx="14" fill="#1e3a5f" />
      <rect x="264" y="114" width="72" height="8" rx="3" fill="#334155" />
      <rect x="264" y="128" width="56" height="8" rx="3" fill="#334155" />
      <rect x="264" y="142" width="64" height="8" rx="3" fill="#334155" />
      <rect x="300" y="98" width="52" height="22" rx="8" fill="#0b1929" />
      <rect x="308" y="105" width="36" height="8" rx="3" fill="#38bdf8" opacity="0.5" />
      <ellipse cx="200" cy="266" rx="120" ry="7" fill="#e2e8f0" />
    </svg>
  )
}

function IllustReceive() {
  return (
    <svg viewBox="0 0 400 280" className="h-auto w-full" aria-hidden="true">
      <rect width="400" height="280" fill="transparent" />
      {/* USDT coin */}
      <circle cx="200" cy="114" r="70" fill="#0b1929" />
      <circle cx="200" cy="114" r="56" fill="#1e3a5f" />
      <rect x="183" y="94" width="34" height="6" rx="3" fill="#10b981" />
      <rect x="183" y="106" width="34" height="6" rx="3" fill="#10b981" opacity="0.7" />
      <rect x="183" y="118" width="34" height="6" rx="3" fill="#10b981" opacity="0.5" />
      <rect x="197" y="86" width="6" height="10" rx="2" fill="#10b981" />
      <rect x="197" y="128" width="6" height="10" rx="2" fill="#10b981" />
      {/* Success banner */}
      <rect x="88" y="204" width="224" height="44" rx="12" fill="#d1fae5" />
      <path d="M136 226l10 10 20-20" stroke="#10b981" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="170" y="220" width="116" height="8" rx="3" fill="#6ee7b7" />
      <rect x="170" y="234" width="84" height="6" rx="3" fill="#a7f3d0" />
      <ellipse cx="200" cy="266" rx="120" ry="7" fill="#e2e8f0" />
    </svg>
  )
}

// ──────────────────────────────────────────────────────
// Flow overview icons
// ──────────────────────────────────────────────────────

function IconUser() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
    </svg>
  )
}

function IconList() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M7 9h10M7 12h6M7 15h8" />
    </svg>
  )
}

function IconSend() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7" />
    </svg>
  )
}

function IconCoin() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v10M9 9.5C9 8.1 10.3 7 12 7s3 1.1 3 2.5-1.3 2-3 2.5S9 13.1 9 14.5 10.3 17 12 17s3-1.1 3-2.5" />
    </svg>
  )
}

// ──────────────────────────────────────────────────────
// Data: 詳細ステップ（5ステップ）
// ──────────────────────────────────────────────────────

const DETAIL_STEPS: Array<{ title: string; body: ReactNode; Illustration: () => JSX.Element }> = [
  {
    title: 'アカウント登録・ログイン',
    body: 'Lootifyアカウントをお持ちでない方はまずサインアップ。既存ユーザーはログイン後、LIFAI換金申請ページへお進みください。アカウント認証が完了していないと申請フォームにアクセスできません。',
    Illustration: IllustLogin,
  },
  {
    title: 'プランを選ぶ',
    body: (
      <>
        <span>
          LIFAIゲーム内でご利用のプランに合わせてお選びください。プランにより1EP当たりの換金レートが異なります。
          <strong className="font-semibold text-slate-800">
            プランの選択を誤った場合、換金レートの相違により取引がキャンセルとなる場合がございます。
          </strong>
        </span>
        <div className="mt-4 overflow-hidden rounded-xl border border-slate-200">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-left">
                <th className="px-4 py-2 font-semibold text-slate-700">プラン</th>
                <th className="px-4 py-2 font-semibold text-slate-700">換金レート</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {[
                ['Starter', '0.25 円/EP'],
                ['Builder', '0.2857 円/EP'],
                ['Automation', '0.3333 円/EP'],
                ['Core', '0.40 円/EP'],
                ['Infra', '0.50 円/EP'],
              ].map(([plan, rate]) => (
                <tr key={plan} className="hover:bg-slate-50/60">
                  <td className="px-4 py-2 font-medium text-slate-900">{plan}</td>
                  <td className="px-4 py-2 text-slate-600">{rate}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="border-t border-slate-100 px-4 py-2 text-xs text-slate-500">手数料: 換金額の 8.5%</p>
        </div>
      </>
    ),
    Illustration: IllustPlan,
  },
  {
    title: 'EP数量・受取ウォレットを入力',
    body: '換金したいEP数量を入力してください（最低100EP）。受取ウォレットのネットワークはTRC20のみ対応しています。ウォレットアドレスは一文字でも違うと取り返しがつかないため、必ずコピー＆ペーストで正確に入力してください。',
    Illustration: IllustWallet,
  },
  {
    title: '申請してEPを送金',
    body: (
      <>
        <p>
          申請ボタンを押すと申請番号と{' '}
          <code className="rounded bg-slate-100 px-1 font-mono text-sm">LFW-XXXXXX</code>{' '}
          形式の送金先アドレスが表示されます。LIFAIの「GiftEPを贈る」機能からEPを送金してください。
        </p>
        <ol className="mt-3 list-decimal list-inside space-y-1.5 text-sm">
          <li>LIFAIにログインし、メニューから「GiftEPを贈る」を開く</li>
          <li>
            送信先に表示された{' '}
            <code className="rounded bg-slate-100 px-1 font-mono text-sm">LFW-XXXXXX</code>{' '}
            アドレスをコピー＆ペースト
          </li>
          <li>
            GiftEP数量に申請したEP数量と<strong>完全一致</strong>する数を入力
          </li>
          <li>確認画面で内容を確認し「送信」を押して送金完了</li>
        </ol>
        <p className="mt-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          注意：EP数量は申請時と完全に一致している必要があります。申請後はなるべくお早めに送金してください。
        </p>
      </>
    ),
    Illustration: IllustSend,
  },
  {
    title: 'USDT受取を確認',
    body: 'EP着金確認後、24時間〜72時間以内に申請時に指定したウォレットアドレスへUSDTが送金されます。受取状況はマイページの履歴からご確認いただけます。',
    Illustration: IllustReceive,
  },
]

// ──────────────────────────────────────────────────────
// Data: FAQ
// ──────────────────────────────────────────────────────

const FAQS = [
  {
    q: '手数料はいくらですか？',
    a: '換金額の8.5%が手数料として差し引かれます。申請フォームのシミュレーターで差引後の受取額をご確認いただけます。',
  },
  {
    q: '最低何EPから換金できますか？',
    a: '最低100EP以上から換金申請が可能です。',
  },
  {
    q: '対応ネットワークは？',
    a: '現在はTRC20（TRON）ネットワークのみ対応しています。受取ウォレットはTRC20対応のものをご用意ください。',
  },
  {
    q: 'EPはどのくらいで確認されますか？',
    a: 'ご送金確認後、24時間〜72時間以内に指定のウォレットアドレスへUSDTをお送りします。',
  },
  {
    q: 'ウォレットアドレスを間違えたら？',
    a: '一度送金されたUSDTは取り消しができません。申請前に必ずウォレットアドレスをご確認ください。誤ったアドレスへの送金に対する補償はいたしかねます。',
  },
  {
    q: 'プランはどう選べばいいですか？',
    a: 'LIFAIゲーム内でご利用のプランに合わせてお選びください。プランの選択を誤った場合、換金レートの相違により取引のキャンセルとなる場合がございます。不明な点はお問い合わせください。',
  },
  {
    q: '申請後にEPを送らなかったらどうなる？',
    a: 'ポーリングタイムアウト後にキャンセル扱いとなります。再度申請が必要です。なお「再確認」ボタンで手動確認も可能です。',
  },
  {
    q: '複数の申請を同時にできますか？',
    a: '1件の申請が処理中の間は新規申請はできません。現在の申請が完了してから次の申請をお願いします。',
  },
]

// ──────────────────────────────────────────────────────
// Data: フロー概要（4ステップ）
// ──────────────────────────────────────────────────────

const FLOW_STEPS = [
  {
    Icon: IconUser,
    title: 'アカウント登録・ログイン',
    body: 'Lootifyにアカウント登録またはログインしてください。',
  },
  {
    Icon: IconList,
    title: 'プランとEP数量を選ぶ',
    body: 'LIFAIのプランを確認し、換金したいEP数量を決めます。',
  },
  {
    Icon: IconSend,
    title: '申請してEPを送金',
    body: '申請後に表示される運営ウォレットへEPを正確に送金します。',
  },
  {
    Icon: IconCoin,
    title: 'USDTを受取',
    body: 'EP着金確認後、24〜72時間以内にUSDTが届きます。',
  },
] as const

// ──────────────────────────────────────────────────────
// Page component
// ──────────────────────────────────────────────────────

export default function LifaiGuidePage() {
  return (
    <div className="bg-[linear-gradient(180deg,#f8fbff_0%,#ffffff_20%,#f8fafc_100%)]">

      {/* ── Hero ── */}
      <section className="relative overflow-hidden px-4 pb-16 pt-14 sm:pb-20 sm:pt-20">
        <div className="absolute inset-x-0 top-0 h-[520px] bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.20),_transparent_42%),radial-gradient(circle_at_top_right,_rgba(16,185,129,0.16),_transparent_35%)]" />
        <div className="relative mx-auto max-w-screen-xl">
          <p className="text-sm font-bold uppercase tracking-[0.28em] text-sky-700">LIFAI 換金ガイド</p>
          <h1 className="mt-4 max-w-3xl text-4xl font-extrabold leading-tight text-slate-950 sm:text-5xl lg:text-6xl">
            EPをUSDTに<br />換金する方法
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">
            Lootifyが提供するLIFAI換金サービスでは、ゲーム内で獲得したEPをUSDT（テザー）に換金できます。
            申請から受取まで、このガイドに沿ってお手続きください。
          </p>
          <div className="mt-8">
            <Link
              href="/pc/lifai/sell"
              className="inline-flex items-center justify-center rounded-2xl bg-[#0b1929] px-6 py-3.5 text-sm font-bold text-white transition-colors hover:bg-[#15304d]"
            >
              今すぐ換金申請
            </Link>
          </div>
        </div>
      </section>

      {/* ── フロー概要 ── */}
      <section className="px-4 py-16 sm:py-20">
        <div className="mx-auto max-w-screen-xl">
          <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {FLOW_STEPS.map((step, index) => {
                const { Icon } = step
                return (
                  <div
                    key={step.title}
                    className="rounded-[24px] border border-slate-200 bg-slate-50/80 p-6 transition-transform duration-200 hover:-translate-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                        Step {index + 1}
                      </span>
                      <span className="text-sky-700">
                        <Icon />
                      </span>
                    </div>
                    <p className="mt-4 text-base font-bold text-slate-950">{step.title}</p>
                    <p className="mt-1 text-sm leading-6 text-slate-600">{step.body}</p>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ── 詳細ステップ ── */}
      <section className="px-4 py-16 sm:py-20">
        <div className="mx-auto max-w-screen-xl">
          <p className="text-sm font-bold uppercase tracking-[0.28em] text-sky-700">ステップ詳細</p>
          <h2 className="mt-3 text-3xl font-extrabold text-slate-950 sm:text-4xl">換金の流れ</h2>
          <div className="mt-10 space-y-12">
            {DETAIL_STEPS.map((step, index) => {
              const reverse = index % 2 === 1
              const { Illustration } = step
              return (
                <div
                  key={step.title}
                  className="grid items-center gap-8 rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm lg:grid-cols-[0.95fr_1.05fr] lg:p-8"
                >
                  <div className={reverse ? 'lg:order-2' : undefined}>
                    <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#0b1929] text-sm font-bold text-white shadow-lg shadow-slate-900/10">
                      {index + 1}
                    </div>
                    <h3 className="mt-5 text-2xl font-bold text-slate-950">{step.title}</h3>
                    <div className="mt-3 max-w-xl text-base leading-7 text-slate-600">{step.body}</div>
                  </div>
                  <div
                    className={`relative overflow-hidden rounded-[28px] border border-slate-200/80 bg-white shadow-[0_28px_80px_rgba(15,23,42,0.12)]${reverse ? ' lg:order-1' : ''}`}
                  >
                    <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-sky-50 to-transparent" />
                    <Illustration />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="border-t border-slate-200 px-4 py-16 sm:py-20">
        <div className="mx-auto max-w-4xl">
          <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <h2 className="text-3xl font-extrabold text-slate-950">よくある質問</h2>
            <div className="mt-8 divide-y divide-slate-200">
              {FAQS.map((faq) => (
                <details key={faq.q} className="group py-5">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-left font-bold text-slate-950">
                    <span>{faq.q}</span>
                    <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border border-slate-200 text-xl text-slate-400 transition-transform group-open:rotate-45">
                      +
                    </span>
                  </summary>
                  <p className="mt-4 max-w-3xl leading-7 text-slate-600">{faq.a}</p>
                </details>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="px-4 pb-20 pt-4">
        <div className="mx-auto max-w-screen-xl overflow-hidden rounded-[36px] bg-[#0b1929] px-6 py-12 text-white shadow-[0_32px_100px_rgba(11,25,41,0.28)] sm:px-10">
          <div className="grid items-center gap-8 lg:grid-cols-[1fr_auto]">
            <div>
              <h2 className="text-3xl font-extrabold sm:text-4xl">換金を始めよう</h2>
              <p className="mt-3 max-w-2xl leading-7 text-slate-300">
                EPをUSDTに換金する準備ができたら、今すぐ申請ページへ。
              </p>
            </div>
            <Link
              href="/pc/lifai/sell"
              className="inline-flex items-center justify-center rounded-2xl bg-white px-6 py-3.5 text-sm font-bold text-[#0b1929] transition-colors hover:bg-slate-100"
            >
              今すぐ換金申請する
            </Link>
          </div>
        </div>
      </section>

    </div>
  )
}
