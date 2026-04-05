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

export default function TermsPage() {
  return (
    <div className="page">
      <div className="page-header">
        <div>
          <Link href="/settings" className="settings-back-link">← Settings</Link>
          <h1 className="text-3xl font-semibold tracking-tight heading-display">Terms of Service</h1>
          <p className="muted">Effective date: April 2026</p>
        </div>
      </div>

      <div className="card settings-card">
        <p style={{ fontSize: '0.9rem', lineHeight: 1.75, color: 'var(--text-muted)' }}>
          By using Gruves, you agree to these Terms of Service. Please read them — they&apos;re written in plain
          English.
        </p>

        <Section title="The service">
          <p>
            Gruves is a music practice and repertoire management tool. We built it to help musicians organize their
            songs, practice routines, and setlists. We may update, change, or discontinue features over time — we
            will do our best to communicate significant changes in advance.
          </p>
        </Section>

        <Section title="Your account">
          <ul style={{ paddingLeft: '1.25rem', margin: 0 }}>
            <li style={{ marginBottom: '0.4rem' }}>You must be at least 13 years old to create an account.</li>
            <li style={{ marginBottom: '0.4rem' }}>
              You are responsible for keeping your login credentials secure.
            </li>
            <li>You are responsible for any activity that occurs under your account.</li>
          </ul>
        </Section>

        <Section title="What you can do">
          <ul style={{ paddingLeft: '1.25rem', margin: 0 }}>
            <li style={{ marginBottom: '0.4rem' }}>
              Use Gruves for personal music practice and repertoire management.
            </li>
            <li style={{ marginBottom: '0.4rem' }}>Create, edit, and organize your songs and setlists.</li>
            <li>Access the service from any supported device.</li>
          </ul>
        </Section>

        <Section title="What you can't do">
          <ul style={{ paddingLeft: '1.25rem', margin: 0 }}>
            <li style={{ marginBottom: '0.4rem' }}>
              Attempt to reverse engineer, hack, or exploit the service.
            </li>
            <li style={{ marginBottom: '0.4rem' }}>
              Use automated tools to scrape or overload the service.
            </li>
            <li style={{ marginBottom: '0.4rem' }}>Share your account with others for commercial purposes.</li>
            <li>Use the service for any illegal purpose.</li>
          </ul>
        </Section>

        <Section title="Your content">
          <p>
            Your songs, notes, setlists, and other data belong to you. By using Gruves, you grant us a limited
            license to store and display your content solely for the purpose of providing the service. We do not
            claim ownership of your music data.
          </p>
        </Section>

        <Section title="Payments">
          <p>
            Gruves is currently free to use during beta. Paid plans may be introduced in the future. We will update
            these Terms and notify existing users before any billing begins — no surprises.
          </p>
        </Section>

        <Section title="Termination">
          <p>
            You can delete your account at any time from the{' '}
            <Link href="/settings" style={{ color: 'var(--accent)', textDecoration: 'none' }}>
              Settings page
            </Link>
            . We reserve the right to suspend or terminate accounts that violate these Terms.
          </p>
        </Section>

        <Section title="No warranty">
          <p>
            Gruves is provided &ldquo;as is.&rdquo; We do not guarantee the service will always be available,
            error-free, or uninterrupted. We recommend keeping your own backups of anything critical. We are not
            responsible for any data loss.
          </p>
        </Section>

        <Section title="Limitation of liability">
          <p>
            To the fullest extent permitted by law, Gruves is not liable for any indirect, incidental, or
            consequential damages arising from your use of the service.
          </p>
        </Section>

        <Section title="Governing law">
          <p>
            These Terms are governed by the laws of the State of Florida, without regard to its conflict of law
            provisions.
          </p>
        </Section>

        <Section title="Changes">
          <p>
            We may update these Terms from time to time. The effective date at the top of this page reflects when
            they were last revised. Continued use of the service after changes are posted constitutes acceptance of
            the updated Terms.
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
