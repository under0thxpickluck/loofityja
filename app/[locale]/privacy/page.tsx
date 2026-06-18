export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold text-[#0b1929] mb-2">Privacy Policy</h1>
      <p className="text-sm text-gray-500 mb-8">
        Effective Date: December 1, 2020 &nbsp;·&nbsp; Last Updated: December 15, 2023
      </p>

      <div className="prose prose-sm max-w-none text-gray-700 space-y-8">
        <p>
          Lootify (hereinafter referred to as &ldquo;the Service&rdquo;, &ldquo;we&rdquo;, &ldquo;our&rdquo;, or &ldquo;us&rdquo;)
          recognizes the importance of protecting personal information and complies with applicable laws and regulations
          regarding personal data protection. We are committed to safeguarding the privacy of all users
          (hereinafter referred to as &ldquo;Users&rdquo;).
        </p>
        <p>
          &ldquo;Personal Information&rdquo; refers to any information that can identify an individual user,
          including but not limited to name, address, phone number, email address, IP address, and other identifiable data.
        </p>

        <Section title="1. Purpose of Collecting Personal Information">
          <p>We collect personal information for the following purposes:</p>
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li>To provide and operate our services</li>
            <li>To communicate with Users regarding updates, notifications, and support</li>
            <li>To process payments and confirm transactions</li>
            <li>To improve and optimize our services through analysis and research</li>
            <li>To customize content and user experience</li>
            <li>To conduct surveys and measure user satisfaction</li>
            <li>To prevent fraud, abuse, or violations of our Terms</li>
            <li>To resolve disputes and technical issues</li>
            <li>To provide information about new features, services, and promotions</li>
          </ul>
          <p className="mt-2">We will clearly indicate any additional purposes at the time of collection.</p>
        </Section>

        <Section title="2. Use of Personal Information">
          <p>
            We will not use personal information beyond the stated purposes unless permitted by law or with user consent.
          </p>
          <p className="mt-2">
            Even after account termination, we may retain and use certain information where necessary for legal compliance,
            fraud prevention, or service improvement.
          </p>
        </Section>

        <Section title="3. Management and Security">
          <p>
            We implement appropriate technical and organizational measures to protect personal information against
            unauthorized access, loss, destruction, or alteration.
          </p>
          <p className="mt-2">
            We strive to keep personal information accurate and up to date within the scope necessary for its intended use.
          </p>
        </Section>

        <Section title="4. Outsourcing">
          <p>
            We may entrust the handling of personal information to third-party service providers. In such cases,
            we ensure appropriate supervision and require them to implement adequate security measures.
          </p>
        </Section>

        <Section title="5. Cookies">
          <p>We use cookies and similar technologies to enhance user experience.</p>
          <p className="mt-2">Cookies are small data files stored on your device. They help us:</p>
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li>Maintain sessions and improve security</li>
            <li>Remember user preferences</li>
            <li>Analyze usage and performance</li>
            <li>Deliver relevant advertisements</li>
          </ul>
          <p className="mt-2">
            Users can disable cookies through browser settings, but doing so may affect certain functionalities.
          </p>
        </Section>

        <Section title="6. Third-Party Data Sharing (External Transmission)">
          <p>We may share certain user data with third-party services for analytics and advertising purposes.</p>
          <div className="mt-3 space-y-3">
            {[
              { name: 'Google Analytics (Google LLC)', data: 'Device info, IP address, browsing behavior', purpose: 'Analytics', url: 'https://policies.google.com/privacy' },
              { name: 'Meta Pixel (Meta Platforms, Inc.)', data: 'Device info, behavior data', purpose: 'Advertising & analytics', url: 'https://www.facebook.com/privacy/policy' },
              { name: 'Google Ads (Google LLC)', data: undefined, purpose: 'Advertising', url: 'https://policies.google.com/privacy' },
              { name: 'Meta Ads (Meta Platforms, Inc.)', data: undefined, purpose: 'Advertising', url: 'https://www.facebook.com/privacy/policy' },
              { name: 'X Ads (X Corp.)', data: undefined, purpose: 'Advertising', url: 'https://twitter.com/en/privacy' },
              { name: 'Microsoft Advertising (Microsoft Corporation)', data: undefined, purpose: 'Advertising', url: 'https://privacy.microsoft.com' },
            ].map((svc) => (
              <div key={svc.name} className="bg-gray-50 border border-gray-200 rounded p-3 text-sm">
                <p className="font-semibold text-gray-800">{svc.name}</p>
                {svc.data && <p className="text-gray-600">Data: {svc.data}</p>}
                <p className="text-gray-600">Purpose: {svc.purpose}</p>
                <a href={svc.url} target="_blank" rel="noopener noreferrer" className="text-sky-500 hover:underline text-xs">
                  Privacy Policy ↗
                </a>
              </div>
            ))}
          </div>
          <p className="mt-3">Users can opt out of tracking via each provider&rsquo;s settings.</p>
        </Section>

        <Section title="7. External Links">
          <p>
            Our Service may contain links to external websites. We are not responsible for the privacy practices
            of such third-party sites.
          </p>
        </Section>

        <Section title="8. Contact">
          <p>For inquiries regarding personal information, please contact us via our contact form.</p>
        </Section>

        <Section title="9. Updates">
          <p>This Privacy Policy may be updated as necessary.</p>
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
