import { redirect } from "next/navigation";
import { getSellerSession } from "@/lib/seller-auth";
import NewListingClient from "./NewListingClient";

export default async function NewListingPage() {
  const sellerSession = await getSellerSession();

  if (!sellerSession) {
    redirect("/seller/login");
  }

  return <NewListingClient sellerName={sellerSession.seller_name} />;
}
