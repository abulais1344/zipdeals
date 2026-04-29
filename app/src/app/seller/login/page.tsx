import { redirect } from "next/navigation";
import SellerLoginForm from "@/components/seller/SellerLoginForm";
import { getSellerSession } from "@/lib/seller-auth";

export default async function SellerLoginPage() {
  const sellerSession = await getSellerSession();

  if (sellerSession) {
    redirect("/seller/dashboard");
  }

  return <SellerLoginForm />;
}
