import { createAdminClient } from "@/lib/supabase/admin";

function normalizePhone(phone: string | null | undefined): string {
  return String(phone ?? "").replace(/\D/g, "");
}

export async function getSellerProfileHrefMap(
  phones: Array<string | null | undefined>
): Promise<Record<string, string>> {
  const inputPhones = Array.from(new Set(phones.map((phone) => String(phone ?? "")).filter(Boolean)));
  const normalizedInputPhones = Array.from(new Set(inputPhones.map(normalizePhone).filter(Boolean)));

  if (normalizedInputPhones.length === 0) {
    return {};
  }

  const supabase = createAdminClient();
  const { data: exactSellers, error: exactError } = await supabase
    .from("sellers")
    .select("id, phone")
    .in("phone", inputPhones);

  if (exactError) {
    return {};
  }

  const result: Record<string, string> = {};
  const normalizedPhoneToHref = new Map<string, string>();

  for (const seller of exactSellers ?? []) {
    const href = `/sellers/${seller.id}`;
    const normalizedSellerPhone = normalizePhone(seller.phone);
    if (normalizedSellerPhone) {
      normalizedPhoneToHref.set(normalizedSellerPhone, href);
      result[String(seller.phone)] = href;
    }
  }

  const unresolvedNormalizedPhones = normalizedInputPhones.filter(
    (phone) => !normalizedPhoneToHref.has(phone)
  );

  if (unresolvedNormalizedPhones.length === 0) {
    return result;
  }

  const { data: sellers, error } = await supabase
    .from("sellers")
    .select("id, phone")
    .limit(1000);

  if (error || !sellers) {
    return result;
  }

  for (const seller of sellers) {
    const normalizedSellerPhone = normalizePhone(seller.phone);
    if (normalizedSellerPhone) {
      normalizedPhoneToHref.set(normalizedSellerPhone, `/sellers/${seller.id}`);
    }
  }

  for (const phone of phones) {
    const normalizedPhone = normalizePhone(phone);
    if (!normalizedPhone) {
      continue;
    }

    const href = normalizedPhoneToHref.get(normalizedPhone);
    if (href) {
      result[String(phone)] = href;
    }
  }

  return result;
}

export async function getSellerProfileHref(phone: string | null | undefined): Promise<string | null> {
  const map = await getSellerProfileHrefMap([phone]);
  return map[String(phone ?? "")] ?? null;
}
