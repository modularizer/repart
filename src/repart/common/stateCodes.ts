import {wordList} from "../generic";


export const stateCodes: Record<string, string> = {
    AL: "Alabama", AK: "Alaska", AZ: "Arizona", AR: "Arkansas", CA: "California", CO: "Colorado",
    CT: "Connecticut", DE: "Delaware", FL: "Florida", GA: "Georgia", HI: "Hawaii", ID: "Idaho",
    IL: "Illinois", IN: "Indiana", IA: "Iowa", KS: "Kansas", KY: "Kentucky", LA: "Louisiana",
    ME: "Maine", MD: "Maryland", MA: "Massachusetts", MI: "Michigan", MN: "Minnesota", MS: "Mississippi",
    MO: "Missouri", MT: "Montana", NE: "Nebraska", NV: "Nevada", NH: "New Hampshire", NJ: "New Jersey",
    NM: "New Mexico", NY: "New York", NC: "North Carolina", ND: "North Dakota", OH: "Ohio", OK: "Oklahoma",
    OR: "Oregon", PA: "Pennsylvania", RI: "Rhode Island", SC: "South Carolina", SD: "South Dakota",
    TN: "Tennessee", TX: "Texas", UT: "Utah", VT: "Vermont", VA: "Virginia", WA: "Washington",
    WV: "West Virginia", WI: "Wisconsin", WY: "Wyoming",
};
const invMap = Object.fromEntries(Object.entries(stateCodes).map(([k, v]) => [v.toLowerCase(), k]));
export const stateNames = Object.keys(stateCodes).map(k => stateCodes[k]);
export const stateAbbrs = Object.keys(stateCodes);

// Names: case-insensitive, allow flexible spaces
export const STATE_NAME_PATTERN = wordList(stateNames, {
    ignoreCase: true,
    wholeWords: true,
    flexibleSpaces: true,
    captureName: "raw",
}).withParsers({
        raw: (s: string) => {
            const k = s.toLowerCase();
            const c = invMap[k];
            return {stateName: stateCodes[c], stateCode: c, state: stateCodes[c]};
        },
        groups: (g: any) => g.raw
    }).template("state");

// Abbreviations: case-sensitive (avoids matching the word "or"), no spaces
export const STATE_CODE_PATTERN = wordList(stateAbbrs, {
    ignoreCase: false,
    wholeWords: true,
    flexibleSpaces: false,
    captureName: "raw",
}).withParsers({
        raw: (s: string) => {

            const u = s.toUpperCase();
            const name = stateCodes[u];
            return {stateName: name, stateCode: s.toUpperCase(), state: s.toUpperCase()};
        },
    groups: (g: any) => g.raw
}).template("state");

// Abbreviations: case-sensitive (avoids matching the word "or"), no spaces
export const STATE_PATTERN = wordList([...stateNames,  ...stateAbbrs], {
    ignoreCase: false,
    wholeWords: true,
    flexibleSpaces: false,
    captureName: "raw",
}).withParsers({
    raw: (s: string) => {

        const u = s.toUpperCase();
        const name = stateCodes[u];
        if (name){
            return {stateName: name, stateCode: s.toUpperCase(), state: s.toUpperCase()};
        }
        const k = s.toLowerCase();
        const c = invMap[k];
        return {stateName: stateCodes[c], stateCode: c, state: stateCodes[c]}
    },
    groups: (g: any) => g.raw
}
).template("state");

export type StateCode = keyof typeof stateCodes;

export interface State {
    stateCode: StateCode;
    stateName: string;
    state: string; // either name or code, depending on what was written
}

// Helper: matches either names or codes (test both to keep abbrs case-sensitive)
export function matchAnyState(input: string): State | null {
    return STATE_PATTERN.matchAndExtract(input)?.state ?? null;
}