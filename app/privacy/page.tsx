import Link from 'next/link'

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginTop: '2rem' }}>
      <h2
        style={{
          fontSize: '1rem',
          fontWeight: 600,
          marginBottom: '0.5rem',
          color: 'var(--text)',
        }}
      >
        {title}
      </h2>
      <div style={{ fontSize: '0.9rem', lineHeight: 1.75, color: 'var(--text-muted)' }}>
        {children}
      </div>
    </div>
  )
}

export default function PrivacyPage() {
  return (
    <div className="page">
      <div className="page-header">
        <div>
          <Link href="/settings" className="settings-back-link">← Settings</Link>
          <h1 className="text-3xl font-semibold tracking-tight heading-display">Privacy Policy</h1>
          <p className="muted">Effective date: April 2025</p>
        </div>
      </div>

      <div className="card settings-card">
        <p style={{ fontSize: '0.9rem', lineHeight: 1.75, color: 'var(--text-muted)' }}>
          Gruves (&ldquo;we&rdquo;, &ldquo;us&rdquo;) takes your privacy seriously. This policy explains what data we
          collect, why we collect it, and how we handle it.
        </p>

        <Section title="What we collect">
          <ul style={{ paddingLeft: '1.25rem', margin: 0 }}>
            <li style={{ marginBottom: '0.4rem' }}>
              <strong style={{ color: 'var(--text)' }}>Account credentials</strong> — your email address and password.
              Passwords are managed by Supabase Auth and are never stored in plain text.
            </li>
            <li style={{ marginBottom: '0.4rem' }}>
              <strong style={{ color: 'var(--text)' }}>App data you create</strong> — songs, setlists, notes, links,
              practice loops, and genres.
            </li>
            <li>
              <strong style={{ color: 'var(--text)' }}>Basic technical data</strong> — IP address and browser type,
              used for security and authentication.
            </li>
          </ul>
        </Section>

        <Section title="Why we collect it">
          <ul style={{ paddingLeft: '1.25rem', margin: 0 }}>
            <li style={{ marginBottom: '0.4rem' }}>To create and manage your account.</li>
            <li style={{ marginBottom: '0.4rem' }}>To store and display your music repertoire.</li>
            <li style={{ marginBottom: '0.4rem' }}>To keep the service secure.</li>
            <li>To improve the product over time.</li>
          </ul>
        </Section>

        <Section title="Who we share it with">
          <p style={{ marginBottom: '0.75rem' }}>
            We work with a small number of trusted infrastructure providers to run the service:
          </p>
          <ul style={{ paddingLeft: '1.25rem', margin: 0 }}>
            <li style={{ marginBottom: '0.4rem' }}>
              <strong style={{ color: 'var(--text)' }}>Supabase</strong> — our database and authentication provider.
              Your data is stored on their servers.
            </li>
            <li>
              <strong style={{ color: 'var(--text)' }}>Vercel</strong> — our hosting provider. They serve the
              application to your browser.
            </li>
          </ul>
          <p style={{ marginTop: '0.75rem' }}>
            We do not sell your data. We do not share it with advertisers. If we add payment processing (e.g. Stripe)
            in the future, this policy will be updated accordingly.
          </p>
        </Section>

        <Section title="How long we keep it">
          <p>
            We keep your data for as long as your account is active. When you delete your account, your songs,
            setlists, notes, and all related data are permanently removed.
          </p>
        </Section>

        <Section title="Your rights">
          <p style={{ marginBottom: '0.75rem' }}>
            You can access and manage your data by logging into your account. You can delete your account and all
            associated data at any time from the{' '}
            <Link href="/settings" style={{ color: 'var(--accent)', textDecoration: 'none' }}>
              Settings page
            </Link>
            .
          </p>
          <p style={{ marginBottom: '0.75rem' }}>
            If you need a copy of your data or have other requests, reach out to us at{' '}
            <a href="mailto:support@gruves.io" style={{ color: 'var(--accent)', textDecoration: 'none' }}>
              support@gruves.io
            </a>
            .
          </p>
          <p>
            If you are in the EU or UK, you have additional rights under GDPR — including the right to rectification,
            portability, and restriction of processing. We will do our best to fulfill those requests promptly.
          </p>
        </Section>

        <Section title="Cookies">
          <p>
            We use cookies solely for authentication and session management via Supabase. We do not use tracking
            cookies, advertising cookies, or any third-party analytics that follows you across other sites.
          </p>
        </Section>

        <Section title="Children">
          <p>
            Gruves is not intended for anyone under the age of 13. We do not knowingly collect data from children. If
            you believe a child has created an account, please contact us and we will remove it.
          </p>
        </Section>

        <Section title="Changes">
          <p>
            We may update this policy from time to time. The effective date at the top of this page reflects when it
            was last revised. Continued use of the service after changes are posted means you accept the updated
            policy.
          </p>
        </Section>

        <Section title="Contact">
          <p>
            Questions or concerns? Email us at{' '}
            <a href="mailto:support@gruves.io" style={{ color: 'var(--accent)', textDecoration: 'none' }}>
              support@gruves.io
            </a>
            .
          </p>
        </Section>
      </div>
    </div>
  )
}
