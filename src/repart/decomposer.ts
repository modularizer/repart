import {asString, re} from "./core";
import {groupStarts, GroupType} from "./grouping";

const gn = re`(?<groupname>\w+)`;
const unescaped = /(?<!\\)/
const groupstart = re`${unescaped}\(`;

const groupend = re`${unescaped}\)`;
const optionallynamedgroupstart = re`${groupstart}(\?<${gn}>)?`;

const groupstartorend = re`((${optionallynamedgroupstart})|(${groupend}))`;
interface BaseGroupDetails {
    sInd: number; // start index in string
    cInd: number; // index of the start of the actual group content , ie. not including stuff like (?<
    eInd: number; // end index in string
    qInd: number; // endIndex INCLUDING any quantifier
    parentIndices: number[]; // list of indices of parent groups (indices in the list of groups returned)
    capturedParentIndices: number[]; // list of indices of parent groups (indices in the list of groups returned)
    namedParentIndices: number[]; // list of indices of parent groups (indices in the list of groups returned)
    level: number; // same as namedParentIndices.length
    type?: GroupType;
    number?: number; // if it is a capturing group, what is its index amongst capturing groups, e.g. m.groups[1]
    name?: string; // if it is named, what is its name?
    _i: number; // index with regards to ALL groups NOT just capturing groups;
    isCapturing: boolean; // is either 'capturing' or 'named' type
    hasQuantifier: boolean;
    quantifier: string | undefined;
    minCount: number;
    maxCount: number;
}
interface NonCapturingGroup extends BaseGroupDetails {
    type: Exclude<GroupType, 'capturing' | 'named'>;
    number?: undefined;
    name?: undefined;
    isCapturing: false;
}
interface CapturingGroup extends BaseGroupDetails {
    type: 'capturing';
    number: number;
    name?: undefined;
    isCapturing: true;
}
interface NamedGroup extends BaseGroupDetails {
    type: 'named'
    name: string;
    number: number;
    isCapturing: true;
}

export type GroupDetails = NamedGroup | NonCapturingGroup | CapturingGroup;
export function getGroups(rx: string | RegExp): GroupDetails[] {
    const s = asString(rx);
    const p = groupstartorend.withFlags('g');
    const r = p.matchRaw(s);
    if (!r.raw) return [];
    interface OpenGroup {
        sInd: number;
        cInd: number;
        type: GroupType;
        name?: string;
    }


    interface ClosedGroup extends OpenGroup {
        eInd: number;
    }
    const openGroups: OpenGroup[] = [];
    const closedGroups: ClosedGroup[] = []
    //@ts-ignore
    r.raw.map((info) => {
        const parsed = info.raw;
        let cInd = info.startIndex + 1;
        if (parsed === '('){
            const f3 = s.slice(info.startIndex + 1, info.startIndex + 4);
            let t = 'capturing';
            for (let k of ['positive-lookbehind', 'negative-lookbehind', 'non-capturing', 'positive-lookahead', 'negative-lookahead']){
                if (f3.startsWith(groupStarts[k as GroupType])){
                    t = k;
                    cInd = info.startIndex + 1 + groupStarts[k as GroupType].length;
                    break;
                }
            }
            openGroups.push({sInd: info.startIndex, type: t as GroupType, cInd});
        }else if (parsed === ')') {
            if (!(openGroups.length > 0)){
                throw new Error('unmatched group')
            }
            const g = openGroups.pop() as OpenGroup;
            closedGroups.push({...g, eInd: info.endIndex});
        }else{
            const name = info.groups.groupname.raw;
            openGroups.push({sInd: info.startIndex, name, type: "named" as GroupType, cInd: info.startIndex+4+name.length});
        }
    });
    const groups = closedGroups
        .sort((a, b) => a.sInd - b.sInd);

    const result: GroupDetails[] = [];
    let n = 0;

    for (let i = 0; i < groups.length; i++) {
        const g = groups[i];
        const parents: number[] = [];

        for (let j = 0; j < i; j++) {
            const p = groups[j];
            if (p.sInd < g.sInd && p.eInd > g.eInd) {
                parents.push(j);
            }
        }
        const capturingParents = parents.filter(pi => ["capturing", "named"].includes(groups[pi].type));
        const namedParents = parents.filter(pi => groups[pi].type === "named");
        const isCapturing = ['capturing', 'named'].includes(g.type);
        const number = isCapturing?n:undefined;
        if (isCapturing){
            n ++;
        }
        const nextChar = s.slice(g.eInd, g.eInd + 1);
        const hasQuantifier = nextChar !== '' && '+?*{'.includes(nextChar);
        let minCount=1;
        let maxCount=1;
        let quantifier = (hasQuantifier?nextChar:'') || undefined;
        if (hasQuantifier) {
            if (nextChar === '{') {
                const e = s.slice(g.eInd + 1).indexOf('}');
                if (e === -1){
                    throw new Error('} not found');
                }
                quantifier = s.slice(g.eInd, g.eInd + 3 + 3);
                if (!/^\{.*\}$/.test(quantifier)) {
                    throw new Error('invalid quantifier parsing logic, my bad...');
                }
                const parts = quantifier.slice(1, quantifier.length - 1).split(',');
                minCount = parseInt(parts[0], 10);
                maxCount = (parts.length === 1) ? minCount : (parts[1] ? parseInt(parts[1]) : Infinity);
            } else if (nextChar === '?'){
                minCount = 0;
                maxCount = 1;
            }else if (nextChar === '*'){
                minCount = 0;
                maxCount = Infinity;
            }else if (nextChar === '+'){
                minCount = 1;
                maxCount = Infinity;
            }
        }
        const qInd = g.eInd + (quantifier??'').length;
        //@ts-ignore
        result.push({ ...g,
            parentIndices: parents,
            capturedParentIndices: capturingParents,
            namedParentIndices: namedParents,
            level: (g.name)?namedParents.length:(namedParents.length-1),
            isCapturing,
            number,
            hasQuantifier,
            quantifier,
            minCount,
            maxCount,
            qInd,
            _i: i
        });
    }

    return result;
}

export class GroupInfo {
    private _rx: RegExp;
    private _source: string;
    private _allGroups: GroupDetails[];
    private _totalGroupCount: number;
    private _hasGroups: boolean;
    private _isGroup: boolean;
    private _details?: GroupDetails;


    constructor(pattern: string | RegExp,  allGroups?: GroupDetails[]) {
        this._rx = (pattern instanceof RegExp)?pattern:new RegExp(pattern, 'd');
        //@ts-ignore
        const s: string = pattern.source;
        this._source = s;
        this._allGroups= allGroups ?? getGroups(s);
        this._totalGroupCount = this._allGroups.length;
        this._hasGroups = this._allGroups.length > 0;
        if (this._hasGroups){
            const firstGroup = this._allGroups[0];
            if ((firstGroup.sInd === 0) && (firstGroup.qInd === s.length)){
                this._isGroup = true;
                this._details = firstGroup;
            }else{
                this._isGroup = false;
            }
        }else{
            this._isGroup = false;
        }


    }



    toString(): string {

        const C = {
            reset: '\x1b[0m',
            red: '\x1b[31m',
            dim: '\x1b[2m',
            normal: '\x1b[22m', // undim (also cancels bold)
            bold: '\x1b[1m',
            cyan: '\x1b[36m',
            yellow: '\x1b[33m',
            green: '\x1b[32m',
            magenta: '\x1b[35m',
            brightMagenta: '\x1b[95m',
            blue: '\x1b[34m',
            gray: '\x1b[90m',
            orange: '\x1b[38;2;255;165;0m',
        };
        if (!this._hasGroups) return `${C.reset}${C.red}/${C.reset}${this.source}${C.red}/${this.flags}${C.reset}`
        // make a colored version showing specificaly named groups and quantifiers.
        // always show quantifiers in gray and group starts and ends in gray
        // always show names in bold black
        // show level 0 groups in magenta, level 1 cyan, level 2 green, level 3 yellow, level 4 green, level 5 yellow, ...
        let colorInds: any[] = []
        const levelColors = [
            [C.magenta, C.cyan],
            [C.green, C.yellow],
            [C.blue, C.brightMagenta],
            [C.red, C.orange]
        ]
        function getGroupColor(level: number){
            if (level < 0) return C.reset;
            const opts = levelColors[level % 4];
            while (colorInds.length <= level){
                colorInds.push(-1)
            }
            const i = (colorInds[level] + 1) %  opts.length;
            colorInds[level] = i;
            return opts[i];
            // colorInd = (colorInd +1) % 6;
            // return [C.magenta, C.cyan, C.brightMagenta, C.green, C.yellow, C.blue][colorInd]
        }

        const src = this._source;
        let s = '';
        let level = -1;
        let i = undefined;
        let color = C.reset;
        const openGroups: any[] = [];
        const groupsRemaining = [...this._allGroups]
        let nextGroupStart = groupsRemaining[0]?.sInd;
        let nextGroupEnd = openGroups[openGroups.length - 1]?.qInd;
        let lastInd = -1;
        let x = 0;

        while (i === undefined || i < src.length){
            const nxt = Math.min(nextGroupStart ?? src.length, nextGroupEnd??src.length);
            if (i == lastInd && nxt <= i){
                x += 1;
                if (x > 2){
                    throw new Error("got stuck at: " + i)
                }
            }else{
                x = 0
            }
            if (nxt < (i ?? 0)){
                throw new Error("we shouldn't be going backwards...")
            }

            lastInd = i ?? 0;
            s += src.slice(i ?? 0, nxt);
            i = nxt;
            if (i === src.length){
                break
            }
            if (i === nextGroupEnd){
                openGroups.pop();
                const lastOpen = openGroups[openGroups.length - 1];
                if ((lastOpen?.level  ?? -1)!== level){
                    level = lastOpen?.level  ?? -1;
                    color = lastOpen?.color ?? C.reset;
                    s += color;
                }
            }
            if (i === nextGroupStart) {
                const g = groupsRemaining.shift();
                if (g) {
                    if (g.level != level) {
                        level = g.level;
                        color = getGroupColor(level);
                        s += color;
                    }

                    openGroups.push({...g, color});
                    if (g.type === 'named') {
                        s += `(?<${C.bold}${g.name}${C.normal}>`;
                        i = g.cInd;
                    } else {
                        s += src.slice(g.sInd, g.cInd);
                        i = g.cInd;
                    }

                }
            }
            nextGroupStart = groupsRemaining[0]?.sInd;
            nextGroupEnd = openGroups[openGroups.length - 1]?.qInd;
        }


        const s2 = s.replace(/\x1b\[[0-9;]*m/g, '');
        if (s2 != src){
            console.error("put together invalid string")
            return `${C.reset}${C.red}/${C.reset}${src}${C.red}/${this.flags}${C.reset}`
        }
        return `${C.reset}${C.red}/${C.reset}${s}${C.red}/${this.flags}${C.reset}`

    }

    /**
     * Custom inspect for Node.js console.log to display as Raw value
     */
    [Symbol.for('nodejs.util.inspect.custom')]() {
        return this.toString();
    }

    /* The unquantified source of this group only */
    get unquantifiedSource(): string {return this._source.slice(this.sInd, this.eInd)}
    get unquantifiedRx(): RegExp {return new RegExp(this.unquantifiedSource, this.flags)}
    get rx(): RegExp{return this._rx}
    get source(): string {return this._source}
    get flags(): string {return this._rx.flags}




    get isGroup(): boolean {return this._isGroup}
    get _hasChildren(): boolean {return this._isGroup && this._hasGroups}
    get hasChildren(): boolean {return this._hasChildren}
    get _children(): GroupDetails[] {
        if (this._hasGroups){
            if (this._isGroup){
                return this._allGroups.filter(x => x.parentIndices.includes(0))
            }
            return this._allGroups;
        }
        return [];
    }

    // proxy info about the top level

    // all indices are relative to the fullsource
    get sInd(): number {return this._details?.sInd ?? 0}
    get eInd(): number {return this._details?.eInd ?? (this._source.length - 1)}
    get cInd(): number {return this._details?.cInd ?? 0}
    get qInd(): number {return this._details?.qInd ?? (this._source.length - 1)}


    get parentIndices(): number[] {return this._details?.parentIndices ?? []}
    get capturedParentIndices(): number[] {return this._details?.capturedParentIndices ?? []}
    get namedParentIndices(): number[] {return this._details?.namedParentIndices ?? []}
    get level(): number {return this._details?.level ?? -1}
    get type(): GroupType | undefined {return this._details?.type ?? undefined}
    get number(): number | undefined {return this._details?.number}
    get name(): string | undefined {return this._details?.name ?? undefined}
    get isCapturing(): boolean {return this._details?.isCapturing ?? false}
    get hasQuantifier(): boolean {return this._details?.hasQuantifier ?? false}
    get quantifier(): string | undefined {return this._details?.quantifier ?? undefined}
    get minCout(): number {return this._details?.minCount ?? 1}
    get maxCount(): number {return this._details?.maxCount ?? 1}


    get allGroupDetails(): GroupDetails[] {
        return this._allGroups
    }
    get capturedGroupDetails(): GroupDetails[] {
        return this._capturedGroups;
    }
    get namedGroupDetails(): GroupDetails[] {
        return this.allGroupDetails.filter(x => x.type === 'named');
    }
    get _capturedGroups() {
        // returns capturing and named groups
        return this._allGroups.filter(x => x.isCapturing)
    }

    get groupNames(): string[] {
        return this._capturedGroups.filter(x => x.type === 'named').map(x => x.name);
    }

    get topLevelGroupNames(): string[] {
        return this._capturedGroups.filter(x => x.type === 'named' && x.level === (this.level + 1)).map(x => x.name!);
    }

    get namedGroups(){
        // return Object.fromEntries(this.namedGroupDetails.map(i => {
        //     const d = GroupInfo.getChild(this._allGroups, i, this.rx)
        //     return [i.name, d]
        // }))
        const groupNames = this.groupNames;
        const allGroups = this._allGroups;
        const rx = this.rx;
        const namedGroupDetails = this.namedGroupDetails;
        return new Proxy(Object.fromEntries(groupNames.map(k => [k, undefined])), {
            get (target, prop, receiver){
                if (groupNames.includes(prop as string)){
                    const details = namedGroupDetails.find(i => i.name === prop)
                    const d = GroupInfo.getChild(allGroups, details!, rx);
                    return d;
                }
            }
        })
    }

    get groups() {
        const rx = this.rx;
        const allGroups = this._allGroups;
        const capturedGroups: (NamedGroup | CapturingGroup)[] = this._capturedGroups;
        const nameToIndex = new Map();
        for (let i = 0; i < capturedGroups.length; i++) {
            const g = capturedGroups[i];
            if (g.name) nameToIndex.set(g.name, i);
        }
        return new Proxy(capturedGroups, {
            get(target, prop, receiver) {
                // Keep array behavior: indices, length, methods, symbols, etc.
                if (typeof prop === 'symbol' || prop in target || /^\d+$/.test(String(prop))) {
                    return Reflect.get(target, prop, receiver);
                }

                // Named access (e.g., proxy.foo -> capturedGroups[i])
                const idx = nameToIndex.get(String(prop));
                const details = idx != null ? target[idx] : undefined;
                if (!details) return;
                return GroupInfo.getChild(allGroups, details, rx);


            }
        })

    }

    get details() {
        const capturedGroups: (NamedGroup | CapturingGroup)[] = this._capturedGroups;
        const nameToIndex = new Map();
        for (let i = 0; i < capturedGroups.length; i++) {
            const g = capturedGroups[i];
            if (g.name) nameToIndex.set(g.name, i);
        }
        return new Proxy(capturedGroups, {
            get(target, prop, receiver) {
                // Keep array behavior: indices, length, methods, symbols, etc.
                if (typeof prop === 'symbol' || prop in target || /^\d+$/.test(String(prop))) {
                    return Reflect.get(target, prop, receiver);
                }

                // Named access (e.g., proxy.foo -> capturedGroups[i])
                const idx = nameToIndex.get(String(prop));
                return idx != null ? target[idx] : undefined;
            }
        })
    }

    static getChild(allGroups: GroupDetails[], base: GroupDetails, rx: RegExp) {
        //@ts-ignore
        const _all: GroupDetails[] = allGroups.filter(x => x._i === base._i || x.parentIndices.includes(base._i)).map(d => {
            return GroupInfo.offset(d, base)
        });
        const _src = rx.source.slice(base.sInd, base.qInd);
        return new GroupInfo(new RegExp(_src, rx.flags), _all);
    }

    static offset(d: GroupDetails, base?: GroupDetails){
        if (!base) return d;
        return {
            ...d,
            parentIndices: (d._i == base._i)?[]:d.parentIndices.map(pi => pi - base._i).filter(pi => pi >= 0),
            capturedParentIndices: (d._i == base._i)?[]:d.capturedParentIndices.map(pi => pi - base._i).filter(pi => pi >= 0),
            namedParentIndices: (d._i == base._i)?[]:d.namedParentIndices.map(pi => pi - base._i).filter(pi => pi >= 0),
            sInd: d.sInd - base.sInd,
            cInd: d.cInd - base.sInd,
            eInd: d.eInd - base.sInd,
            qInd: d.qInd - base.sInd,
            _i: d._i - base._i,
            number: (d.number !== undefined)?(d.number - (base.number ?? 0)):undefined,
        }
    }

}


export const getGroupInfo = (pattern: string | RegExp): GroupInfo => new GroupInfo(pattern);
