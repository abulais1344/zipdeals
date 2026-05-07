import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service | ZipDeals",
  description: "Terms that govern use of ZipDeals by buyers and sellers.",
};

const UPDATED_ON = "03 May 2026";

export default function TermsPage() {
  return (
    <section className="mx-auto max-w-3xl px-4 py-10 sm:py-12">
      <h1 className="text-2xl font-extrabold text-gray-900 sm:text-3xl">Terms of Service</h1>
      <p className="mt-2 text-sm text-gray-500">Last updated: {UPDATED_ON}</p>

      <div className="mt-6 space-y-6 text-sm leading-7 text-gray-700">
        <p>
          These Terms of Service govern your access to and use of ZipDeals. This is a starter template and should be
          reviewed by legal counsel before production use.
        </p>

        <section>
          <h2 className="text-base font-semibold text-gray-900">1. Platform role</h2>
          <p className="mt-2">
            ZipDeals is a marketplace listing platform that connects buyers and sellers. Unless explicitly stated,
            ZipDeals is not the seller of listed goods and is not a party to buyer-seller transactions.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-gray-900">2. Eligibility and accounts</h2>
          <p className="mt-2">
            Users must provide accurate information and comply with applicable laws. Sellers are responsible for account
            security and all actions taken through their account.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-gray-900">3. Listing rules</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>No illegal, counterfeit, unsafe, or prohibited products.</li>
            <li>No misleading descriptions, fake pricing, or false availability.</li>
            <li>Sellers must have authority to list and sell posted inventory.</li>
            <li>ZipDeals may review, reject, edit, or remove listings at its discretion.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-semibold text-gray-900">4. Prohibited conduct</h2>
          <p className="mt-2">
            Users must not abuse, scrape, reverse engineer, interfere with platform operations, or violate third-party
            rights including intellectual property rights.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-gray-900">5. Fees and payments</h2>
          <p className="mt-2">
            Platform fees (if any), taxes, and payment responsibilities will be governed by applicable commercial terms.
            Seller-specific obligations are further described in <Link href="/seller-terms" className="font-medium text-orange-600 hover:text-orange-700">Seller Terms</Link>.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-gray-900">6. Disclaimers and liability</h2>
          <p className="mt-2">
            ZipDeals provides services on an "as is" and "as available" basis. To the fullest extent permitted by law,
            we disclaim warranties and limit liability for indirect, incidental, or consequential damages.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-gray-900">7. Suspension and termination</h2>
          <p className="mt-2">
            We may suspend or terminate access for policy violations, legal risk, or security concerns.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-gray-900">8. Contact and complaints</h2>
          <p className="mt-2">
            For legal notices or complaints, use <Link href="/contact-legal" className="font-medium text-orange-600 hover:text-orange-700">Contact & Grievance</Link>.
          </p>
        </section>
      </div>
    </section>
  );
}
