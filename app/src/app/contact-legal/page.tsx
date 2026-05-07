import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact & Grievance | ZipDeals",
  description: "Legal, grievance, privacy, and rights-request contact details for ZipDeals.",
};

const UPDATED_ON = "03 May 2026";

export default function ContactLegalPage() {
  return (
    <section className="mx-auto max-w-3xl px-4 py-10 sm:py-12">
      <h1 className="text-2xl font-extrabold text-gray-900 sm:text-3xl">Contact & Grievance</h1>
      <p className="mt-2 text-sm text-gray-500">Last updated: {UPDATED_ON}</p>

      <div className="mt-6 space-y-6 text-sm leading-7 text-gray-700">
        <p>
          Use the contacts below for legal notices, grievance submissions, privacy requests, and IP complaints.
          Replace placeholder details with your official production contacts.
        </p>

        <section className="rounded-xl border border-gray-200 bg-white p-4">
          <h2 className="text-base font-semibold text-gray-900">General legal contact</h2>
          <p className="mt-2">Email: <a href="mailto:legal@zipdeals.in" className="font-medium text-orange-600 hover:text-orange-700">legal@zipdeals.in</a></p>
          <p>Subject line: Legal Notice - ZipDeals</p>
        </section>

        <section className="rounded-xl border border-gray-200 bg-white p-4">
          <h2 className="text-base font-semibold text-gray-900">Privacy and data requests</h2>
          <p className="mt-2">Email: <a href="mailto:privacy@zipdeals.in" className="font-medium text-orange-600 hover:text-orange-700">privacy@zipdeals.in</a></p>
          <p>Include account phone/email, request type (access/correction/deletion), and supporting details.</p>
        </section>

        <section className="rounded-xl border border-gray-200 bg-white p-4">
          <h2 className="text-base font-semibold text-gray-900">Grievance officer (placeholder)</h2>
          <p className="mt-2">Name: [Add officer name]</p>
          <p>Email: [Add official grievance email]</p>
          <p>Postal address: [Add business address]</p>
          <p>Initial response target: within 48 hours. Resolution target: within 15 days.</p>
        </section>

        <section className="rounded-xl border border-gray-200 bg-white p-4">
          <h2 className="text-base font-semibold text-gray-900">IP / copyright complaint</h2>
          <p className="mt-2">Email: <a href="mailto:ip@zipdeals.in" className="font-medium text-orange-600 hover:text-orange-700">ip@zipdeals.in</a></p>
          <p>Provide listing URL, rights owner details, and evidence of ownership/authorization.</p>
        </section>
      </div>
    </section>
  );
}
