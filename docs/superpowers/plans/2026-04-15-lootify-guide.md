# Lootify Guide Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Lootify の使い方を買い手・売り手の両方に向けて紹介する公開ガイドページ (`/guide`) を実装する。

**Architecture:** サーバーコンポーネントの `app/[locale]/guide/page.tsx` に7セクションをすべてインラインで実装。インタラクションが必要な FAQ のみ `GuideFaqAccordion` として切り出したクライアントコンポーネントにする。画像は `public/images/guide/` に配置し、未配置の間はグレーのプレースホルダー `<div>` で代替。

**Tech Stack:** Next.js 14 App Router, TypeScript, next-intl (server), Tailwind CSS

---

## ファイルマップ

| ファイル | 種別 | 役割 |
|---|---|---|
| `app/[locale]/guide/page.tsx` | 新規 (Server Component) | ガイドページ本体（7セクション全て） |
| `components/GuideFaqAccordion.tsx` | 新規 (Client Component) | FAQ アコーディオン |
| `messages/en.json` | 修正 | トップレベル `guide` セクション追加 |
| `messages/ja.json` | 修正 | トップレベル `guide` セクション追加 |
| `messages/zh.json` | 修正 | トップレベル `guide` セクション追加 |
| `__tests__/GuideFaqAccordion.test.tsx` | 新規 | アコーディオンの開閉動作テスト |
| `public/images/guide/` | 新規ディレクトリ | 画像配置先（初期は空でOK） |

---

## Task 1: i18n メッセージ追加

**Files:**
- Modify: `messages/en.json`
- Modify: `messages/ja.json`
- Modify: `messages/zh.json`

- [ ] **Step 1: messages/en.json にトップレベル `guide` セクションを追加**

`messages/en.json` の末尾の `}` の直前（`"lifai": { ... }` の後）に以下を追加する:

```json
  "guide": {
    "hero": {
      "eyebrow": "HOW IT WORKS",
      "title": "The Fastest Way to Trade Game Items",
      "subtitle": "Buy and sell in-game items, accounts, and currency — safely and instantly.",
      "ctaBrowse": "Browse Listings",
      "ctaSell": "Start Selling"
    },
    "howItWorks": {
      "heading": "How It Works",
      "step1": { "title": "Browse", "desc": "Find listings across your favorite games." },
      "step2": { "title": "Purchase", "desc": "Pay securely and place your order instantly." },
      "step3": { "title": "Receive", "desc": "The seller delivers your item, fast." }
    },
    "buyers": {
      "badge": "For Buyers",
      "heading": "Start Playing in Minutes",
      "step1": { "title": "Create Your Account", "desc": "Sign up in seconds. No credit card required to browse." },
      "step2": { "title": "Browse Game Listings", "desc": "Filter by game, category, and price to find exactly what you need." },
      "step3": { "title": "Place Your Order", "desc": "Choose your item and complete checkout securely." },
      "step4": { "title": "Receive Your Item", "desc": "The seller coordinates delivery. Most orders complete within hours." }
    },
    "sellers": {
      "badge": "For Sellers",
      "heading": "Turn Your Game Assets Into Cash",
      "step1": { "title": "Create Your Account", "desc": "Register and verify your email to start selling." },
      "step2": { "title": "List Your Item", "desc": "Add a title, price, and description — go live instantly." },
      "step3": { "title": "Get Purchased", "desc": "Buyers find your listing and place orders." },
      "step4": { "title": "Deliver & Get Paid", "desc": "Complete the delivery and your earnings are credited to your balance." }
    },
    "trust": {
      "heading": "Why Traders Trust Lootify",
      "card1": { "title": "Secure Payments", "desc": "All payments are encrypted and processed through verified channels." },
      "card2": { "title": "Fast Delivery", "desc": "Most transactions complete within a few hours of purchase." },
      "card3": { "title": "Verified Listings", "desc": "Seller ratings and transaction history keep quality high." }
    },
    "faq": {
      "heading": "Frequently Asked Questions",
      "q1": { "q": "What payment methods are accepted?", "a": "We accept major credit cards and cryptocurrency. Payment options may vary by region." },
      "q2": { "q": "Is it safe to trade on Lootify?", "a": "Yes. Listings are backed by seller ratings and our dispute resolution process protects buyers." },
      "q3": { "q": "How long does delivery take?", "a": "Delivery time depends on the game and seller, but most orders are fulfilled within a few hours." },
      "q4": { "q": "What if I have a problem with my order?", "a": "Contact our support team. We have a dispute resolution process to help resolve issues fairly." },
      "q5": { "q": "How do sellers get paid?", "a": "Once the buyer confirms delivery, earnings are credited to your account balance." }
    },
    "cta": {
      "heading": "Ready to Get Started?",
      "subtitle": "Join thousands of traders buying and selling game items every day.",
      "ctaBrowse": "Browse Listings",
      "ctaSignup": "Create Free Account"
    }
  }
```

- [ ] **Step 2: messages/ja.json にトップレベル `guide` セクションを追加**

`messages/ja.json` の末尾の `}` の直前に以下を追加する:

```json
  "guide": {
    "hero": {
      "eyebrow": "使い方ガイド",
      "title": "ゲームアイテムを最速でトレード",
      "subtitle": "ゲーム内アイテム・アカウント・通貨を安全かつ即時に売買できます。",
      "ctaBrowse": "出品を見る",
      "ctaSell": "出品を始める"
    },
    "howItWorks": {
      "heading": "取引の流れ",
      "step1": { "title": "探す", "desc": "お気に入りのゲームから出品を探す。" },
      "step2": { "title": "購入", "desc": "安全に決済してすぐに注文完了。" },
      "step3": { "title": "受け取る", "desc": "売り手がアイテムを迅速に届ける。" }
    },
    "buyers": {
      "badge": "買い手向け",
      "heading": "数分でプレイ再開",
      "step1": { "title": "アカウントを作成", "desc": "数秒で登録完了。閲覧はクレジットカード不要。" },
      "step2": { "title": "出品を検索", "desc": "ゲーム・カテゴリ・価格で絞り込んで目的のアイテムを見つける。" },
      "step3": { "title": "注文する", "desc": "アイテムを選んで安全に決済。" },
      "step4": { "title": "アイテムを受け取る", "desc": "売り手が配送を調整。多くの注文は数時間以内に完了。" }
    },
    "sellers": {
      "badge": "売り手向け",
      "heading": "ゲーム資産を現金に変える",
      "step1": { "title": "アカウントを作成", "desc": "登録してメール認証を完了すると出品できる。" },
      "step2": { "title": "アイテムを出品", "desc": "タイトル・価格・説明を入力してすぐに公開。" },
      "step3": { "title": "購入される", "desc": "買い手が出品を見つけて注文する。" },
      "step4": { "title": "納品して入金確認", "desc": "配送完了後に収益がアカウント残高に反映される。" }
    },
    "trust": {
      "heading": "Lootify が選ばれる理由",
      "card1": { "title": "安全な決済", "desc": "全決済は暗号化され、認証済みチャンネルで処理される。" },
      "card2": { "title": "迅速な配送", "desc": "多くの取引は購入から数時間以内に完了。" },
      "card3": { "title": "信頼できる出品", "desc": "売り手評価と取引履歴が品質を担保。" }
    },
    "faq": {
      "heading": "よくある質問",
      "q1": { "q": "対応している支払い方法は？", "a": "主要クレジットカードと暗号通貨に対応。地域によって異なる場合があります。" },
      "q2": { "q": "Lootify での取引は安全ですか？", "a": "はい。売り手評価と争議解決プロセスで買い手を保護しています。" },
      "q3": { "q": "配送にどれくらいかかりますか？", "a": "ゲームと売り手によりますが、多くの注文は数時間以内に完了します。" },
      "q4": { "q": "注文にトラブルがあった場合は？", "a": "サポートチームへご連絡ください。争議解決プロセスで公平に対応します。" },
      "q5": { "q": "売り手への入金はいつですか？", "a": "買い手が受け取りを確認すると、収益がアカウント残高に反映されます。" }
    },
    "cta": {
      "heading": "さあ、始めましょう",
      "subtitle": "毎日数千件のゲームアイテム取引が行われるコミュニティに参加しよう。",
      "ctaBrowse": "出品を見る",
      "ctaSignup": "無料で登録"
    }
  }
```

- [ ] **Step 3: messages/zh.json にトップレベル `guide` セクションを追加**

`messages/zh.json` の末尾の `}` の直前に以下を追加する:

```json
  "guide": {
    "hero": {
      "eyebrow": "使用指南",
      "title": "最快速的游戏道具交易平台",
      "subtitle": "安全、即时地买卖游戏道具、账号和货币。",
      "ctaBrowse": "浏览商品",
      "ctaSell": "开始出售"
    },
    "howItWorks": {
      "heading": "交易流程",
      "step1": { "title": "浏览", "desc": "在你喜欢的游戏中找到心仪的商品。" },
      "step2": { "title": "购买", "desc": "安全付款，即时下单完成。" },
      "step3": { "title": "收货", "desc": "卖家迅速交付你的道具。" }
    },
    "buyers": {
      "badge": "买家指南",
      "heading": "几分钟内开始游戏",
      "step1": { "title": "创建账号", "desc": "几秒完成注册，浏览无需信用卡。" },
      "step2": { "title": "浏览商品", "desc": "按游戏、分类和价格筛选，找到你需要的道具。" },
      "step3": { "title": "下单", "desc": "选择道具并安全完成结账。" },
      "step4": { "title": "收取道具", "desc": "卖家协调交付，大多数订单在数小时内完成。" }
    },
    "sellers": {
      "badge": "卖家指南",
      "heading": "将游戏资产变现",
      "step1": { "title": "创建账号", "desc": "注册并完成邮箱验证即可开始出售。" },
      "step2": { "title": "发布商品", "desc": "填写标题、价格和描述，立即上架。" },
      "step3": { "title": "等待购买", "desc": "买家找到你的商品并下单。" },
      "step4": { "title": "交付并收款", "desc": "完成交付后，收益将计入账户余额。" }
    },
    "trust": {
      "heading": "为什么选择 Lootify",
      "card1": { "title": "安全支付", "desc": "所有支付均加密处理，通过认证渠道进行。" },
      "card2": { "title": "快速交付", "desc": "大多数交易在购买后数小时内完成。" },
      "card3": { "title": "可信商品", "desc": "卖家评分和交易记录保障商品质量。" }
    },
    "faq": {
      "heading": "常见问题",
      "q1": { "q": "支持哪些支付方式？", "a": "支持主流信用卡和加密货币，具体选项因地区而异。" },
      "q2": { "q": "在 Lootify 交易安全吗？", "a": "是的。卖家评分和争议解决流程为买家提供保障。" },
      "q3": { "q": "交付需要多长时间？", "a": "取决于游戏和卖家，但大多数订单在数小时内完成。" },
      "q4": { "q": "订单出现问题怎么办？", "a": "请联系我们的客服团队，我们有争议解决流程来公平处理问题。" },
      "q5": { "q": "卖家何时收款？", "a": "买家确认收货后，收益将计入账户余额。" }
    },
    "cta": {
      "heading": "准备好开始了吗？",
      "subtitle": "加入每天进行数千笔游戏道具交易的社区。",
      "ctaBrowse": "浏览商品",
      "ctaSignup": "免费注册"
    }
  }
```

- [ ] **Step 4: ビルドエラーがないか確認**

```bash
npx tsc --noEmit 2>&1 | grep -v "__tests__" | head -20
```

型エラーがないことを確認する。

- [ ] **Step 5: コミット**

```bash
git add messages/en.json messages/ja.json messages/zh.json
git commit -m "feat: add guide i18n messages for en/ja/zh"
```

---

## Task 2: GuideFaqAccordion コンポーネント（TDD）

**Files:**
- Create: `__tests__/GuideFaqAccordion.test.tsx`
- Create: `components/GuideFaqAccordion.tsx`

- [ ] **Step 1: テストファイルを作成**

```typescript
// __tests__/GuideFaqAccordion.test.tsx
import { fireEvent, render, screen } from '@testing-library/react'
import GuideFaqAccordion from '@/components/GuideFaqAccordion'

const items = [
  { q: 'Question 1', a: 'Answer 1' },
  { q: 'Question 2', a: 'Answer 2' },
]

describe('GuideFaqAccordion', () => {
  it('全項目が最初は閉じた状態', () => {
    render(<GuideFaqAccordion items={items} />)
    expect(screen.queryByText('Answer 1')).not.toBeInTheDocument()
    expect(screen.queryByText('Answer 2')).not.toBeInTheDocument()
  })

  it('クリックで項目が展開される', () => {
    render(<GuideFaqAccordion items={items} />)
    fireEvent.click(screen.getByText('Question 1'))
    expect(screen.getByText('Answer 1')).toBeInTheDocument()
  })

  it('同じ項目を再クリックで閉じる', () => {
    render(<GuideFaqAccordion items={items} />)
    fireEvent.click(screen.getByText('Question 1'))
    expect(screen.getByText('Answer 1')).toBeInTheDocument()
    fireEvent.click(screen.getByText('Question 1'))
    expect(screen.queryByText('Answer 1')).not.toBeInTheDocument()
  })

  it('別の項目をクリックすると開いていた項目が閉じる', () => {
    render(<GuideFaqAccordion items={items} />)
    fireEvent.click(screen.getByText('Question 1'))
    expect(screen.getByText('Answer 1')).toBeInTheDocument()
    fireEvent.click(screen.getByText('Question 2'))
    expect(screen.queryByText('Answer 1')).not.toBeInTheDocument()
    expect(screen.getByText('Answer 2')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: テストが失敗することを確認**

```bash
npx jest __tests__/GuideFaqAccordion.test.tsx --no-coverage 2>&1 | tail -10
```

Expected: FAIL（コンポーネントが存在しないため）

- [ ] **Step 3: コンポーネントを実装**

```typescript
// components/GuideFaqAccordion.tsx
'use client'

import { useState } from 'react'

type FaqItem = { q: string; a: string }

export default function GuideFaqAccordion({ items }: { items: FaqItem[] }) {
  const [open, setOpen] = useState<number | null>(null)

  return (
    <div className="space-y-2">
      {items.map((item, i) => (
        <div key={i} className="rounded-xl border border-gray-200 bg-white">
          <button
            className="flex w-full items-center justify-between px-5 py-4 text-left text-sm font-semibold text-[#0b1929]"
            onClick={() => setOpen(open === i ? null : i)}
            aria-expanded={open === i}
          >
            <span>{item.q}</span>
            <span className="ml-4 flex-shrink-0 text-gray-400 text-lg leading-none">
              {open === i ? '−' : '+'}
            </span>
          </button>
          {open === i && (
            <div className="border-t border-gray-100 px-5 py-4 text-sm leading-relaxed text-gray-600">
              {item.a}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
```

- [ ] **Step 4: テストが PASS することを確認**

```bash
npx jest __tests__/GuideFaqAccordion.test.tsx --no-coverage 2>&1 | tail -10
```

Expected: PASS (4 tests)

- [ ] **Step 5: コミット**

```bash
git add components/GuideFaqAccordion.tsx __tests__/GuideFaqAccordion.test.tsx
git commit -m "feat: add GuideFaqAccordion component with accordion behavior"
```

---

## Task 3: ガイドページ本体

**Files:**
- Create: `app/[locale]/guide/page.tsx`

- [ ] **Step 1: 画像ディレクトリを作成**

```bash
mkdir -p public/images/guide
```

- [ ] **Step 2: ページファイルを作成**

```typescript
// app/[locale]/guide/page.tsx
import { getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import GuideFaqAccordion from '@/components/GuideFaqAccordion'

export default async function GuidePage() {
  const t = await getTranslations('guide')

  const faqItems = [
    { q: t('faq.q1.q'), a: t('faq.q1.a') },
    { q: t('faq.q2.q'), a: t('faq.q2.a') },
    { q: t('faq.q3.q'), a: t('faq.q3.a') },
    { q: t('faq.q4.q'), a: t('faq.q4.a') },
    { q: t('faq.q5.q'), a: t('faq.q5.a') },
  ]

  return (
    <div>
      {/* ── 1. Hero ─────────────────────────────────────── */}
      <section className="bg-white">
        <div className="mx-auto max-w-screen-xl px-4 py-16 lg:py-24">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-sky-600">
                {t('hero.eyebrow')}
              </p>
              <h1 className="text-4xl font-extrabold leading-tight text-[#0b1929] lg:text-5xl">
                {t('hero.title')}
              </h1>
              <p className="mt-5 text-base leading-relaxed text-gray-500">
                {t('hero.subtitle')}
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/"
                  className="rounded-lg bg-[#0b1929] px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-[#0d2038]"
                >
                  {t('hero.ctaBrowse')}
                </Link>
                <Link
                  href="/signup"
                  className="rounded-lg border border-[#0b1929] px-6 py-3 text-sm font-bold text-[#0b1929] transition-colors hover:bg-gray-50"
                >
                  {t('hero.ctaSell')}
                </Link>
              </div>
            </div>
            <ImagePlaceholder label="IMAGE-01: Hero illustration" className="aspect-[5/4]" />
          </div>
        </div>
      </section>

      {/* ── 2. How It Works ─────────────────────────────── */}
      <section className="bg-gray-50">
        <div className="mx-auto max-w-screen-xl px-4 py-16">
          <h2 className="mb-10 text-center text-2xl font-bold text-[#0b1929]">
            {t('howItWorks.heading')}
          </h2>
          <div className="grid gap-6 sm:grid-cols-3">
            {([
              { key: 'step1', icon: SearchIcon, num: '01' },
              { key: 'step2', icon: CreditCardIcon, num: '02' },
              { key: 'step3', icon: PackageIcon, num: '03' },
            ] as const).map(({ key, icon: Icon, num }) => (
              <div key={key} className="rounded-2xl border border-gray-200 bg-white p-6 text-center shadow-sm">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-sky-50">
                  <Icon />
                </div>
                <p className="mb-1 text-xs font-bold text-sky-500">{num}</p>
                <p className="text-base font-bold text-[#0b1929]">{t(`howItWorks.${key}.title`)}</p>
                <p className="mt-2 text-sm text-gray-500">{t(`howItWorks.${key}.desc`)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 3. For Buyers ───────────────────────────────── */}
      <section className="bg-white">
        <div className="mx-auto max-w-screen-xl px-4 py-16">
          <div className="mb-10">
            <span className="inline-block rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold uppercase tracking-wide text-emerald-600">
              {t('buyers.badge')}
            </span>
            <h2 className="mt-3 text-3xl font-bold text-[#0b1929]">{t('buyers.heading')}</h2>
          </div>
          <div className="space-y-16">
            {/* Step 1: text left, image right */}
            <div className="grid items-center gap-10 lg:grid-cols-2">
              <StepContent num="01" title={t('buyers.step1.title')} desc={t('buyers.step1.desc')} />
              <ImagePlaceholder label="IMAGE-02: Sign-up screen" className="aspect-video" />
            </div>
            {/* Step 2: image left, text right */}
            <div className="grid items-center gap-10 lg:grid-cols-2">
              <ImagePlaceholder label="IMAGE-03: Listings page" className="aspect-video lg:order-first" />
              <StepContent num="02" title={t('buyers.step2.title')} desc={t('buyers.step2.desc')} />
            </div>
            {/* Step 3: text only */}
            <div className="max-w-lg">
              <StepContent num="03" title={t('buyers.step3.title')} desc={t('buyers.step3.desc')} />
            </div>
            {/* Step 4: text only */}
            <div className="max-w-lg">
              <StepContent num="04" title={t('buyers.step4.title')} desc={t('buyers.step4.desc')} />
            </div>
          </div>
        </div>
      </section>

      {/* ── 4. For Sellers ──────────────────────────────── */}
      <section className="bg-gray-50">
        <div className="mx-auto max-w-screen-xl px-4 py-16">
          <div className="mb-10">
            <span className="inline-block rounded-full bg-sky-50 px-3 py-1 text-xs font-bold uppercase tracking-wide text-sky-600">
              {t('sellers.badge')}
            </span>
            <h2 className="mt-3 text-3xl font-bold text-[#0b1929]">{t('sellers.heading')}</h2>
          </div>
          <div className="space-y-16">
            {/* Step 1: text only */}
            <div className="max-w-lg">
              <StepContent num="01" title={t('sellers.step1.title')} desc={t('sellers.step1.desc')} />
            </div>
            {/* Step 2: text left, image right */}
            <div className="grid items-center gap-10 lg:grid-cols-2">
              <StepContent num="02" title={t('sellers.step2.title')} desc={t('sellers.step2.desc')} />
              <ImagePlaceholder label="IMAGE-04: Listing form" className="aspect-video" />
            </div>
            {/* Step 3: text only */}
            <div className="max-w-lg">
              <StepContent num="03" title={t('sellers.step3.title')} desc={t('sellers.step3.desc')} />
            </div>
            {/* Step 4: image left, text right */}
            <div className="grid items-center gap-10 lg:grid-cols-2">
              <ImagePlaceholder label="IMAGE-05: Payment confirmed" className="aspect-video lg:order-first" />
              <StepContent num="04" title={t('sellers.step4.title')} desc={t('sellers.step4.desc')} />
            </div>
          </div>
        </div>
      </section>

      {/* ── 5. Why Trust Us ─────────────────────────────── */}
      <section className="bg-white">
        <div className="mx-auto max-w-screen-xl px-4 py-16">
          <h2 className="mb-10 text-center text-2xl font-bold text-[#0b1929]">
            {t('trust.heading')}
          </h2>
          <div className="grid gap-6 sm:grid-cols-3">
            {([
              { key: 'card1', icon: ShieldIcon },
              { key: 'card2', icon: BoltIcon },
              { key: 'card3', icon: StarIcon },
            ] as const).map(({ key, icon: Icon }) => (
              <div key={key} className="rounded-2xl border border-gray-200 p-6 text-center shadow-sm">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#0b1929]">
                  <Icon className="text-white" />
                </div>
                <p className="text-base font-bold text-[#0b1929]">{t(`trust.${key}.title`)}</p>
                <p className="mt-2 text-sm text-gray-500">{t(`trust.${key}.desc`)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 6. FAQ ──────────────────────────────────────── */}
      <section className="bg-gray-50">
        <div className="mx-auto max-w-2xl px-4 py-16">
          <h2 className="mb-8 text-center text-2xl font-bold text-[#0b1929]">
            {t('faq.heading')}
          </h2>
          <GuideFaqAccordion items={faqItems} />
        </div>
      </section>

      {/* ── 7. CTA Band ─────────────────────────────────── */}
      <section className="bg-[#0b1929]">
        <div className="mx-auto max-w-screen-xl px-4 py-16 text-center">
          <h2 className="text-3xl font-bold text-white">{t('cta.heading')}</h2>
          <p className="mt-4 text-sm text-gray-400">{t('cta.subtitle')}</p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link
              href="/"
              className="rounded-lg border border-white px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-white hover:text-[#0b1929]"
            >
              {t('cta.ctaBrowse')}
            </Link>
            <Link
              href="/signup"
              className="rounded-lg bg-white px-6 py-3 text-sm font-bold text-[#0b1929] transition-colors hover:bg-gray-100"
            >
              {t('cta.ctaSignup')}
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}

// ── ヘルパーコンポーネント ────────────────────────────────────

function StepContent({ num, title, desc }: { num: string; title: string; desc: string }) {
  return (
    <div>
      <p className="mb-2 text-3xl font-extrabold text-gray-100">{num}</p>
      <h3 className="text-xl font-bold text-[#0b1929]">{title}</h3>
      <p className="mt-3 text-sm leading-relaxed text-gray-500">{desc}</p>
    </div>
  )
}

function ImagePlaceholder({ label, className }: { label: string; className?: string }) {
  return (
    <div
      className={`flex items-center justify-center rounded-2xl bg-gray-100 text-xs text-gray-400 ${className ?? ''}`}
    >
      {label}
    </div>
  )
}

// ── インライン SVG アイコン ───────────────────────────────────

function SearchIcon() {
  return (
    <svg className="h-6 w-6 text-sky-500" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0Z" />
    </svg>
  )
}

function CreditCardIcon() {
  return (
    <svg className="h-6 w-6 text-sky-500" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 4.5 19.5Z" />
    </svg>
  )
}

function PackageIcon() {
  return (
    <svg className="h-6 w-6 text-sky-500" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="m20.25 7.5-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z" />
    </svg>
  )
}

function ShieldIcon({ className }: { className?: string }) {
  return (
    <svg className={`h-6 w-6 ${className ?? ''}`} fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
    </svg>
  )
}

function BoltIcon({ className }: { className?: string }) {
  return (
    <svg className={`h-6 w-6 ${className ?? ''}`} fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="m3.75 13.5 10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75Z" />
    </svg>
  )
}

function StarIcon({ className }: { className?: string }) {
  return (
    <svg className={`h-6 w-6 ${className ?? ''}`} fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" />
    </svg>
  )
}
```

- [ ] **Step 3: 型チェック**

```bash
npx tsc --noEmit 2>&1 | grep "guide/page" | head -20
```

エラーがないことを確認する。

- [ ] **Step 4: コミット**

```bash
git add app/[locale]/guide/page.tsx public/images/guide/.gitkeep
git commit -m "feat: add Lootify guide page with 7 sections and image placeholders"
```

---

## Task 4: 全テスト実行・最終確認

- [ ] **Step 1: テストスイート全体を実行**

```bash
npx jest --no-coverage 2>&1 | tail -10
```

Expected: 全テスト PASS。

- [ ] **Step 2: ビルド確認**

```bash
npm run build 2>&1 | tail -15
```

Expected: エラーなしでビルド完了。

- [ ] **Step 3: 最終コミット（変更があれば）**

```bash
git add .
git commit -m "feat: Lootify guide page complete"
git push origin main
```

---

## 画像配置メモ（実装後に差し替え）

画像が用意できたら `public/images/guide/` に以下の名前で配置し、`page.tsx` の `<ImagePlaceholder>` を `<Image>` に差し替える:

| ファイル名 | 対応箇所 |
|---|---|
| `hero.png` | IMAGE-01 → Buyers Step 1 の右側 |
| `signup.png` | IMAGE-02 → Buyers Step 1 の右側 |
| `listings.png` | IMAGE-03 → Buyers Step 2 の左側 |
| `listing-form.png` | IMAGE-04 → Sellers Step 2 の右側 |
| `payment.png` | IMAGE-05 → Sellers Step 4 の左側 |

差し替えコード例（`ImagePlaceholder` → `Image`）:

```tsx
import Image from 'next/image'

// Before:
<ImagePlaceholder label="IMAGE-02: Sign-up screen" className="aspect-video" />

// After:
<div className="relative aspect-video overflow-hidden rounded-2xl">
  <Image
    src="/images/guide/signup.png"
    alt="Sign-up screen"
    fill
    className="object-cover"
  />
</div>
```
