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
    "&ndash;": "–",
    "&mdash;": "—",
    "&hellip;": "…",

    // Symbols
    "&copy;": "©",
    "&reg;": "®",
    "&trade;": "™",
    "&deg;": "°",

    // Currency
    "&euro;": "€",
    "&pound;": "£",
    "&yen;": "¥",
    "&cent;": "¢",
    "&dollar;": "$", // not official but sometimes appears

    // Math-ish
    "&plusmn;": "±",
    "&times;": "×",
    "&divide;": "÷",
    "&le;": "≤",
    "&ge;": "≥",

    // Accents (very common in text dumps)
    "&aacute;": "á",
    "&eacute;": "é",
    "&iacute;": "í",
    "&oacute;": "ó",
    "&uacute;": "ú",
    "&ntilde;": "ñ",
    "&uuml;": "ü",
};

// Build reverse map (char → entity). If multiple entities map to same char, pick a “preferred” one.
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
