import {asString, re} from "../re";
import {dedup} from "../flags";
import {space} from "./patterns";

export function replacedPattern(replacements: Record<string, string | number | RegExp>){
    return function (strings: TemplateStringsArray, ...vals: Array<string | number | RegExp>) {
        const p = re(strings, ...vals);
        let s = p.source;
        let flags = p.flags;
        for (const [k, v] of Object.entries(replacements)){
            if (v instanceof RegExp){
                flags += v.flags;
            }
            s = s.replace(k, asString(v))
        }
        return re`${s}`.withFlags(flags).withParsers(p.parsers);
    }
}

