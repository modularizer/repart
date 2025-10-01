import {escape} from "../special";
import {re} from "../re";

export function anyOf(...parts: (RegExp | string)[]) {
    let parsers = {};
    parts.filter(p => p instanceof RegExp && p.parsers).map(p => {
        Object.assign(parsers, p.parsers);
    })
    const srcs = parts.map(p => p instanceof RegExp ? p.source : p.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
    const flags = [...new Set(parts.filter(p => p instanceof RegExp).map(p => (p as RegExp).flags).join(""))].join("");
    return re`(?:${srcs.join("|")})`.withFlags(flags).withParsers(parsers);
}
export function noneOf(...parts: (RegExp | string)[]) {
    const alt = parts.map(p => p instanceof RegExp ? `(?:${p.source})` : p).join("|");
    const flags = [...new Set(parts.filter(p => p instanceof RegExp).map(p => (p as RegExp).flags).join(""))].join("");
    return new RegExp(`(?:(?!${alt})[\s\S])+`, flags);
}


export function wordList(
    words: string[],
    {
        ignoreCase = true,
        wholeWords = true,
        flexibleSpaces = true, // turn spaces into \s+ so "New   York" matches
        captureName,
    }: { ignoreCase?: boolean; wholeWords?: boolean; flexibleSpaces?: boolean; captureName?: string } = {}
): RegExp {
    const parts = words
        .map(w => w.trim())
        .filter(Boolean)
        .map(w => {
            // escape specials, then optionally loosen spaces
            let p = escape(w);
            if (flexibleSpaces) p = p.replace(/\s+/g, "\\s+");
            return p;
        })
        // longest-first so "West Virginia" wins over "Virginia"
        .sort((a, b) => b.length - a.length);

    const body = parts.join("|");
    const core = `(?:${body})`;
    const wrapped = wholeWords ? `\\b${core}\\b` : core;
    const named = captureName ? `(?<${captureName}>${wrapped})` : wrapped;
    return new RegExp(named, ignoreCase ? "i" : "");
}


/*builds a quatifier section specifying the number or times to repeat (+,*,{2}, {2,3}, {2,}) */
export function quantifier(minCount: number=0, maxCount: number | undefined | null = undefined){
    if (maxCount === undefined){
        maxCount = minCount;
    }else if (maxCount === null){
        maxCount = Infinity;
    }
    if (maxCount < minCount){
        throw new Error("max count should be greater or equal to minCount");
    }
    if (maxCount === 0){
        throw new Error("max count should be greater than 0");
    }
    if (minCount === 0){
        if (maxCount === Infinity){
            return "*"
        }
        return `{0,${maxCount}}`
    }
    if (minCount === 1){
        if (maxCount === Infinity){
            return "+"
        }
        if (maxCount === 1){
            return `{1}`
        }
        return `{1,${maxCount}}`
    }
    if (minCount === maxCount){
        return `{${minCount}}`
    }
    if (maxCount === Infinity){
        return `{${minCount},}`
    }
    return `{${minCount},${maxCount}}`
}