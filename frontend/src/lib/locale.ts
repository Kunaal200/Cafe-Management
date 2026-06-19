/**
 * Locale data helpers (countries, dial codes, currencies, timezones).
 * Country dataset from `countries-list`; currency/region names and timezones
 * come from the built-in Intl APIs, so we avoid bundling extra data.
 */
import { countries } from "countries-list";

export interface CountryOption {
  code: string; // ISO2, e.g. "US"
  name: string;
  flag: string; // emoji
  dialCode: string; // e.g. "+1"
  currency: string; // primary currency code, e.g. "USD"
}

/** Turn an ISO2 code into its flag emoji via regional indicator symbols. */
function flagEmoji(code: string): string {
  return code
    .toUpperCase()
    .replace(/./g, (ch) => String.fromCodePoint(127397 + ch.charCodeAt(0)));
}

export const COUNTRIES: CountryOption[] = Object.entries(countries)
  .map(([code, c]) => {
    const phone = Array.isArray(c.phone) ? c.phone[0] : c.phone;
    const currency = Array.isArray(c.currency) ? c.currency[0] : c.currency;
    return {
      code,
      name: c.name,
      flag: flagEmoji(code),
      dialCode: `+${phone}`,
      currency: currency ?? "",
    };
  })
  .sort((a, b) => a.name.localeCompare(b.name));

export function countryName(code: string): string {
  return COUNTRIES.find((c) => c.code === code)?.name ?? code;
}

let currencyDisplay: Intl.DisplayNames | null = null;
function currencyName(code: string): string {
  try {
    currencyDisplay ??= new Intl.DisplayNames(["en"], { type: "currency" });
    return currencyDisplay.of(code) ?? code;
  } catch {
    return code;
  }
}

export interface Option {
  value: string;
  label: string;
  keywords?: string;
}

/** Phone country-code options: flag + country name + dial code. */
export const PHONE_OPTIONS: Option[] = COUNTRIES.map((c) => ({
  value: c.code,
  label: `${c.flag} ${c.dialCode} ${c.name}`,
  keywords: `${c.name} ${c.dialCode} ${c.code}`.toLowerCase(),
}));

/** Currency options derived per country: flag + country + currency code/name. */
export const CURRENCY_OPTIONS: Option[] = COUNTRIES.filter((c) => c.currency).map((c) => ({
  value: c.currency,
  label: `${c.flag} ${c.name} — ${c.currency} (${currencyName(c.currency)})`,
  keywords: `${c.name} ${c.currency} ${currencyName(c.currency)}`.toLowerCase(),
}));

/** Country options: flag + name. */
export const COUNTRY_OPTIONS: Option[] = COUNTRIES.map((c) => ({
  value: c.code,
  label: `${c.flag} ${c.name}`,
  keywords: `${c.name} ${c.code}`.toLowerCase(),
}));

/** All IANA timezones from the runtime (fallback to a small set). */
export function getTimezoneOptions(): Option[] {
  const intl = Intl as unknown as { supportedValuesOf?: (key: string) => string[] };
  let zones: string[];
  try {
    zones = intl.supportedValuesOf ? intl.supportedValuesOf("timeZone") : ["UTC"];
  } catch {
    zones = ["UTC"];
  }
  if (!zones.includes("UTC")) zones = ["UTC", ...zones];
  return zones.map((z) => ({ value: z, label: z, keywords: z.toLowerCase().replace(/_/g, " ") }));
}

export function dialCodeFor(countryCode: string): string {
  return COUNTRIES.find((c) => c.code === countryCode)?.dialCode ?? "+1";
}
