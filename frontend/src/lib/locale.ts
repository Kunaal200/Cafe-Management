/**
 * Locale data helpers (countries, dial codes, currencies, timezones).
 * Country dataset from `countries-list`; timezone↔country mapping from
 * `countries-and-timezones`; currency display names from the built-in Intl API.
 */
import { countries } from "countries-list";
import { getAllTimezones } from "countries-and-timezones";

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

/** Currency options, deduplicated by currency code.
 * Searchable by currency code, currency name, and every country that uses it. */
export const CURRENCY_OPTIONS: Option[] = (() => {
  const byCurrency = new Map<string, string[]>();
  for (const c of COUNTRIES) {
    if (!c.currency) continue;
    const list = byCurrency.get(c.currency) ?? [];
    list.push(c.name);
    byCurrency.set(c.currency, list);
  }
  return Array.from(byCurrency.entries())
    .map(([code, countryNames]) => {
      const name = currencyName(code);
      return {
        value: code,
        label: `${code} — ${name}`,
        keywords: `${code} ${name} ${countryNames.join(" ")}`.toLowerCase(),
      };
    })
    .sort((a, b) => a.value.localeCompare(b.value));
})();

/** Country options: flag + name. */
export const COUNTRY_OPTIONS: Option[] = COUNTRIES.map((c) => ({
  value: c.code,
  label: `${c.flag} ${c.name}`,
  keywords: `${c.name} ${c.code}`.toLowerCase(),
}));

/** ISO2 -> readable country name, from the same dataset used everywhere else. */
const COUNTRY_NAME_BY_CODE = new Map(COUNTRIES.map((c) => [c.code, c.name]));

/**
 * Timezone options from `countries-and-timezones`. Aliases are dropped to keep
 * the list clean. Each zone is labelled and made searchable by the countries
 * that use it, so searching "india" surfaces "Asia/Kolkata".
 */
export function getTimezoneOptions(): Option[] {
  const zones = Object.values(getAllTimezones());
  return zones
    .filter((z) => !z.aliasOf)
    .map((z) => {
      const countryNames = z.countries
        .map((code) => COUNTRY_NAME_BY_CODE.get(code) ?? code)
        .filter(Boolean);
      const place = z.name.split("/").slice(1).join(" / ").replace(/_/g, " ");
      const countryLabel = countryNames.length ? ` — ${countryNames.join(", ")}` : "";
      return {
        value: z.name,
        label: `(GMT${z.utcOffsetStr}) ${place || z.name}${countryLabel}`,
        keywords: `${z.name} ${countryNames.join(" ")} ${z.utcOffsetStr}`
          .toLowerCase()
          .replace(/_/g, " "),
      };
    })
    .sort((a, b) => a.label.localeCompare(b.label));
}

export function dialCodeFor(countryCode: string): string {
  return COUNTRIES.find((c) => c.code === countryCode)?.dialCode ?? "+1";
}
