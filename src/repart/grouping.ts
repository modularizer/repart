import {addToPrototype} from "./global";
import {asString, re} from "./re";
import {any} from "./generic";
import {PHONE_NUMBER_PATTERN} from "./common";
addToPrototype();

const gn = re`\w+`.as('groupname');
const unescaped = /(?<!\\)/
const groupstart = re`${unescaped}\(`;

const groupend = re`${unescaped}\)`;
const namedgroupstart = re`${groupstart}\?<${gn}>`;
const optionallynamedgroupstart = re`${groupstart}(\?<${gn}>)?`;
const groupstartorend = re`((${optionallynamedgroupstart})|(${groupend}))`;
const groupnameExtractor = re`^${namedgroupstart}${any}*\)$`;

export function getGroupName(rx: string | RegExp): string | undefined {
    const s = asString(rx);
    return groupnameExtractor.match(s)?.groupname;
}
export function getAllGroupstarts(rx: string | RegExp): string | undefined {
    const s = asString(rx);
    const p = optionallynamedgroupstart.withFlags('g');
    return p.matchAndExtract(s);
}
export function getAllGroups(rx: string | RegExp): string | undefined {
    const s = asString(rx);
    const p = groupstartorend.withFlags('g');
    const r = p.matchRaw(s);
    interface OpenGroup {
        sInd: number;
        name?: string;
    }
    interface ClosedGroup extends OpenGroup {
        eInd: number;
    }
    const openGroups: OpenGroup[] = [];
    const closedGroups: ClosedGroup[] = []
    r.raw.map((info) => {
        const parsed = info.raw;
        if (parsed === '('){
            openGroups.push({sInd: info.startIndex});
        }else if (parsed === ')') {
            if (!(openGroups.length > 0)){
                throw new Error('unmatched group')
            }
            const g = openGroups.pop() as OpenGroup;
            closedGroups.push({...g, eInd: info.endIndex});
        }else{
            openGroups.push({sInd: info.startIndex, name: info.groups.groupname.raw})
        }
    });
    closedGroups.sort((a, b) => a.sInd - b.sInd)
    // return closedGroups;
    return closedGroups.map((info) => {
        const p = s.slice(info.sInd, info.eInd);
        const childGroupNames = getAllGroupNames(p.slice(1, p.length - 1))
        return {...info, childGroupNames}
    })
}



interface NamedGroup {
    sInd: number;
    eInd: number;
    name: string;
}
export function getAllNamedGroups(rx: string | RegExp): NamedGroup[] {
    const s = asString(rx);
    const p = groupstartorend.withFlags('g');
    const r = p.matchRaw(s);
    interface OpenGroup {
        sInd: number;
        name?: string;
    }
    interface ClosedGroup extends OpenGroup {
        eInd: number;
    }
    const openGroups: OpenGroup[] = [];
    const closedGroups: ClosedGroup[] = []
    r.raw.map((info) => {
        const parsed = info.raw;
        if (parsed === '('){
            openGroups.push({sInd: info.startIndex});
        }else if (parsed === ')') {
            if (!(openGroups.length > 0)){
                throw new Error('unmatched group')
            }
            const g = openGroups.pop() as OpenGroup;
            closedGroups.push({...g, eInd: info.endIndex});
        }else{
            openGroups.push({sInd: info.startIndex, name: info.groups.groupname.raw})
        }
    });
    const namedGroups = closedGroups.filter((info) => info.name)
    namedGroups.sort((a, b) => a.sInd - b.sInd)
    return namedGroups
}
interface NamedGroupH extends NamedGroup {
    children?: NamedGroupH[];
}
function buildHierarchy(items: NamedGroup[]): NamedGroupH[] {
    const roots = [];
    const stack = [];

    const encloses = (a, b) => a.sInd < b.sInd && a.eInd > b.eInd; // strict

    for (const it of items) {
        const node = { ...it, children: [] };

        // Pop until the top can contain this node
        while (stack.length && !encloses(stack[stack.length - 1], node)) {
            stack.pop();
        }

        if (stack.length === 0) {
            roots.push(node);
        } else {
            stack[stack.length - 1].children.push(node);
        }

        stack.push(node);
    }

    return roots;
}
export function getNamedGroupHier(rx: string | RegExp) {
    const namedGroups = getAllNamedGroups(rx);
    return buildHierarchy(namedGroups);
}
export function getAllGroupNames(rx: string | RegExp): string[] {
    const s = asString(rx);
    return namedgroupstart.withFlags('g').matchAndExtract(s) ?? [];
}


// console.log(getAllGroupNames(PHONE_NUMBER_PATTERN))
// console.log(optionallynamedgroupstart)
// console.log(PHONE_NUMBER_PATTERN)
// console.log(getAllGroupstarts(PHONE_NUMBER_PATTERN))
// console.log(getAllNamedGroups(PHONE_NUMBER_PATTERN))
console.log(getNamedGroupHier(PHONE_NUMBER_PATTERN))