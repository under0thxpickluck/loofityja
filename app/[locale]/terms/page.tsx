export default function TermsPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold text-[#0b1929] mb-2">Terms of Service</h1>
      <p className="text-sm text-gray-500 mb-8">
        Effective Date: December 1, 2020 &nbsp;·&nbsp; Last Updated: April 8, 2025
      </p>

      <div className="text-gray-700 space-y-8 text-sm leading-relaxed">

        <Section title="1. Overview">
          <p>
            These Terms of Service (&ldquo;Terms&rdquo;) govern the use of the online platform Lootify (the &ldquo;Service&rdquo;),
            operated by Lootify Pty Ltd (&ldquo;we&rdquo;, &ldquo;our&rdquo;, or &ldquo;us&rdquo;).
          </p>
          <p className="mt-2">By accessing or using the Service, you agree to be bound by these Terms.</p>
        </Section>

        <Section title="2. Nature of the Service">
          <p>Lootify provides a marketplace platform that enables users to buy and sell digital goods.</p>
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li>We are not a party to transactions between users</li>
            <li>We do not guarantee the quality, legality, or delivery of items</li>
            <li>All transactions are conducted at the user&rsquo;s own risk</li>
          </ul>
          <p className="mt-2">We may intervene in disputes only if deemed necessary.</p>
        </Section>

        <Section title="3. Definitions">
          <dl className="space-y-1 mt-1">
            {[
              ['User', 'Any registered individual or entity using the Service'],
              ['Seller', 'A user listing items for sale'],
              ['Buyer', 'A user purchasing items'],
              ['Digital Goods', 'Accounts, virtual items, codes, or digital assets'],
              ['Transaction', 'Agreement between Buyer and Seller'],
              ['Service Fees', 'Fees charged by Lootify for platform use'],
            ].map(([term, def]) => (
              <div key={term} className="flex gap-2">
                <dt className="font-semibold text-gray-800 min-w-[120px]">{term}:</dt>
                <dd>{def}</dd>
              </div>
            ))}
          </dl>
        </Section>

        <Section title="4. Registration">
          <ul className="list-disc pl-5 space-y-1">
            <li>Users must provide accurate and current information</li>
            <li>We may reject or suspend accounts at our discretion</li>
            <li>Multiple accounts or fraudulent registrations are prohibited</li>
            <li>Users are responsible for maintaining account security</li>
          </ul>
          <p className="mt-2">Minors must have parental consent.</p>
        </Section>

        <Section title="5. Transactions">
          <ul className="list-disc pl-5 space-y-1">
            <li>A transaction is formed when payment is completed</li>
            <li>Sellers must deliver items within a reasonable timeframe</li>
            <li>Buyers must verify items upon receipt</li>
          </ul>
          <p className="mt-2">Lootify is not responsible for disputes between users.</p>
        </Section>

        <Section title="6. Payments">
          <ul className="list-disc pl-5 space-y-1">
            <li>Payments must be completed via approved methods</li>
            <li>Fees may apply depending on payment provider</li>
            <li>Lootify may hold funds for fraud prevention or compliance</li>
            <li>Transfers and payouts, including digital asset disbursements, may require 1–3 business days to process depending on network conditions and internal verification procedures</li>
          </ul>
        </Section>

        <Section title="7. Prohibited Conduct">
          <p>Users must not:</p>
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li>Sell illegal, stolen, or prohibited goods</li>
            <li>Misrepresent products</li>
            <li>Use the platform for fraud or money laundering</li>
            <li>Harass or harm other users</li>
            <li>Attempt to bypass platform systems</li>
            <li>Engage in misleading or deceptive conduct (important under Australian Consumer Law)</li>
          </ul>
        </Section>

        <Section title="8. Compliance with Australian Law 🇦🇺">
          <p>Users must comply with:</p>
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li>Privacy Act 1988 (Cth)</li>
            <li>Australian Consumer Law (ACL)</li>
            <li>Spam Act 2003</li>
            <li>eSafety regulations</li>
          </ul>
          <p className="mt-2">
            Nothing in these Terms excludes rights that cannot be excluded under Australian law.
          </p>
        </Section>

        <Section title="9. Consumer Guarantees">
          <p>Where applicable under Australian Consumer Law:</p>
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li>Users may be entitled to remedies (refund, replacement, etc.)</li>
            <li>Lootify does not exclude statutory consumer rights</li>
          </ul>
        </Section>

        <Section title="10. Suspension &amp; Termination">
          <p>We may suspend or terminate accounts if:</p>
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li>Terms are violated</li>
            <li>Fraud or abuse is suspected</li>
            <li>Required by law</li>
          </ul>
          <p className="mt-2">We are not required to provide reasons.</p>
        </Section>

        <Section title="11. Intellectual Property">
          <p>All platform content is owned by Lootify or its licensors.</p>
          <p className="mt-2">Users may not copy, distribute, or exploit content without permission.</p>
        </Section>

        <Section title="12. Limitation of Liability">
          <p>To the maximum extent permitted by law:</p>
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li>Lootify is not liable for indirect or consequential damages</li>
            <li>Liability is limited to the amount paid to the Service</li>
          </ul>
        </Section>

        <Section title="13. External Services">
          <p>We are not responsible for third-party services linked from the platform.</p>
        </Section>

        <Section title="14. Service Availability">
          <p>We may:</p>
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li>Modify, suspend, or discontinue the Service at any time</li>
            <li>Perform maintenance without prior notice</li>
          </ul>
        </Section>

        <Section title="15. Disputes">
          <p>Users agree to attempt resolution in good faith before legal action.</p>
        </Section>

        <Section title="16. Governing Law">
          <p>These Terms are governed by the laws of Australia.</p>
          <p className="mt-2">Disputes shall be subject to the jurisdiction of Australian courts.</p>
        </Section>

        <Section title="17. Updates">
          <p>We may update these Terms at any time. Continued use constitutes acceptance.</p>
        </Section>

      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-base font-bold text-[#0b1929] border-b border-gray-200 pb-1 mb-3">{title}</h2>
      {children}
    </section>
  )
}
