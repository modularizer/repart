/* match a block comment between triple backticks */
import {re, p, tripleQuote} from "..";


export function htmlComment (strings: TemplateStringsArray, ...vals: Array<string | number | RegExp>) {
    return re`<!--${p(strings, ...vals)}-->`;
}
export function jsBlockComment(strings: TemplateStringsArray, ...vals: Array<string | number | RegExp>) {
    return re`/\*${p(strings, ...vals)}\*/`;
}
export function jsComment(strings: TemplateStringsArray, ...vals: Array<string | number | RegExp>) {
    return re`//${p(strings, ...vals)}`;
}
export function pyComment(strings: TemplateStringsArray, ...vals: Array<string | number | RegExp>) {
    return re`#${p(strings, ...vals)}`;
}
export const pyBlockComment = tripleQuote;

export function sqlComment(strings: TemplateStringsArray, ...vals: Array<string | number | RegExp>) {
    return re`--${p(strings, ...vals)}`;
}