import { redirect } from "next/navigation";
import SellerRegisterForm from "@/components/seller/SellerRegisterForm";
import { getSellerSession } from "@/lib/seller-auth";
import type { Metadata } from "next";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

export default async function SellerRegisterPage() {
  const sellerSession = await getSellerSession();

  if (sellerSession) {
    redirect("/seller/dashboard");
  }

  return <SellerRegisterForm />;
}
