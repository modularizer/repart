/* match a block comment between triple backticks */
import {re} from "../re";
import {p} from "./templates";

function wrapped(group: string, groupname: string = 'wrapper'){
    return function (strings: TemplateStringsArray, ...vals: Array<string | number | RegExp>) {
        return re`(?<${groupname}>${group})(?<key>${re(strings, ...vals)})\k<${groupname}>`;
    }
}
export const tripleBacktick = wrapped('```');
export const tripleTick = wrapped(`'''`);
export const tripleQuotation = wrapped(`"""`);
export const tripleQuote = wrapped('```' + `|'''|"""`);

export const backtick = wrapped('`');
export const tick = wrapped(`'`);
export const quotation = wrapped(`"`);

const qp = '[`' + `'"]`;

/* matches any quotation [`'"] */
export const anyQuotation = re`${qp}`;


/* matches text wrapped by any type of quotation `a`, 'b', or "c"*/
export const quote = wrapped(qp);

export function parenth(strings: TemplateStringsArray, ...vals: Array<string | number | RegExp>) {
    return re`\(${p(strings, ...vals)}\)`;
}
export const pa = parenth;

export function squareBracket(strings: TemplateStringsArray, ...vals: Array<string | number | RegExp>) {
    return re`\[${p(strings, ...vals)}\]`;
}
export const sb = squareBracket;

export function curlyBracket(strings: TemplateStringsArray, ...vals: Array<string | number | RegExp>) {
    return re`\{${p(strings, ...vals)}\}`;
}
export const cb = curlyBracket;
