import {re} from "..";

const tel = /(tel:)?/;

const noop = (s: string) => s;



const countryCode = re`\+?`.concat(re`\d{1,3}`.as('countryCode').optional());
const globalAreaCode = re`\d{1,5}(?=\D)`.as('areaCode');
const globaltelephonePrefix = re`\d{2,}(?=\D)`.as('telephonePrefix');
const globallineNumber = re`\d{2,}`.as('lineNumber');
const globalsubscriber = re`(?=(\d[\(\)\s\-\.]*){4,10})\s*[\.\-\(]?\s*${globaltelephonePrefix}\s*[\.\-\)]?\s*${globallineNumber}`.as('subscriber');
export const baseGlobalPhoneNumber = re`${countryCode}\s*[\.\-\(]?\s*${globalAreaCode}\s*[\.\-\)]?\s*${globalsubscriber}`;
const ext = re`(?<fullextensionstring>(?:\s*(?:,|;)?\s*(?:ext(?:ension)?|extn|x\.?|#|-)\s*[:\.]?\s*(?<extension>\d{1,6})))?`;

const _GLOBAL_PHONE_NUMBER_PATTERN = re`${tel}\s*${baseGlobalPhoneNumber}${ext}`.as('phone');
export const GLOBAL_PHONE_NUMBER_PATTERN = _GLOBAL_PHONE_NUMBER_PATTERN.withParsers({
    '*': noop,
    groups: (g: any) => new PhoneNumber(g, _GLOBAL_PHONE_NUMBER_PATTERN)
}).template('global_phone');



const telephonePrefix = re`\d{3}`.as('telephonePrefix');
const lineNumber = re`\d{4}`.as('lineNumber');
const ussubscriber = re`(?<subscriber>${telephonePrefix}\s*[\.\-]?\s*${lineNumber})`;
const uscountryCode = re`\+?`.concat(re`1`.as('countryCode').optional());
const usAreaCode = re`\d{3}`.as('areaCode');
export const baseUSPhoneNumber = re`${uscountryCode}\s*[\.\-\(]?\s*${usAreaCode}\s*[\.\-\)]?\s*${ussubscriber}`;

export const _US_PHONE_NUMBER_PATTERN = re`${tel}\s*${baseUSPhoneNumber}${ext}`.as('phone');
export const US_PHONE_NUMBER_PATTERN = _US_PHONE_NUMBER_PATTERN.withParsers({
    '*': noop,
    groups: (g: any) => new PhoneNumber(g, _US_PHONE_NUMBER_PATTERN)
}).template('us_phone');
export const PHONE_NUMBER_PATTERN = re`(${US_PHONE_NUMBER_PATTERN})|(${GLOBAL_PHONE_NUMBER_PATTERN})`.withParsers({
    groups: (d: any) => d.us_phone ?? d.global_phone
}).template('phone');

export interface DecomposedPhoneNumber{
    phone?: string;
    countryCode?: string;
    areaCode: string;
    subscriber: string;
    telephonePrefix: string | undefined;
    lineNumber: string | undefined;
    extension?: string | undefined;
}

export const countryCodes: Record<string, string> = {
    "1": "United States / Canada / NANP",
    "7": "Russia / Kazakhstan",
    "20": "Egypt",
    "27": "South Africa",
    "30": "Greece",
    "31": "Netherlands",
    "32": "Belgium",
    "33": "France",
    "34": "Spain",
    "36": "Hungary",
    "39": "Italy",
    "40": "Romania",
    "41": "Switzerland",
    "43": "Austria",
    "44": "United Kingdom",
    "45": "Denmark",
    "46": "Sweden",
    "47": "Norway",
    "48": "Poland",
    "49": "Germany",
    "51": "Peru",
    "52": "Mexico",
    "53": "Cuba",
    "54": "Argentina",
    "55": "Brazil",
    "56": "Chile",
    "57": "Colombia",
    "58": "Venezuela",
    "60": "Malaysia",
    "61": "Australia",
    "62": "Indonesia",
    "63": "Philippines",
    "64": "New Zealand",
    "65": "Singapore",
    "66": "Thailand",
    "81": "Japan",
    "82": "South Korea",
    "84": "Vietnam",
    "86": "China",
    "90": "Turkey",
    "91": "India",
    "92": "Pakistan",
    "93": "Afghanistan",
    "94": "Sri Lanka",
    "95": "Myanmar",
    "98": "Iran",
    "211": "South Sudan",
    "212": "Morocco / Western Sahara",
    "213": "Algeria",
    "216": "Tunisia",
    "218": "Libya",
    "220": "Gambia",
    "221": "Senegal",
    "222": "Mauritania",
    "223": "Mali",
    "224": "Guinea",
    "225": "C\u00f4te d'Ivoire",
    "226": "Burkina Faso",
    "227": "Niger",
    "228": "Togo",
    "229": "Benin",
    "230": "Mauritius",
    "231": "Liberia",
    "232": "Sierra Leone",
    "233": "Ghana",
    "234": "Nigeria",
    "235": "Chad",
    "236": "Central African Republic",
    "237": "Cameroon",
    "238": "Cape Verde",
    "239": "S\u00e3o Tom\u00e9 and Pr\u00edncipe",
    "240": "Equatorial Guinea",
    "241": "Gabon",
    "242": "Republic of the Congo",
    "243": "Democratic Republic of the Congo",
    "244": "Angola",
    "245": "Guinea-Bissau",
    "246": "Diego Garcia",
    "248": "Seychelles",
    "249": "Sudan",
    "250": "Rwanda",
    "251": "Ethiopia",
    "252": "Somalia",
    "253": "Djibouti",
    "254": "Kenya",
    "255": "Tanzania",
    "256": "Uganda",
    "257": "Burundi",
    "258": "Mozambique",
    "260": "Zambia",
    "261": "Madagascar",
    "262": "R\u00e9union / Mayotte",
    "263": "Zimbabwe",
    "264": "Namibia",
    "265": "Malawi",
    "266": "Lesotho",
    "267": "Botswana",
    "268": "Eswatini",
    "269": "Comoros",
    "290": "Saint Helena / Tristan da Cunha",
    "291": "Eritrea",
    "297": "Aruba",
    "298": "Faroe Islands",
    "299": "Greenland",
    "350": "Gibraltar",
    "351": "Portugal",
    "352": "Luxembourg",
    "353": "Ireland",
    "354": "Iceland",
    "355": "Albania",
    "356": "Malta",
    "357": "Cyprus",
    "358": "Finland / \u00c5land Islands",
    "359": "Bulgaria",
    "370": "Lithuania",
    "371": "Latvia",
    "372": "Estonia",
    "373": "Moldova",
    "374": "Armenia",
    "375": "Belarus",
    "376": "Andorra",
    "377": "Monaco",
    "378": "San Marino",
    "380": "Ukraine",
    "381": "Serbia",
    "382": "Montenegro",
    "383": "Kosovo",
    "385": "Croatia",
    "386": "Slovenia",
    "387": "Bosnia and Herzegovina",
    "389": "North Macedonia",
    "420": "Czech Republic",
    "421": "Slovakia",
    "423": "Liechtenstein",
    "500": "Falkland Islands",
    "501": "Belize",
    "502": "Guatemala",
    "503": "El Salvador",
    "504": "Honduras",
    "505": "Nicaragua",
    "506": "Costa Rica",
    "507": "Panama",
    "508": "Saint Pierre and Miquelon",
    "509": "Haiti",
    "590": "Guadeloupe / Saint Barth\u00e9lemy / Saint Martin",
    "591": "Bolivia",
    "592": "Guyana",
    "593": "Ecuador",
    "594": "French Guiana",
    "595": "Paraguay",
    "596": "Martinique",
    "597": "Suriname",
    "598": "Uruguay",
    "599": "Caribbean Netherlands / Cura\u00e7ao",
    "670": "Timor-Leste",
    "672": "Norfolk Island",
    "673": "Brunei",
    "674": "Nauru",
    "675": "Papua New Guinea",
    "676": "Tonga",
    "677": "Solomon Islands",
    "678": "Vanuatu",
    "679": "Fiji",
    "680": "Palau",
    "681": "Wallis and Futuna",
    "682": "Cook Islands",
    "683": "Niue",
    "685": "Samoa",
    "686": "Kiribati",
    "687": "New Caledonia",
    "688": "Tuvalu",
    "689": "French Polynesia",
    "690": "Tokelau",
    "691": "Micronesia",
    "692": "Marshall Islands",
    "850": "North Korea",
    "852": "Hong Kong",
    "853": "Macau",
    "855": "Cambodia",
    "856": "Laos",
    "880": "Bangladesh",
    "886": "Taiwan",
    "960": "Maldives",
    "961": "Lebanon",
    "962": "Jordan",
    "963": "Syria",
    "964": "Iraq",
    "965": "Kuwait",
    "966": "Saudi Arabia",
    "967": "Yemen",
    "968": "Oman",
    "970": "Palestine",
    "971": "United Arab Emirates",
    "972": "Israel",
    "973": "Bahrain",
    "974": "Qatar",
    "975": "Bhutan",
    "976": "Mongolia",
    "977": "Nepal",
    "992": "Tajikistan",
    "993": "Turkmenistan",
    "994": "Azerbaijan",
    "995": "Georgia",
    "996": "Kyrgyzstan",
    "998": "Uzbekistan"
};

export class PhoneNumber {
    public phone: string | undefined;
    public countryCode: string | undefined;
    public country: string | undefined;
    public areaCode: string;
    public subscriber: string;
    public subscriberDigits: string;
    public telephonePrefix: string | undefined;
    public lineNumber: string | undefined;
    public extension: string | undefined;
    public patternMatched: RegExp | undefined;

    constructor(phoneNumber: string | DecomposedPhoneNumber | PhoneNumber, patternMatched?: RegExp) {
        if (typeof phoneNumber === 'string') {
            phoneNumber = decomposePhoneNumber(phoneNumber);
        }
        this.patternMatched = patternMatched;
        this.phone = phoneNumber.phone;
        this.subscriber = phoneNumber.subscriber;
        this.subscriberDigits  = phoneNumber.subscriber.replace(/[^\d]/g,'');
        this.countryCode = phoneNumber.countryCode;
        this.country = countryCodes[phoneNumber.countryCode ?? ''];
        this.areaCode = phoneNumber.areaCode;
        this.telephonePrefix = phoneNumber.telephonePrefix;
        this.lineNumber = phoneNumber.lineNumber;
        this.extension = phoneNumber.extension;
    }

// ---------- helpers ----------
    private get _coreDigits(): string {
        return this.subscriberDigits;
        // return [this.areaCode, this.telephonePrefix, this.lineNumber].filter(Boolean).join('');
    }
    private get _extSuffix(): string {
        return this.extension ? ` x${this.extension}` : '';
    }
    private get _localDotted(): string {
        if (!this.hasSubscriberComponents) return (this.areaCode + this.subscriber).replace(/[^\d \.]/g,'').replace(' ','.').replace('..', '.');
        const parts = [this.areaCode, this.telephonePrefix, this.lineNumber].filter(Boolean);
        return parts.join('.');
    }
    private get _localDashed(): string {
        if (!this.hasSubscriberComponents) return (this.areaCode + this.subscriber).replace(/[^\d -]/g,'').replace(' ','-').replace('--', '-');
        const parts = [this.areaCode, this.telephonePrefix, this.lineNumber].filter(Boolean);
        return parts.join('-');
    }
    private get _localSpaced(): string {
        if (!this.hasSubscriberComponents) return (this.areaCode + this.subscriber).replace(/[^\d ]/g,'');
        const parts = [this.areaCode, this.telephonePrefix, this.lineNumber].filter(Boolean);
        return parts.join(' ');
    }

    get us() {
        return this.countryCode && this.countryCode !== '1';
    }
    get hasSubscriberComponents(){
        return [this.areaCode, this.telephonePrefix, this.lineNumber].every(Boolean);
    }

    // ---------- formats ----------
    /** e.g., (555) 123-4567 x89 */
    get national(): string | null {
        if (!this.hasSubscriberComponents){
            return null
        }
        if (this.areaCode) {
            return `(${this.areaCode}) ${this.telephonePrefix}-${this.lineNumber}${this._extSuffix}`;
        }
        return `${this.telephonePrefix}-${this.lineNumber}${this._extSuffix}`;
    }

    /** e.g., +1 555 123 4567 x89 (spaces) */
    get international(): string {
        const cc = this.countryCode ? `+${this.countryCode} ` : '';
        return `${cc}${this._localSpaced}${this._extSuffix}`;
    }

    /** e.g., +1-555-123-4567 x89 (dashes) */
    get dashed(): string {
        const cc = this.countryCode ? `+${this.countryCode}-` : '';
        return `${cc}${this._localDashed}${this._extSuffix}`;
    }

    /** e.g., +1 555.123.4567 x89 (dots) */
    get dotted(): string {
        const cc = this.countryCode ? `+${this.countryCode} ` : '';
        return `${cc}${this._localDotted}${this._extSuffix}`;
    }

    /** Digits only, keeps +CC if present; appends xEXT if present */
    get compact(): string {
        const cc = this.countryCode ? `+${this.countryCode} ` : '';
        return `${cc}${this._coreDigits}${this._extSuffix}`;
    }

    /** RFC3966: tel:+1-555-123-4567;ext=89 (null if no country code) */
    get rfc3966(): string | null {
        if (!this.countryCode) return null;
        const base = `tel:+${this.countryCode}-${this._localDashed}`;
        return this.extension ? `${base};ext=${this.extension}` : base;
    }

    /** E.164: +15551234567 (null if no country code) */
    get e164(): string | null {
        if (!this.countryCode) return null;
        return `+${this.countryCode}${this._coreDigits}`;
    }

    /** Numeric: 15551234567 or 15551234567.000089 **/
    get numeric(): string {
        const x = this.extension || '0';
        const paddedX = '0'.repeat(6-x.length) + x;
        const p = `${this.countryCode || '1'}${this.areaCode || '000'}${this.telephonePrefix}${this.lineNumber}`;
        if (paddedX === '000000'){
            return p
        }
        return `${p}.${paddedX}`;
    }

    get number(): number {
        return parseFloat(this.numeric);
    }

    get c(): string {return this.countryCode || ''}
    get a(): string {return this.areaCode}
    get s(): string {return this.subscriber.replace(/[^/d ]/g, ' ').replace(/ +/g,' ')}
    get p(): string | undefined {return this.telephonePrefix}
    get n(): string | undefined {return this.lineNumber}
    get x(): string {return this.extension || ''}

    format(s: string){
        return s
            .replace('%c', this.c).replace('countryCode', this.c)
            .replace('%a', this.a).replace('areaCode', this.a)
            .replace('%p', this.s).replace('subscriber', this.s)
            .replace('%p', this.p ?? '').replace('telephonePrefix', this.p??'')
            .replace('%n', this.n ?? '').replace('lineNumber', this.n ?? '')
            .replace('%x', this.x).replace('extension', this.x);
    }

    /** Default display */
    toString(format: 'phone' |'national'|'international'|'dashed'|'dotted'|'compact'|'rfc3966'|'e164'|'numeric' = 'national'): string {
        switch (format) {
            case 'phone':           return this.phone ?? this.compact;
            case 'international': return this.international;
            case 'dashed':        return this.dashed;
            case 'dotted':        return this.dotted;
            case 'compact':       return this.compact;
            case 'rfc3966':       return this.rfc3966 ?? '';
            case 'e164':          return this.e164 ?? '';
            case 'numeric':       return this.numeric;
            case 'national':      return this.national ?? '';
            default:              return this.format(format);
        }
    }


}

export const isPhoneNumber = (s: string) => PHONE_NUMBER_PATTERN.test(s);

const decomposePhoneNumber = (input: string): DecomposedPhoneNumber => {
    const m = PHONE_NUMBER_PATTERN.matchAndExtract(input);
    if (m.phone){
        return m.phone
    }
    throw new Error('failed to match')
};

export const toPhoneNumber = (s: string): PhoneNumber => {
    return new PhoneNumber(s);
}