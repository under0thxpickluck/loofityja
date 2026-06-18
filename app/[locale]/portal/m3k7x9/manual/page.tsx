import type { Metadata } from 'next'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export const metadata: Metadata = {
  title: '運営マニュアル',
  robots: { index: false, follow: false },
}

const COOKIE_NAME = '__prtl_k'
const COOKIE_VALUE = 'lifai-ops-granted'

const EP_RATES = [
  { plan: 'starter',    label: 'Starter',    rate: 0.25,   minEp: 100 },
  { plan: 'builder',    label: 'Builder',    rate: 0.2857, minEp: 100 },
  { plan: 'automation', label: 'Automation', rate: 0.3333, minEp: 100 },
  { plan: 'core',       label: 'Core',       rate: 0.4,    minEp: 100 },
  { plan: 'infra',      label: 'Infra',      rate: 0.5,    minEp: 100 },
] as const

const FEE_RATE = 0.085

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-12">
      <h2 className="mb-6 border-b-2 border-[#0b1929] pb-2 text-2xl font-bold text-[#0b1929]">{title}</h2>
      {children}
    </section>
  )
}

function InfoBox({ color, title, children }: { color: 'blue' | 'amber' | 'green' | 'red'; title?: string; children: React.ReactNode }) {
  const styles = {
    blue:  'border-sky-200 bg-sky-50 text-sky-900',
    amber: 'border-amber-200 bg-amber-50 text-amber-900',
    green: 'border-emerald-200 bg-emerald-50 text-emerald-900',
    red:   'border-red-200 bg-red-50 text-red-900',
  }
  return (
    <div className={`rounded-xl border p-4 text-sm ${styles[color]}`}>
      {title && <p className="mb-1 font-bold">{title}</p>}
      {children}
    </div>
  )
}

function FlowStep({ num, label, sub }: { num: number | string; label: string; sub?: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-[#0b1929] text-sm font-bold text-white">
        {num}
      </div>
      <div>
        <p className="font-semibold text-gray-900">{label}</p>
        {sub && <p className="mt-0.5 text-xs text-gray-500">{sub}</p>}
      </div>
    </div>
  )
}

function Arrow() {
  return (
    <div className="ml-4 flex h-6 items-center">
      <svg width="2" height="24" viewBox="0 0 2 24" fill="none">
        <line x1="1" y1="0" x2="1" y2="24" stroke="#cbd5e1" strokeWidth="2" strokeDasharray="4 2" />
      </svg>
    </div>
  )
}

function SystemDiagram() {
  return (
    <svg viewBox="0 0 700 260" className="w-full rounded-2xl border border-gray-200 bg-white" aria-label="システム構成図">
      {/* ユーザー */}
      <rect x="20" y="90" width="110" height="80" rx="12" fill="#f0f9ff" stroke="#7dd3fc" strokeWidth="1.5" />
      <text x="75" y="122" textAnchor="middle" fontSize="13" fontWeight="700" fill="#0c4a6e">ユーザー</text>
      <text x="75" y="140" textAnchor="middle" fontSize="10" fill="#0369a1">ブラウザ</text>
      <text x="75" y="156" textAnchor="middle" fontSize="10" fill="#0369a1">（Next.js）</text>

      {/* Next.js App */}
      <rect x="185" y="50" width="150" height="160" rx="12" fill="#f8fafc" stroke="#94a3b8" strokeWidth="1.5" />
      <text x="260" y="78" textAnchor="middle" fontSize="12" fontWeight="700" fill="#0f172a">Next.js App</text>
      <text x="260" y="95" textAnchor="middle" fontSize="10" fill="#64748b">App Router</text>

      <rect x="200" y="108" width="120" height="28" rx="6" fill="#e0f2fe" stroke="#7dd3fc" strokeWidth="1" />
      <text x="260" y="127" textAnchor="middle" fontSize="10" fill="#0c4a6e">フロントエンド</text>

      <rect x="200" y="148" width="120" height="28" rx="6" fill="#dcfce7" stroke="#86efac" strokeWidth="1" />
      <text x="260" y="167" textAnchor="middle" fontSize="10" fill="#14532d">API Routes</text>

      {/* 矢印 ユーザー → Next.js */}
      <line x1="130" y1="130" x2="183" y2="130" stroke="#94a3b8" strokeWidth="1.5" markerEnd="url(#arrow)" />
      <text x="156" y="124" textAnchor="middle" fontSize="9" fill="#64748b">HTTPS</text>

      {/* GAS */}
      <rect x="400" y="50" width="135" height="80" rx="12" fill="#fefce8" stroke="#fde047" strokeWidth="1.5" />
      <text x="467" y="80" textAnchor="middle" fontSize="12" fontWeight="700" fill="#713f12">Google</text>
      <text x="467" y="97" textAnchor="middle" fontSize="12" fontWeight="700" fill="#713f12">Apps Script</text>
      <text x="467" y="113" textAnchor="middle" fontSize="10" fill="#92400e">バックエンドAPI</text>

      {/* Google Sheets */}
      <rect x="400" y="155" width="135" height="60" rx="12" fill="#f0fdf4" stroke="#86efac" strokeWidth="1.5" />
      <text x="467" y="181" textAnchor="middle" fontSize="12" fontWeight="700" fill="#14532d">Google</text>
      <text x="467" y="198" textAnchor="middle" fontSize="12" fontWeight="700" fill="#14532d">Sheets</text>
      <text x="467" y="212" textAnchor="middle" fontSize="9" fill="#166534">データストア</text>

      {/* CoinGecko */}
      <rect x="570" y="50" width="110" height="55" rx="12" fill="#fdf4ff" stroke="#e879f9" strokeWidth="1.5" />
      <text x="625" y="74" textAnchor="middle" fontSize="11" fontWeight="700" fill="#581c87">CoinGecko</text>
      <text x="625" y="90" textAnchor="middle" fontSize="10" fill="#7e22ce">USD/JPY</text>
      <text x="625" y="104" textAnchor="middle" fontSize="9" fill="#7e22ce">レートAPI</text>

      {/* 矢印 API → GAS */}
      <line x1="335" y1="162" x2="398" y2="90" stroke="#94a3b8" strokeWidth="1.5" markerEnd="url(#arrow)" />

      {/* 矢印 GAS → Sheets */}
      <line x1="467" y1="131" x2="467" y2="153" stroke="#94a3b8" strokeWidth="1.5" markerEnd="url(#arrow)" />

      {/* 矢印 API → CoinGecko */}
      <line x1="335" y1="130" x2="568" y2="72" stroke="#94a3b8" strokeWidth="1.5" markerEnd="url(#arrow)" />

      <defs>
        <marker id="arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
          <path d="M0,0 L0,6 L8,3 z" fill="#94a3b8" />
        </marker>
      </defs>
    </svg>
  )
}

function CashoutFlowDiagram() {
  const boxes = [
    { x: 20,  label: '①フォーム入力', sub: 'プラン/EP量/ウォレット' },
    { x: 185, label: '②確認チェック', sub: '3項目にチェック' },
    { x: 350, label: '③申請送信', sub: 'API /lifai/sell-request' },
    { x: 515, label: '④GAS保存', sub: 'リクエストID発行' },
  ]

  return (
    <svg viewBox="0 0 680 180" className="w-full rounded-2xl border border-gray-200 bg-white" aria-label="換金フロー（前半）">
      {boxes.map((b, i) => (
        <g key={b.x}>
          <rect x={b.x} y="40" width="140" height="60" rx="10" fill={i === 2 ? '#dbeafe' : '#f8fafc'} stroke={i === 2 ? '#93c5fd' : '#cbd5e1'} strokeWidth="1.5" />
          <text x={b.x + 70} y="66" textAnchor="middle" fontSize="12" fontWeight="700" fill="#0f172a">{b.label}</text>
          <text x={b.x + 70} y="83" textAnchor="middle" fontSize="10" fill="#64748b">{b.sub}</text>
          {i < boxes.length - 1 && (
            <line x1={b.x + 141} y1="70" x2={b.x + 183} y2="70" stroke="#94a3b8" strokeWidth="1.5" markerEnd="url(#arrowB)" />
          )}
        </g>
      ))}

      {/* 下段: ユーザーへ返却 → EP送金 → 入金確認 → 完了 */}
      <rect x="515" y="120" width="140" height="50" rx="10" fill="#f0fdf4" stroke="#86efac" strokeWidth="1.5" />
      <text x="585" y="142" textAnchor="middle" fontSize="12" fontWeight="700" fill="#14532d">⑤LFWアドレス</text>
      <text x="585" y="158" textAnchor="middle" fontSize="10" fill="#166534">ユーザーに表示</text>

      <rect x="350" y="120" width="140" height="50" rx="10" fill="#fff7ed" stroke="#fed7aa" strokeWidth="1.5" />
      <text x="420" y="142" textAnchor="middle" fontSize="12" fontWeight="700" fill="#7c2d12">⑥EP送金</text>
      <text x="420" y="158" textAnchor="middle" fontSize="10" fill="#9a3412">ユーザーがゲーム内送金</text>

      <rect x="185" y="120" width="140" height="50" rx="10" fill="#f0f9ff" stroke="#7dd3fc" strokeWidth="1.5" />
      <text x="255" y="142" textAnchor="middle" fontSize="12" fontWeight="700" fill="#0c4a6e">⑦入金確認</text>
      <text x="255" y="158" textAnchor="middle" fontSize="10" fill="#0369a1">30秒ポーリング×10回</text>

      <rect x="20" y="120" width="140" height="50" rx="10" fill="#dcfce7" stroke="#86efac" strokeWidth="1.5" />
      <text x="90" y="142" textAnchor="middle" fontSize="12" fontWeight="700" fill="#14532d">⑧USDT送金</text>
      <text x="90" y="158" textAnchor="middle" fontSize="10" fill="#166534">運営が手動で送金</text>

      {/* 縦矢印 ④→⑤ */}
      <line x1="585" y1="101" x2="585" y2="118" stroke="#94a3b8" strokeWidth="1.5" markerEnd="url(#arrowB)" />
      {/* ⑤→⑥ */}
      <line x1="513" y1="145" x2="492" y2="145" stroke="#94a3b8" strokeWidth="1.5" markerEnd="url(#arrowB)" />
      {/* ⑥→⑦ */}
      <line x1="348" y1="145" x2="327" y2="145" stroke="#94a3b8" strokeWidth="1.5" markerEnd="url(#arrowB)" />
      {/* ⑦→⑧ */}
      <line x1="183" y1="145" x2="162" y2="145" stroke="#94a3b8" strokeWidth="1.5" markerEnd="url(#arrowB)" />

      <defs>
        <marker id="arrowB" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
          <path d="M0,0 L0,6 L8,3 z" fill="#94a3b8" />
        </marker>
      </defs>
    </svg>
  )
}

export default async function OpsManualPage() {
  const cookieStore = await cookies()
  if (cookieStore.get(COOKIE_NAME)?.value !== COOKIE_VALUE) {
    redirect('/portal/m3k7x9/login')
  }
  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <div className="mx-auto max-w-screen-lg px-4 py-12">

        {/* ヘッダー */}
        <div className="mb-10 rounded-2xl border border-[#0b1929]/20 bg-[#0b1929] px-8 py-8 text-white">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-slate-400">INTERNAL — 社外秘</p>
          <h1 className="mt-3 text-3xl font-extrabold">RMTサイト 運営マニュアル</h1>
          <p className="mt-2 text-sm text-slate-300">サイト仕様 &amp; LIFAI換金対応手順書 ／ 最終更新: 2026-06</p>
          <div className="mt-5 flex flex-wrap gap-3 text-xs">
            <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1">Next.js 14 App Router</span>
            <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1">Google Apps Script</span>
            <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1">USDT換金</span>
            <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1">手数料 8.5%</span>
          </div>
        </div>

        {/* 目次 */}
        <div className="mb-10 rounded-xl border border-gray-200 bg-white p-5">
          <p className="mb-3 text-sm font-bold text-gray-700">目次</p>
          <ol className="space-y-1 text-sm text-sky-700">
            <li><a href="#overview" className="hover:underline">1. サイト概要・仕様</a></li>
            <li><a href="#tech" className="hover:underline">2. システム構成・技術スタック</a></li>
            <li><a href="#pages" className="hover:underline">3. ページ・機能一覧</a></li>
            <li><a href="#lifai" className="hover:underline">4. LIFAIシステム詳細</a></li>
            <li><a href="#cashout-flow" className="hover:underline">5. 換金フロー（フロー図付き）</a></li>
            <li><a href="#admin" className="hover:underline">6. 運営側の対応手順</a></li>
            <li><a href="#checklist" className="hover:underline">7. 対応チェックリスト</a></li>
            <li><a href="#trouble" className="hover:underline">8. トラブルシュート</a></li>
          </ol>
        </div>

        {/* 1. サイト概要 */}
        <Section title="1. サイト概要・仕様">
          <div className="grid gap-4 md:grid-cols-2">
            <InfoBox color="blue" title="サイトの目的">
              <ul className="mt-1 space-y-1 text-sm">
                <li>・ゲームアイテム・通貨の売買仲介（RMT）</li>
                <li>・LIFAIゲームのEP（ポイント）を USDTに換金する「LIFAI換金」サービス</li>
                <li>・多言語対応（日本語・英語）</li>
              </ul>
            </InfoBox>
            <InfoBox color="green" title="主要ユーザーフロー">
              <ul className="mt-1 space-y-1 text-sm">
                <li>① 会員登録 → メール認証</li>
                <li>② ログイン → プロフィール確認</li>
                <li>③ ゲームアイテムを購入 または</li>
                <li>③ LIFAI EP を売却（換金）</li>
              </ul>
            </InfoBox>
          </div>
        </Section>

        {/* 2. システム構成 */}
        <Section title="2. システム構成・技術スタック">
          <div className="mb-6">
            <p className="mb-3 text-sm font-semibold text-gray-700">システム構成図</p>
            <SystemDiagram />
          </div>

          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">レイヤー</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">技術</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">役割</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                <tr>
                  <td className="px-4 py-3 font-medium text-gray-900">フロントエンド</td>
                  <td className="px-4 py-3 text-gray-600">Next.js 14 + Tailwind CSS</td>
                  <td className="px-4 py-3 text-gray-600">UI・ページルーティング（App Router）</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-medium text-gray-900">API層</td>
                  <td className="px-4 py-3 text-gray-600">Next.js API Routes</td>
                  <td className="px-4 py-3 text-gray-600">バリデーション・GAS中継・レート取得</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-medium text-gray-900">バックエンド</td>
                  <td className="px-4 py-3 text-gray-600">Google Apps Script (GAS)</td>
                  <td className="px-4 py-3 text-gray-600">ユーザー認証・売却申請の保存・検索</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-medium text-gray-900">データストア</td>
                  <td className="px-4 py-3 text-gray-600">Google Sheets</td>
                  <td className="px-4 py-3 text-gray-600">ユーザー情報・申請履歴の永続化</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-medium text-gray-900">外部API</td>
                  <td className="px-4 py-3 text-gray-600">CoinGecko API</td>
                  <td className="px-4 py-3 text-gray-600">USDT/JPYリアルタイムレート取得</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-medium text-gray-900">国際化</td>
                  <td className="px-4 py-3 text-gray-600">next-intl</td>
                  <td className="px-4 py-3 text-gray-600">日本語（/ja）・英語（/en）切り替え</td>
                </tr>
              </tbody>
            </table>
          </div>
        </Section>

        {/* 3. ページ一覧 */}
        <Section title="3. ページ・機能一覧">
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">URL</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">ページ名</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">認証</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {[
                  ['/ja/', 'トップページ', '不要'],
                  ['/ja/category', 'カテゴリ一覧', '不要'],
                  ['/ja/item/[id]', '商品詳細', '不要'],
                  ['/ja/checkout/[itemId]', '購入チェックアウト', '必要'],
                  ['/ja/pc/lifai/sell', 'LIFAI換金申請', '必要'],
                  ['/ja/account/profile', 'マイページ・履歴', '必要'],
                  ['/ja/account/settings', 'アカウント設定', '必要'],
                  ['/ja/login', 'ログイン', '不要'],
                  ['/ja/signup', '会員登録', '不要'],
                  ['/ja/verify-email', 'メール認証', '不要'],
                  ['/ja/guide', '使い方ガイド', '不要'],
                  ['/ja/contact', 'お問い合わせ', '不要'],
                  ['/ja/terms', '利用規約', '不要'],
                  ['/ja/privacy', 'プライバシーポリシー', '不要'],
                ].map(([url, name, auth]) => (
                  <tr key={url}>
                    <td className="px-4 py-2.5 font-mono text-xs text-gray-600">{url}</td>
                    <td className="px-4 py-2.5 text-gray-900">{name}</td>
                    <td className="px-4 py-2.5">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${auth === '必要' ? 'bg-amber-100 text-amber-800' : 'bg-gray-100 text-gray-600'}`}>
                        {auth}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>

        {/* 4. LIFAIシステム詳細 */}
        <Section title="4. LIFAIシステム詳細">
          <div className="mb-6 grid gap-4 md:grid-cols-3">
            <InfoBox color="blue" title="対象ゲーム">
              <p className="mt-1 text-sm">LIFAI（ブロックチェーンゲーム）のEP（Energy Point）をUSDTに換金するサービス。</p>
            </InfoBox>
            <InfoBox color="green" title="対応ネットワーク">
              <ul className="mt-1 space-y-0.5 text-sm">
                <li>・TRC20（Tron）</li>
                <li>・ERC20（Ethereum）</li>
                <li>・BEP20（BSC）</li>
              </ul>
            </InfoBox>
            <InfoBox color="amber" title="ウォレットローテーション">
              <p className="mt-1 text-sm">受取ウォレット（LFW）は<strong>6時間ごと</strong>に自動ローテーション。GASから取得。</p>
            </InfoBox>
          </div>

          <p className="mb-3 text-sm font-semibold text-gray-700">プラン別換金レート</p>
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">プラン</th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-700">EP単価（円）</th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-700">1,000 EPの目安（円）</th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-700">手数料（8.5%）後の目安</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {EP_RATES.map((r) => {
                  const gross = 1000 * r.rate
                  const net = gross * (1 - FEE_RATE)
                  return (
                    <tr key={r.plan}>
                      <td className="px-4 py-3 font-semibold text-gray-900">{r.label}</td>
                      <td className="px-4 py-3 text-right font-mono text-gray-700">¥{r.rate}</td>
                      <td className="px-4 py-3 text-right font-mono text-gray-700">¥{gross.toFixed(0)}</td>
                      <td className="px-4 py-3 text-right font-mono font-semibold text-emerald-700">
                        ¥{net.toFixed(0)} <span className="text-xs text-gray-400">相当のUSDT</span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm">
            <p className="font-semibold text-gray-700">換金額の計算式</p>
            <div className="mt-2 space-y-1 font-mono text-xs text-gray-600">
              <p>gross_jpy = EP量 × EP単価（円）</p>
              <p>gross_usdt = gross_jpy ÷ USDT/JPYレート（CoinGeckoリアルタイム）</p>
              <p>fee_usdt = gross_usdt × 0.085</p>
              <p className="font-bold text-gray-900">net_usdt = gross_usdt − fee_usdt　← ユーザーが受け取る額</p>
            </div>
          </div>
        </Section>

        {/* 5. 換金フロー */}
        <Section title="5. 換金フロー（フロー図付き）">
          <div className="mb-6">
            <p className="mb-3 text-sm font-semibold text-gray-700">換金処理フロー全体図</p>
            <CashoutFlowDiagram />
          </div>

          <div className="space-y-6">
            <div>
              <p className="mb-3 text-sm font-bold text-gray-800">▼ ユーザー側の操作手順（8ステップ）</p>
              <div className="rounded-xl border border-gray-200 bg-white p-5 space-y-3">
                <FlowStep num={1} label="ログイン後、/pc/lifai/sell へアクセス" />
                <Arrow />
                <FlowStep num={2} label="プランを選択" sub="Starter / Builder / Automation / Core / Infra" />
                <Arrow />
                <FlowStep num={3} label="EP量を入力（最低100EP〜）" sub="右パネルにリアルタイムでUSDT換算額が表示される" />
                <Arrow />
                <FlowStep num={4} label="受取ネットワークとウォレットアドレスを入力" sub="TRC20 / ERC20 / BEP20 のいずれかを選択" />
                <Arrow />
                <FlowStep num={5} label="3つの確認チェックボックスにチェック" sub="プラン確認・送金確認・ウォレット確認" />
                <Arrow />
                <FlowStep num={6} label="「申請する」ボタンを押して送信" sub="API /api/lifai/sell-request へPOSTされる" />
                <Arrow />
                <FlowStep num={7} label="申請完了画面に「LFWアドレス」が表示される" sub="このアドレスへゲーム内でEPを送金する" />
                <Arrow />
                <FlowStep num={8} label="EP送金後、入金確認されたら手続き完了" sub="最大5分（30秒×10回）ポーリングで自動確認。タイムアウト後は運営が手動で確認" />
              </div>
            </div>

            <InfoBox color="amber" title="ユーザーが注意すべき点">
              <ul className="mt-1 space-y-1 text-sm">
                <li>・LFWアドレスは6時間で変わるため、表示されたアドレスに即日送金する</li>
                <li>・誤ったウォレットに送金した場合は復旧不可</li>
                <li>・申請後のキャンセルは不可（EP送金前に申請内容を必ず確認）</li>
              </ul>
            </InfoBox>
          </div>
        </Section>

        {/* 6. 運営側の対応手順 */}
        <Section title="6. 運営側の対応手順">
          <div className="space-y-6">
            <div className="rounded-xl border border-gray-200 bg-white p-5">
              <p className="mb-4 text-sm font-bold text-gray-800">申請受付後の運営対応フロー</p>
              <div className="space-y-3">
                <FlowStep num="A" label="GASスプレッドシートで新しい申請を確認" sub="シート「lifai_sell_requests」に自動追記される。request_id / status / EP量 / net_usdt を確認" />
                <Arrow />
                <FlowStep num="B" label="ユーザーのLFWウォレットへのEP着金を確認" sub="ゲーム管理画面 または Lootifyの残高確認ツールで入金を照合" />
                <Arrow />
                <FlowStep num="C" label="net_usdt 分のUSDTをユーザーの受取ウォレットへ送金" sub="payout_network と payout_wallet の値を使う。送金ミスは取り返しがつかないので二重確認必須" />
                <Arrow />
                <FlowStep num="D" label="GASスプレッドシートのstatusを「completed」に更新" sub="更新後、ユーザーのマイページ（/account/profile）の履歴に反映される" />
              </div>
            </div>

            <InfoBox color="blue" title="GASスプレッドシートの列構成（lifai_sell_requests シート）">
              <div className="mt-2 overflow-x-auto">
                <table className="min-w-full text-xs">
                  <thead>
                    <tr className="border-b border-sky-200">
                      {['request_id', 'lifai_plan', 'ep_amount', 'ep_rate_jpy', 'usdt_rate_jpy', 'gross_usdt', 'fee_usdt', 'net_usdt', 'source_wallet', 'payout_network', 'payout_wallet', 'platform_wallet', 'status', 'created_at'].map(col => (
                        <th key={col} className="pr-4 py-1 text-left font-mono font-semibold text-sky-800">{col}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      {['LIFAI-XXXXXX', 'starter', '1000', '0.25', '155.20', '1.6108', '0.1369', '1.4739', 'ウォレット', 'TRC20', 'Txxxx...', 'LFWアドレス', 'pending', '2026-06-15T...'].map(v => (
                        <td key={v} className="pr-4 py-1 font-mono text-sky-700">{v}</td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            </InfoBox>

            <InfoBox color="red" title="重要：送金前の必須確認事項">
              <ul className="mt-1 space-y-1 text-sm">
                <li>① <strong>payout_network</strong> と <strong>payout_wallet</strong> の両方を確認（ネットワーク不一致で資産喪失）</li>
                <li>② <strong>net_usdt</strong> の値で送金（gross_usdt でも fee_usdt でもない）</li>
                <li>③ EP着金確認前には絶対にUSDT送金しない</li>
                <li>④ 同一申請に2度送金しないよう status を必ず確認</li>
              </ul>
            </InfoBox>
          </div>
        </Section>

        {/* 7. チェックリスト */}
        <Section title="7. 対応チェックリスト">
          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <p className="mb-4 text-sm font-semibold text-gray-700">申請1件ごとの処理チェックリスト</p>
            <div className="space-y-2 text-sm">
              {[
                'GASシートで申請を確認（request_id、EP量、net_usdt、payout_network、payout_wallet）',
                'ユーザーのLFWアドレス（platform_wallet）へのEP着金をゲーム管理画面で確認',
                'EP着金量が申請のep_amountと一致することを確認',
                'payout_networkを確認（TRC20 / ERC20 / BEP20）',
                'payout_walletへnet_usdt分のUSDTを送金',
                '送金TXハッシュを記録（任意）',
                'GASシートのstatusを「completed」に更新',
                'ユーザーからの問い合わせがあれば対応済みとして返信',
              ].map((item, i) => (
                <label key={i} className="flex items-start gap-3 rounded-lg border border-gray-100 bg-gray-50 px-4 py-2.5 hover:bg-gray-100">
                  <input type="checkbox" className="mt-0.5 h-4 w-4 flex-shrink-0 accent-[#0b1929]" />
                  <span className="text-gray-700">{item}</span>
                </label>
              ))}
            </div>
          </div>
        </Section>

        {/* 8. トラブルシュート */}
        <Section title="8. トラブルシュート">
          <div className="space-y-4">
            {[
              {
                q: 'CoinGecko APIエラーで換金レートが取得できない',
                a: 'APIサーバーが一時的に落ちている場合がある。数分後にリトライ。ユーザーには「しばらく時間をおいて再試行してください」と案内する。レート取得失敗時は申請処理自体をブロックする（502エラーを返す）ので二重申請は発生しない。',
              },
              {
                q: 'EPの入金がシステムに検知されない（タイムアウト）',
                a: 'ポーリングは30秒×10回（最大5分）。タイムアウト後は「確認に時間がかかっています」と表示される。GASで手動確認し、着金が確認できれば通常通りUSDT送金を行う。',
              },
              {
                q: 'GASスプレッドシートに申請が保存されていない',
                a: 'API Routeから GASへの通信エラーの可能性。Next.jsのサーバーログを確認。GAS側のWebアプリURLの有効期限切れまたはスクリプト実行権限の問題が多い。GAS側のデプロイを再確認する。',
              },
              {
                q: 'ユーザーが誤ったウォレットアドレスを入力して申請した',
                a: '原則キャンセル不可。EP未送金であれば申請は無効扱いにしてstatusを「cancelled」に更新。EP送金済みの場合はユーザーの責任であり返金不可の旨をコンタクトフォーム経由で案内する。',
              },
              {
                q: 'LFWウォレットがローテーションされ申請後に変わってしまった',
                a: 'ウォレットは6時間ごとにスロットが切り替わる。申請完了画面に表示されたアドレスに送金するよう案内している。申請時点のplatform_walletがGASに保存されているため、その値を正として処理する。',
              },
            ].map(({ q, a }) => (
              <details key={q} className="group rounded-xl border border-gray-200 bg-white">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 text-sm font-semibold text-gray-900">
                  <span>Q: {q}</span>
                  <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full border border-gray-200 text-lg text-gray-400 transition-transform group-open:rotate-45">+</span>
                </summary>
                <div className="border-t border-gray-100 px-5 pb-4 pt-3 text-sm leading-7 text-gray-600">
                  A: {a}
                </div>
              </details>
            ))}
          </div>
        </Section>

        {/* フッター */}
        <div className="rounded-xl border border-gray-200 bg-white p-4 text-center text-xs text-gray-400">
          このページは検索エンジンにインデックスされません。URLを外部に共有しないでください。
        </div>
      </div>
    </div>
  )
}
