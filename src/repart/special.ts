// ——— Special characters & meanings ———
export type SpecialChar =
    | "." | "^" | "$" | "*" | "+" | "?" | "(" | ")" | "[" | "]"
    | "{" | "}" | "|" | "\\" | "/" | "-";

export const SpecialCharMeanings: Record<SpecialChar, string> = {
    ".": "Any single character (except newline unless /s)",
    "^": "Start of string (or line with /m)",
    "$": "End of string (or line with /m)",
    "*": "Quantifier: 0 or more",
    "+": "Quantifier: 1 or more",
    "?": "Quantifier: 0 or 1; also makes quantifiers lazy",
    "(": "Start capturing group",
    ")": "End capturing group",
    "[": "Start character class",
    "]": "End character class",
    "{": "Start quantifier with bounds",
    "}": "End quantifier with bounds",
    "|": "Alternation (OR)",
    "\\": "Escape next character / special sequences",
    "/": "Delimiter in regex literals (not special in RegExp constructor)",
    "-": "Range indicator inside character classes (e.g., [a-z])",
};


export const allSpecialChars: SpecialChar[] = [
    ".", "^", "$", "*", "+", "?", "(", ")", "[", "]",
    "{", "}", "|", "\\", "/", "-"
];

export const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");