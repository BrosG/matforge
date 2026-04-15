import type { Metadata } from "next";
import { Header } from "@/components/landing/Header";
import { Footer } from "@/components/landing/Footer";

export const metadata: Metadata = {
  title: "Terms of Service | MatCraft",
  description: "Terms of Service for the MatCraft platform.",
};

export default function TermsPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-background pt-24 pb-20">
        <article className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">Terms of Service</h1>
          <p className="text-sm text-muted-foreground mb-8">Last updated: April 15, 2026</p>

          <section className="text-foreground/90 space-y-4 text-sm leading-relaxed">
            <h2 className="text-2xl font-semibold mt-8">1. Acceptance</h2>
            <p>
              The MatCraft platform (matcraft.ai) is operated by <strong>1B RACE</strong>, a French
              SAS (SIREN 945&nbsp;025&nbsp;286, RCS Nîmes), registered office at 199 Chemin de
              Saint-Germain, 30140 Saint-Jean-du-Pin, France. By using MatCraft you agree to these
              Terms. If you do not agree, do not use the service.
            </p>

            <h2 className="text-2xl font-semibold mt-8">2. Account</h2>
            <p>You must be 16 or older, provide accurate information, and keep credentials secure. One account per person.</p>

            <h2 className="text-2xl font-semibold mt-8">3. Acceptable Use</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>No scraping or bulk-downloading beyond API rate limits.</li>
              <li>No reverse-engineering the AI models or pricing logic.</li>
              <li>No resale of credits without a reseller agreement.</li>
              <li>No use for weapons research or activities violating international export controls.</li>
            </ul>

            <h2 className="text-2xl font-semibold mt-8">4. Credits &amp; Payment</h2>
            <p>Credits are prepaid and non-refundable once used. Unused credits expire 12 months after purchase. Subscriptions auto-renew and can be cancelled anytime; credits already granted for the current period remain usable until expiry.</p>

            <h2 className="text-2xl font-semibold mt-8">5. Intellectual Property</h2>
            <p><strong>Your data</strong>: you own all materials, structures, and queries you input. We gain a limited license to process them to provide the service.</p>
            <p><strong>Our platform</strong>: MatCraft code, design, and branding remain our exclusive property.</p>
            <p><strong>AI-generated output</strong>: belongs to you, subject to these Terms. MatCraft makes no claim on your generated structures or AI analyses.</p>

            <h2 className="text-2xl font-semibold mt-8">6. AI Disclaimer</h2>
            <p>AI-generated content (IP Radar analyses, Deep Scan reports, application scores, white-space identification) is <strong>not legal, scientific, or investment advice</strong>. Outputs require expert validation before use in regulated contexts (patents, publications, commercial launches).</p>

            <h2 className="text-2xl font-semibold mt-8">7. Service Availability</h2>
            <p>We aim for 99% uptime but provide the service &quot;as is&quot;. No SLA except Enterprise contracts. Scheduled maintenance is announced 48h in advance.</p>

            <h2 className="text-2xl font-semibold mt-8">8. Termination</h2>
            <p>Either party may terminate at any time. Abuse, fraud, or violation of these Terms results in immediate suspension without refund.</p>

            <h2 className="text-2xl font-semibold mt-8">9. Limitation of Liability</h2>
            <p>Our aggregate liability is limited to the amount you paid in the last 12 months. We are not liable for indirect, incidental, or consequential damages.</p>

            <h2 className="text-2xl font-semibold mt-8">10. Governing Law</h2>
            <p>
              These Terms are governed by French law. Any dispute that cannot be resolved
              amicably will fall under the exclusive jurisdiction of the competent courts of the
              jurisdiction of <strong>Nîmes (Gard, France)</strong>, where 1B RACE is registered.
            </p>

            <h2 className="text-2xl font-semibold mt-8">11. Changes</h2>
            <p>Material changes will be communicated by email with 30 days notice. Continued use constitutes acceptance.</p>
          </section>
        </article>
      </main>
      <Footer />
    </>
  );
}
