
export function formatCurrency(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === "") return "-";
  const n = Number(value);
  if (Number.isNaN(n)) return "-";
  const trim = (x: number) => x.toFixed(2).replace(/\.?0+$/, "");
  if (n >= 10000000) return `₹${trim(n / 10000000)} Cr`;
  if (n >= 100000) return `₹${trim(n / 100000)} L`;
  return `₹${new Intl.NumberFormat("en-IN").format(n)}`;
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return "-";
  const d = new Date(value.length === 10 ? `${value}T00:00:00` : value);
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export function todayISO(): string {
  return new Date().toLocaleDateString("en-CA"); // YYYY-MM-DD in local time
}

///new lines///

export function whatsappLink(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  const full = digits.length === 10 ? `91${digits}` : digits;
  return `https://wa.me/${full}`;
}