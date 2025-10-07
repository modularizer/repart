export const htmlEntityToChar: Record<string, string> = {
    // Quotes & apostrophes
    "&#39;": "'",
    "&apos;": "'",
    "&#34;": '"',
    "&quot;": '"',

    // Core escapes
    "&amp;": "&",
    "&lt;": "<",
    "&gt;": ">",

    // Spaces
    "&nbsp;": " ",
    "&ensp;": " ",   // en space
    "&emsp;": " ",   // em space
    "&thinsp;": " ", // thin space

    // Dashes & ellipsis
    "&ndash;": "\u2013",
    "&mdash;": "\u2014",
    "&hellip;": "\u2026",

    // Symbols
    "&copy;": "\u00a9",
    "&reg;": "\u00ae",
    "&trade;": "\u2122",
    "&deg;": "\u00b0",

    // Currency
    "&euro;": "\u20ac",
    "&pound;": "\u00a3",
    "&yen;": "\u00a5",
    "&cent;": "\u00a2",
    "&dollar;": "$", // not official but sometimes appears

    // Math-ish
    "&plusmn;": "\u00b1",
    "&times;": "\u00d7",
    "&divide;": "\u00f7",
    "&le;": "\u2264",
    "&ge;": "\u2265",

    // Accents (very common in text dumps)
    "&aacute;": "\u00e1",
    "&eacute;": "\u00e9",
    "&iacute;": "\u00ed",
    "&oacute;": "\u00f3",
    "&uacute;": "\u00fa",
    "&ntilde;": "\u00f1",
    "&uuml;": "\u00fc",
};

// Build reverse map (char \u2192 entity). If multiple entities map to same char, pick a "preferred" one.
export const charToHtmlEntity: Record<string, string> = {};
for (const key of Object.keys(htmlEntityToChar)) {
    const char = htmlEntityToChar[key];
    if (!(char in charToHtmlEntity)) {
        charToHtmlEntity[char] = key;
    }
}


// ---------- Helpers ----------

export function decodeHtml(s: string): string {
    return s.replace(/&[a-zA-Z#0-9]+;/g, (entity) => htmlEntityToChar[entity] ?? entity);
}

export function encodeHtml(s: string): string {
    return Array.from(s).map((ch) => charToHtmlEntity[ch] ?? ch).join("");
}
