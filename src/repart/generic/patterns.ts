import {re} from "../core";

export const newLine = re`\r?\n`;
export const endLine = re`(?=\r?\n|$)`;
export const startLine = re`(?<![^\r\n])`;
export const any = re`[\s\S]`;
export const anything = re`${any}*?`;

/* match all whitespace other than newlines */
export const space = re`[^\S\r\n]+`;
export const w = re`\w`;
export const word = /[\p{L}\p{N}\p{Pc}\p{M}]+/u;
export const fullword = re`(?<!\p{L})\w+(?!\p{L})`;
export const d = re`\d`;
export const num = re`\d+`;
export const wordBoundary    = re`\b`;
export const notWordBoundary = re`\B`;

