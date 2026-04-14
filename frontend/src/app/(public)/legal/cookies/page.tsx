import type { Metadata } from "next";
import { Header } from "@/components/landing/Header";
import { Footer } from "@/components/landing/Footer";

export const metadata: Metadata = {
  title: "Cookie Policy | MatCraft",
  description: "How MatCraft uses cookies and how to manage them.",
};

export default function CookiesPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-background pt-24 pb-20">
        <article className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">Cookie Policy</h1>
          <p className="text-sm text-muted-foreground mb-8">Last updated: April 14, 2026</p>

          <section className="text-foreground/90 space-y-4 text-sm leading-relaxed">
            <h2 className="text-2xl font-semibold mt-8">1. What are cookies?</h2>
            <p>Cookies are small text files stored in your browser. We also use localStorage and sessionStorage for similar purposes.</p>

            <h2 className="text-2xl font-semibold mt-8">2. Cookies we use</h2>
            <div className="overflow-x-auto mt-4">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 pr-4 font-semibold">Name</th>
                    <th className="text-left py-2 pr-4 font-semibold">Purpose</th>
                    <th className="text-left py-2 pr-4 font-semibold">Duration</th>
                    <th className="text-left py-2 font-semibold">Type</th>
                  </tr>
                </thead>
                <tbody className="text-foreground/80">
                  <tr className="border-b border-border/50">
                    <td className="py-2 pr-4 font-mono text-xs">next-auth.session-token</td>
                    <td className="py-2 pr-4">Authentication session</td>
                    <td className="py-2 pr-4">30 days</td>
                    <td className="py-2">Essential</td>
                  </tr>
                  <tr className="border-b border-border/50">
                    <td className="py-2 pr-4 font-mono text-xs">matcraft-theme</td>
                    <td className="py-2 pr-4">Light/dark preference</td>
                    <td className="py-2 pr-4">1 year</td>
                    <td className="py-2">Essential</td>
                  </tr>
                  <tr className="border-b border-border/50">
                    <td className="py-2 pr-4 font-mono text-xs">matcraft-consent</td>
                    <td className="py-2 pr-4">Your cookie preferences</td>
                    <td className="py-2 pr-4">12 months</td>
                    <td className="py-2">Essential</td>
                  </tr>
                  <tr className="border-b border-border/50">
                    <td className="py-2 pr-4 font-mono text-xs">_ga, _gid</td>
                    <td className="py-2 pr-4">Google Analytics (anonymized)</td>
                    <td className="py-2 pr-4">2 years</td>
                    <td className="py-2">Analytics</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4 font-mono text-xs">investor_access_token</td>
                    <td className="py-2 pr-4">Investor data room session</td>
                    <td className="py-2 pr-4">24h</td>
                    <td className="py-2">Essential</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h2 className="text-2xl font-semibold mt-8">3. How to manage cookies</h2>
            <p>Use the cookie banner that appears on first visit, or modify preferences anytime in <strong>Settings → Privacy &amp; Security</strong>. Essential cookies cannot be disabled as they are required for the service.</p>
            <p>You can also control cookies through your browser settings. Disabling essential cookies will prevent login.</p>

            <h2 className="text-2xl font-semibold mt-8">4. Third-party cookies</h2>
            <p>Stripe may set cookies during checkout (for fraud prevention). Stripe&apos;s policy: <a href="https://stripe.com/privacy" className="text-primary" target="_blank" rel="noopener noreferrer">stripe.com/privacy</a></p>

            <h2 className="text-2xl font-semibold mt-8">5. Contact</h2>
            <p>Questions? <a href="mailto:privacy@matcraft.ai" className="text-primary">privacy@matcraft.ai</a></p>
          </section>
        </article>
      </main>
      <Footer />
    </>
  );
}
