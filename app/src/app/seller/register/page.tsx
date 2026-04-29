import { redirect } from "next/navigation";
import SellerRegisterForm from "@/components/seller/SellerRegisterForm";
import { getSellerSession } from "@/lib/seller-auth";

export default async function SellerRegisterPage() {
  const sellerSession = await getSellerSession();

  if (sellerSession) {
    redirect("/seller/dashboard");
  }

  return <SellerRegisterForm />;
}
