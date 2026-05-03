import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy | ZipDeals",
  description: "How ZipDeals collects, uses, and protects personal information.",
};

const UPDATED_ON = "03 May 2026";

export default function PrivacyPage() {
  return (
    <section className="mx-auto max-w-3xl px-4 py-10 sm:py-12">
      <h1 className="text-2xl font-extrabold text-gray-900 sm:text-3xl">Privacy Policy</h1>
      <p className="mt-2 text-sm text-gray-500">Last updated: {UPDATED_ON}</p>

      <div className="mt-6 space-y-6 text-sm leading-7 text-gray-700">
        <p>
          This Privacy Policy explains how ZipDeals ("we", "our", "us") collects, uses, stores, and shares
          information when you use our platform. This is a starter policy template and should be reviewed by legal
          counsel before production use.
        </p>

        <section>
          <h2 className="text-base font-semibold text-gray-900">1. Information we collect</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>Account details provided by sellers, such as name, phone number, and business details.</li>
            <li>Listing data, including product descriptions, pricing, photos, city, and category.</li>
            <li>Technical data such as IP address, browser details, and device information.</li>
            <li>Usage data like page visits, listing views, and interaction events.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-semibold text-gray-900">2. How we use data</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>To operate, secure, and improve the platform.</li>
            <li>To verify sellers and moderate listings.</li>
            <li>To provide support, notifications, and service updates.</li>
            <li>To comply with legal obligations and enforce our terms.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-semibold text-gray-900">3. Cookies and session data</h2>
          <p className="mt-2">
            ZipDeals uses cookies and similar technologies for authentication, session management, and analytics.
            Learn more in our <Link href="/cookies" className="font-medium text-orange-600 hover:text-orange-700">Cookie Notice</Link>.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-gray-900">4. Data sharing</h2>
          <p className="mt-2">
            We may share data with service providers that help us run the platform, with authorities when required by
            law, or as part of a business transfer. We do not sell personal data.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-gray-900">5. Data retention and security</h2>
          <p className="mt-2">
            We retain data for as long as necessary for business and legal purposes, then delete or anonymize it.
            We apply reasonable technical and organizational safeguards to protect data.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-gray-900">6. Your rights</h2>
          <p className="mt-2">
            Depending on your location, you may have rights to access, correct, delete, or export your personal data,
            and to object to or restrict certain processing.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-gray-900">7. Contact</h2>
          <p className="mt-2">
            For privacy requests, contact us at <a href="mailto:privacy@zipdeals.in" className="font-medium text-orange-600 hover:text-orange-700">privacy@zipdeals.in</a>. You can also use the details on the <Link href="/contact-legal" className="font-medium text-orange-600 hover:text-orange-700">Contact & Grievance</Link> page.
          </p>
        </section>
      </div>
    </section>
  );
}
