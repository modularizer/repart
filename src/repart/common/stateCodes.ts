import {wordList} from "../generic/builders";


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

export const stateNames = Object.keys(stateCodes).map(k => stateCodes[k]);
export const stateAbbrs = Object.keys(stateCodes);

// Names: case-insensitive, allow flexible spaces
export const STATE_NAME_PATTERN = wordList(stateNames, {
    ignoreCase: true,
    wholeWords: true,
    flexibleSpaces: true,
    captureName: "statename",
});

// Abbreviations: case-sensitive (avoids matching the word "or"), no spaces
export const STATE_CODE_PATTERN = wordList(stateAbbrs, {
    ignoreCase: false,
    wholeWords: true,
    flexibleSpaces: false,
    captureName: "statecode",
});

// Abbreviations: case-sensitive (avoids matching the word "or"), no spaces
export const STATE_PATTERN = wordList([...stateNames,  ...stateAbbrs], {
    ignoreCase: false,
    wholeWords: true,
    flexibleSpaces: false,
    captureName: "state",
});

export type StateCode = keyof typeof stateCodes;

export interface State {
    code: StateCode;
    name: string;
}

// Helper: matches either names or codes (test both to keep abbrs case-sensitive)
export function matchAnyState(input: string): State | null {
    const mCode = input.match(STATE_CODE_PATTERN);
    if (mCode?.groups) return { code: mCode.groups.code, name: stateCodes[mCode.groups.code as keyof typeof stateCodes] };

    const mName = input.match(STATE_NAME_PATTERN);
    if (mName?.groups) {
        const name = mName.groups.state!;
        // normalize spaces to single space to look up
        const normalized = name.replace(/\s+/g, " ");
        const code = Object.keys(stateCodes).find((k) => stateCodes[k].toLowerCase() === normalized.toLowerCase())?.[0];
        return code ? { code, name: stateCodes[code as keyof typeof stateCodes] } : null;
    }
    return null;
}