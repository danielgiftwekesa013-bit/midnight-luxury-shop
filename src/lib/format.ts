export function ksh(amount: number): string {
  return `KSh ${Math.round(amount).toLocaleString("en-KE")}`;
}

export function pts(amount: number): string {
  return amount.toLocaleString("en-KE");
}

/** Normalize a Kenyan phone number to 2547XXXXXXXX / 2541XXXXXXXX form. */
export function normalizePhone(input: string): string {
  const digits = input.replace(/\D/g, "");
  if (digits.startsWith("254")) return digits;
  if (digits.startsWith("0")) return `254${digits.slice(1)}`;
  if (digits.length === 9) return `254${digits}`;
  return digits;
}

export function isValidPhone(input: string): boolean {
  const p = normalizePhone(input);
  return /^254[17]\d{8}$/.test(p);
}

/** Auth uses a deterministic internal address derived from the phone number. */
export function phoneToAuthEmail(input: string): string {
  return `${normalizePhone(input)}@nova.app`;
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-KE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}
