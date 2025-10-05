import {re} from "../core";
export type NumberLocale = "us" | "eu" | "_";
export const defaultLocale: NumberLocale = "us";


export interface NumberPatternParams {
    locale?: NumberLocale;
    // shorthand
    digits?: number;
    decimals?: number;
    // detailed bounds
    minDigits?: number;
    maxDigits?: number;
    minDecimals?: number;
    maxDecimals?: number;
}

/** escape a single char for use inside a character class and elsewhere */
const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Build grouped integer alternatives for a given thousands sep and digit bounds */
function buildGroupedIntegerAlt(
    thousands: string, // already escaped
    minDigits?: number,
    maxDigits?: number
): string | null {
    // If no bounds, allow classic grouping: 1–3 then (sep 3){1,}
    if (minDigits == null && maxDigits == null) {
        return String.raw`\d{1,3}(?:${thousands}\d{3})+`;
    }

    // With bounds, enumerate valid (lead,k) combos where totalDigits = lead + 3*k, k>=1, lead∈[1,3]
    const lo = Math.max(1, minDigits ?? 1);
    const hi = Math.max(lo, maxDigits ?? 99); // sane upper bound
    const alts: string[] = [];

    // k ranges from 1 up to what fits within hi
    const maxK = Math.floor((hi - 1) / 3);
    for (let k = 1; k <= maxK; k++) {
        // lead must keep total within [lo, hi]
        const minLead = Math.max(1, lo - 3 * k);
        const maxLead = Math.min(3, hi - 3 * k);
        for (let lead = minLead; lead <= maxLead; lead++) {
            if (lead >= 1 && lead <= 3) {
                alts.push(String.raw`\d{${lead}}(?:${thousands}\d{3}){${k}}`);
            }
        }
    }
    return alts.length ? `(?:${alts.join("|")})` : null;
}

/** Build ungrouped integer alternative honoring bounds */
function buildUngroupedIntegerAlt(minDigits?: number, maxDigits?: number): string {
    if (minDigits == null && maxDigits == null) return String.raw`\d+`;
    if (minDigits != null && maxDigits != null) return String.raw`\d{${minDigits},${maxDigits}}`;
    if (minDigits != null) return String.raw`\d{${minDigits},}`;
    // only maxDigits
    return String.raw`\d{1,${maxDigits}}`;
}

/** Build decimal tail based on min/max decimals; if maxDecimals===0, forbid decimals. */
function buildDecimalPart(decimal: string, minDecimals?: number, maxDecimals?: number): string {
    if (maxDecimals === 0) return ""; // no decimals allowed
    // determine digit quantifier
    let quant: string;
    if (minDecimals != null && maxDecimals != null) {
        if (minDecimals === 0) {
            // optional decimal with 1..max
            quant = `{1,${maxDecimals}}`;
            return String.raw`(?:${decimal}\d${quant})?`;
        }
        quant = `{${minDecimals},${maxDecimals}}`;
        return String.raw`${decimal}\d${quant}`;
    }
    if (minDecimals != null) {
        if (minDecimals === 0) {
            // optional decimal with 1+ digits
            return String.raw`(?:${decimal}\d+)?`;
        }
        quant = `{${minDecimals},}`;
        return String.raw`${decimal}\d${quant}`;
    }
    if (maxDecimals != null) {
        quant = `{1,${maxDecimals}}`;
        return String.raw`(?:${decimal}\d${quant})?`;
    }
    // default: optional decimal with 1+ digits
    return String.raw`(?:${decimal}\d+)?`;
}

export function buildNumberPatterns({
                                        locale = defaultLocale,
                                        digits,
                                        decimals,
                                        minDigits,
                                        maxDigits,
                                        minDecimals,
                                        maxDecimals,
                                    }: NumberPatternParams = {}) {
    // shorthands pin both min & max
    if (typeof digits === "number") {
        minDigits = digits;
        maxDigits = digits;
    }
    if (typeof decimals === "number") {
        minDecimals = decimals;
        maxDecimals = decimals;
    }

    let thousands: string;
    let decimal: string;
    switch (locale) {
        case "us":
            thousands = ",";
            decimal = ".";
            break;
        case "eu":
            thousands = ".";
            decimal = ",";
            break;
        case "_":
            thousands = "_";
            decimal = ".";
            break;
        default:
            throw new Error(`Unsupported locale: ${locale}`);
    }

    const t = esc(thousands); // escaped sep for regex
    const d = esc(decimal);

    // Integer part: (grouped | ungrouped)
    const grouped = buildGroupedIntegerAlt(t, minDigits, maxDigits);
    const ungrouped = buildUngroupedIntegerAlt(minDigits, maxDigits);
    const intPart = grouped ? `(?:${grouped}|${ungrouped})` : `(?:${ungrouped})`;

    // Decimal tail
    const decPart = buildDecimalPart(d, minDecimals, maxDecimals);

    const sign = String.raw`[+-]?`;

    const INT_PATTERN = new RegExp(`(?<raw>(?<value>${sign}${intPart}))`, 'd').withParsers({
        value:  (s: string) =>  parseInt(s.replace(/\D/g, '')),
        groups: (g: any) => ({raw: g.raw, value: g.value})
    }).template('int');
    const FLOAT_PATTERN = new RegExp(`(?<raw>(?<value>${sign}${intPart}${decPart}))`, 'd').withParsers({
        value: (s: string) => parseFloat(s.replace(thousands,'').replace(decimal, '.').replace(/[^\d\.]/g,'')),
        groups: (g: any) => ({raw: g.raw, value: g.value})
    }).template('float');

    return { INT_PATTERN, FLOAT_PATTERN };
}


// Prebuilt variants -------------------------------------------------------

export const { INT_PATTERN: INT_PATTERN_US, FLOAT_PATTERN: FLOAT_PATTERN_US } =
    buildNumberPatterns({locale: "us"});
export const { INT_PATTERN: INT_PATTERN_EU, FLOAT_PATTERN: FLOAT_PATTERN_EU } =
    buildNumberPatterns({locale: "eu"});
export const { INT_PATTERN: INT_PATTERN_UNDERSCORE, FLOAT_PATTERN: FLOAT_PATTERN_UNDERSCORE } =
    buildNumberPatterns({locale: "_"});
export const { INT_PATTERN, FLOAT_PATTERN: FLOAT_PATTERN } =
    buildNumberPatterns();

// Testers -----------------------------------------------------------------

export function isInt(s: string, locale: NumberLocale = defaultLocale): boolean {
    const { INT_PATTERN } = buildNumberPatterns({locale});
    return re`^${INT_PATTERN}$`.test(s.trim());
}

export function isFloat(s: string, locale: NumberLocale = defaultLocale): boolean {
    const { FLOAT_PATTERN } = buildNumberPatterns({locale});
    return re`^${FLOAT_PATTERN}$`.test(s.trim());
}



function getSeparators(locale: NumberLocale) {
    switch (locale) {
        case "us":
            return { thousands: ",", decimal: "." };
        case "eu":
            return { thousands: ".", decimal: "," };
        case "_":
            return { thousands: "_", decimal: "." }; // underscore style: `_` for thousands, `.` for decimal
        default:
            throw new Error(`Unsupported locale: ${locale}`);
    }
}

// Normalize string: strip thousands, convert decimal to "."
function normalizeNumberString(s: string, locale: NumberLocale): string {
    const { thousands, decimal } = getSeparators(locale);
    let result = s.trim();

    // remove thousands separators
    const reThousands = new RegExp(`\\${thousands}`, "gd");
    result = result.replace(reThousands, "");

    // convert decimal separator to "."
    if (decimal !== ".") {
        const reDecimal = new RegExp(`\\${decimal}`, "gd");
        result = result.replace(reDecimal, ".");
    }

    return result;
}

// ---------- Parsers ----------

export function toInt(s: string, locale: NumberLocale = defaultLocale): number | null {
    const normalized = normalizeNumberString(s, locale);
    const n = parseInt(normalized, 10);
    return Number.isNaN(n) ? null : n;
}

export function toFloat(s: string, locale: NumberLocale = defaultLocale): number | null {
    const normalized = normalizeNumberString(s, locale);
    const n = parseFloat(normalized);
    return Number.isNaN(n) ? null : n;
}

// ---------- Formatter ----------

/**
 * Convert number back to string with proper thousands + decimal separator.
 * Fraction digits are preserved by default, but you can control with `minFraction`/`maxFraction`.
 */
export function numberToString(
    n: number,
    locale: NumberLocale = defaultLocale,
    opts: { minFraction?: number; maxFraction?: number } = {}
): string {
    const { thousands, decimal } = getSeparators(locale);

    const { minFraction = 0, maxFraction = 20 } = opts;

    // Use Intl.NumberFormat where possible
    if (locale === "us" || locale === "eu") {
        return new Intl.NumberFormat(locale === "us" ? "en-US" : "de-DE", {
            minimumFractionDigits: minFraction,
            maximumFractionDigits: maxFraction,
        }).format(n);
    }

    // Manual underscore mode formatting
    const [intPart, fracPart = ""] = n
        .toFixed(Math.min(Math.max(minFraction, 0), maxFraction))
        .split(".");

    // Add underscores every 3 digits
    const withUnderscores = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, "_");

    return fracPart.length > 0 ? `${withUnderscores}${decimal}${fracPart}` : withUnderscores;
}