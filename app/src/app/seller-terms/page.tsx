import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Seller Terms | ZipDeals",
  description: "Commercial and compliance terms for sellers using ZipDeals.",
};

const UPDATED_ON = "03 May 2026";

export default function SellerTermsPage() {
  return (
    <section className="mx-auto max-w-3xl px-4 py-10 sm:py-12">
      <h1 className="text-2xl font-extrabold text-gray-900 sm:text-3xl">Seller Terms</h1>
      <p className="mt-2 text-sm text-gray-500">Last updated: {UPDATED_ON}</p>

      <div className="mt-6 space-y-6 text-sm leading-7 text-gray-700">
        <p>
          These Seller Terms apply to businesses and individuals who create listings on ZipDeals. This is a starter
          template and should be reviewed by legal counsel.
        </p>

        <section>
          <h2 className="text-base font-semibold text-gray-900">1. Seller obligations</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>Provide accurate identity and business details.</li>
            <li>Upload truthful listing information and valid inventory details.</li>
            <li>Comply with all applicable laws, taxes, and industry regulations.</li>
            <li>Honor communicated pricing, quantity, and quality commitments.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-semibold text-gray-900">2. Prohibited listings</h2>
          <p className="mt-2">
            Sellers must not list illegal, dangerous, restricted, counterfeit, infringing, or otherwise prohibited
            goods or services.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-gray-900">3. Moderation and enforcement</h2>
          <p className="mt-2">
            ZipDeals may moderate, reject, or remove listings and suspend seller access for policy non-compliance,
            repeated complaints, fraud risk, or legal reasons.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-gray-900">4. Fees, payouts, and taxes</h2>
          <p className="mt-2">
            Any applicable fees, payout schedules, and tax responsibilities will be defined in seller onboarding,
            invoice documents, or separate commercial agreements.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-gray-900">5. Complaints and disputes</h2>
          <p className="mt-2">
            Sellers must reasonably cooperate in complaint investigations, product authenticity checks, and lawful
            information requests.
          </p>
        </section>
      </div>
    </section>
  );
}
