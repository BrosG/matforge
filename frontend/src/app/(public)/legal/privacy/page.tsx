import type { Metadata } from "next";
import { Header } from "@/components/landing/Header";
import { Footer } from "@/components/landing/Footer";

export const metadata: Metadata = {
  title: "Privacy Policy | MatCraft",
  description: "How MatCraft collects, uses, and protects your data. GDPR-compliant.",
};

export default function PrivacyPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-background pt-24 pb-20">
        <article className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 prose prose-slate dark:prose-invert">
          <h1 className="text-4xl font-bold text-foreground mb-2">Privacy Policy</h1>
          <p className="text-sm text-muted-foreground mb-8">Last updated: April 15, 2026</p>

          <section className="text-foreground/90 space-y-4 text-sm leading-relaxed">
            <h2 className="text-2xl font-semibold mt-8">1. Data Controller</h2>
            <p>
              The data controller for matcraft.ai is{" "}
              <strong>1B RACE</strong>, a French SAS (SIREN 945&nbsp;025&nbsp;286), registered office at
              199 Chemin de Saint-Germain, 30140 Saint-Jean-du-Pin, France. Director of publication:
              Bruno BROS, President. For any privacy inquiry, contact{" "}
              <a href="mailto:privacy@matcraft.ai" className="text-primary">privacy@matcraft.ai</a>.
            </p>

            <h2 className="text-2xl font-semibold mt-8">2. Data We Collect</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Account data</strong>: email, name, hashed password, OAuth provider ID.</li>
              <li><strong>Usage data</strong>: searches, campaigns, credit transactions, IP addresses, browser info.</li>
              <li><strong>Payment data</strong>: handled entirely by Stripe. We store only customer ID and invoice references.</li>
              <li><strong>Technical cookies</strong>: session tokens, theme preference, consent state.</li>
            </ul>

            <h2 className="text-2xl font-semibold mt-8">3. Legal Basis (GDPR Art. 6)</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Contract</strong>: processing account data to provide the service.</li>
              <li><strong>Legitimate interest</strong>: anonymized analytics to improve the platform.</li>
              <li><strong>Consent</strong>: marketing emails, non-essential cookies.</li>
              <li><strong>Legal obligation</strong>: tax records, compliance with court orders.</li>
            </ul>

            <h2 className="text-2xl font-semibold mt-8">4. How We Use Your Data</h2>
            <p>To provide the service, process payments, send service notifications, detect abuse, and comply with legal obligations. We do <strong>not</strong> sell personal data.</p>

            <h2 className="text-2xl font-semibold mt-8">5. Data Sharing</h2>
            <p>We share data only with infrastructure providers strictly necessary to operate:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Google Cloud Platform</strong> (hosting, database) — Dublin, Ireland</li>
              <li><strong>Stripe</strong> (payments) — Dublin, Ireland</li>
              <li><strong>Google Gemini API</strong> (AI analysis) — US/EU region</li>
            </ul>

            <h2 className="text-2xl font-semibold mt-8">6. Data Retention</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>Account data: until deletion request + 30 day grace period</li>
              <li>Transaction records: 10 years (French tax law)</li>
              <li>Technical logs: 90 days</li>
              <li>Anonymized analytics: unlimited</li>
            </ul>

            <h2 className="text-2xl font-semibold mt-8">7. Your GDPR Rights</h2>
            <p>You have the right to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Access</strong> — export all your data via /dashboard/settings</li>
              <li><strong>Rectification</strong> — edit your profile anytime</li>
              <li><strong>Erasure</strong> — delete your account (30-day grace period)</li>
              <li><strong>Portability</strong> — export as JSON</li>
              <li><strong>Object</strong> — opt out of analytics/marketing</li>
              <li><strong>Restrict processing</strong> — contact privacy@matcraft.ai</li>
              <li><strong>Lodge a complaint</strong> — CNIL (cnil.fr) for France, or your national data protection authority</li>
            </ul>

            <h2 className="text-2xl font-semibold mt-8">8. International Transfers</h2>
            <p>Data may be processed outside the EU by our providers. We rely on Standard Contractual Clauses (SCCs) for all transfers.</p>

            <h2 className="text-2xl font-semibold mt-8">9. Cookies</h2>
            <p>See our <a href="/legal/cookies" className="text-primary">Cookie Policy</a>.</p>

            <h2 className="text-2xl font-semibold mt-8">10. Changes</h2>
            <p>We will notify users of material changes by email at least 30 days in advance.</p>
          </section>
        </article>
      </main>
      <Footer />
    </>
  );
}
