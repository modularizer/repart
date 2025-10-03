import {anything, newLine, space, startLine, line, lookahead} from "../generic";
import {re} from "../core";

export function li(strings: TemplateStringsArray, ...vals: Array<string | number | RegExp>) {
    return re`${startLine}(\s*[\*\-]?\s*)${re(strings, ...vals)}`
}
export function bold(strings: TemplateStringsArray, ...vals: Array<string | number | RegExp>) {
    return re`\*\*${re(strings, ...vals)}\*\*`
}
export const b = bold;


export function italics(strings: TemplateStringsArray, ...vals: Array<string | number | RegExp>) {
    return re`_${re(strings, ...vals)}_`
}
export const i = italics;

export function hx(n: number) {
    return function (strings: TemplateStringsArray, ...vals: Array<string | number | RegExp>) {
        return line`#{${n}}\s+${re(strings, ...vals)}\s*`
    }
}
export function sectionx(n: number) {
    return function (strings: TemplateStringsArray, ...vals: Array<string | number | RegExp>) {
        return re`${startLine}(?<h>#{${n}})\s+(?<key>${re(strings, ...vals)})\s*${newLine}(?<content>${anything})\s*${lookahead`${newLine}(?:#{1,${n}}|---)`}`
    }
}

export const header = line`(?<indentation>#+)\s+(?<header>.*?)`;

export const h1 = hx(1);
export const h2 = hx(2);
export const h3 = hx(3);
export const h4 = hx(4);
export const h5 = hx(5);
export const h6 = hx(6);

export const s1 = sectionx(1);
export const s2 = sectionx(2);
export const s3 = sectionx(3);
export const s4 = sectionx(4);
export const s5 = sectionx(5);
export const s6 = sectionx(6);


export const checkbox = /\[([\sxX])\]/;
export const checkboxChecked = /\[([xX])\]/;
export const checkboxUnchecked = /\[([\s])\]/;

export function checkboxLine (strings: TemplateStringsArray, ...vals: Array<string | number | RegExp>){
    return re`${startLine}\s*(?<full>(?<indentation>${space}[\*\-]?\s*)\[(?<checked>[\sxX])\]\-?\s*(?<value>${re(strings, ...vals)}))\s*`;
}
export const agreement = checkboxLine`\*\*(?<key>.*?)\*\* (?<notes>.*)`;
// [label](url)
export function linkto(strings: TemplateStringsArray, ...vals: Array<string | number | RegExp>) {
    return re`\[\s*(?<label>.*)\s*\]\(\s*(?<url>${re(strings, ...vals)})\s*\)`
}

export const link = linkto`.*`;

export const previewAgreement = li`${checkbox}\-?\s*\*\*(?<key>.*)\*\*\s*(?<pre>.*)${link}(?<post>.*)`;

