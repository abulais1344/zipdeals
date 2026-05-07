import { redirect } from "next/navigation";
import SellerLoginForm from "@/components/seller/SellerLoginForm";
import { getSellerSession } from "@/lib/seller-auth";
import type { Metadata } from "next";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

export default async function SellerLoginPage() {
  const sellerSession = await getSellerSession();

  if (sellerSession) {
    redirect("/seller/dashboard");
  }

  return <SellerLoginForm />;
}
