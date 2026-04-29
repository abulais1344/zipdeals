import { redirect } from "next/navigation";
import { getSellerSession } from "@/lib/seller-auth";

export default async function LoginPage() {
  const sellerSession = await getSellerSession();

  if (sellerSession) {
    redirect("/sell/new");
  }

  redirect("/seller/login");
}
