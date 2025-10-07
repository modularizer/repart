import {asString, re} from "..";

export function replacedPattern(replacements: [string| RegExp, string | number | RegExp][]){
    return function (strings: TemplateStringsArray, ...vals: Array<string | number | RegExp>) {
        const p = re(strings, ...vals);
        let s = p.source;
        let flags = p.flags;
        for (const [k, v] of replacements){
            if (v instanceof RegExp){
                flags += v.flags;
            }
            const kp = re`${k}`.withFlags('g');
            s = s.replace(kp, asString(v))
        }
        return re`${s}`.withFlags(flags).withParsers(p.parsers);
    }
}

