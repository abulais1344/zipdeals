import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cookie Notice | ZipDeals",
  description: "How ZipDeals uses cookies and similar tracking technologies.",
};

const UPDATED_ON = "03 May 2026";

export default function CookiesPage() {
  return (
    <section className="mx-auto max-w-3xl px-4 py-10 sm:py-12">
      <h1 className="text-2xl font-extrabold text-gray-900 sm:text-3xl">Cookie Notice</h1>
      <p className="mt-2 text-sm text-gray-500">Last updated: {UPDATED_ON}</p>

      <div className="mt-6 space-y-6 text-sm leading-7 text-gray-700">
        <p>
          This notice explains how ZipDeals uses cookies and similar technologies to run and improve the platform.
        </p>

        <section>
          <h2 className="text-base font-semibold text-gray-900">1. What are cookies?</h2>
          <p className="mt-2">
            Cookies are small text files stored on your device. They help websites remember session state and settings.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-gray-900">2. How we use cookies</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>Essential cookies: authentication, security, and session continuity.</li>
            <li>Functional cookies: remember user preferences and convenience settings.</li>
            <li>Analytics cookies: understand traffic and improve user experience.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-semibold text-gray-900">3. Managing cookies</h2>
          <p className="mt-2">
            You can control cookies through browser settings. Blocking essential cookies may affect platform features
            such as login and seller dashboard access.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-gray-900">4. Updates</h2>
          <p className="mt-2">
            We may update this notice periodically. Material changes will be reflected with a revised "Last updated"
            date.
          </p>
        </section>
      </div>
    </section>
  );
}
