export const PHONE_NUMBER_PATTERN = /^(tel:)?\s*(?<phoneNumber>\+?(?<countryCode>\d)?\s*[\.\-\(]?\s*(?<areaCode>\d{3})\s*[\.\-\)]?\s*(?<telephonePrefix>\d{3})\s*[\.\-]?\s*(?<lineNumber>\d{4})\s*[\.\-\(]?\s*)(?:\s*(?:,|;)?\s*(?:ext(?:ension)?|extn|x\.?|#|-)\s*[:\.]?\s*(?<extension>\d{1,6}))?$/i;

export interface DecomposedPhoneNumber{
    raw?: string;
    countryCode?: string;
    areaCode: string;
    telephonePrefix: string;
    lineNumber: string;
    extension?: string | undefined;
}

export class PhoneNumber {
    public raw: string | undefined;
    public countryCode: string | undefined;
    public areaCode: string;
    public telephonePrefix: string;
    public lineNumber: string;
    public extension: string | undefined;

    constructor(phoneNumber: string | DecomposedPhoneNumber | PhoneNumber) {
        if (typeof phoneNumber === 'string') {
            phoneNumber = decomposePhoneNumber(phoneNumber);
        }
        this.raw = phoneNumber.raw;
        this.countryCode = phoneNumber.countryCode;
        this.areaCode = phoneNumber.areaCode;
        this.telephonePrefix = phoneNumber.telephonePrefix;
        this.lineNumber = phoneNumber.lineNumber;
        this.extension = phoneNumber.extension;
    }

// ---------- helpers ----------
    private get _coreDigits(): string {
        return [this.areaCode, this.telephonePrefix, this.lineNumber].filter(Boolean).join('');
    }
    private get _extSuffix(): string {
        return this.extension ? ` x${this.extension}` : '';
    }
    private get _localDotted(): string {
        const parts = [this.areaCode, this.telephonePrefix, this.lineNumber].filter(Boolean);
        return parts.join('.');
    }
    private get _localDashed(): string {
        const parts = [this.areaCode, this.telephonePrefix, this.lineNumber].filter(Boolean);
        return parts.join('-');
    }
    private get _localSpaced(): string {
        const parts = [this.areaCode, this.telephonePrefix, this.lineNumber].filter(Boolean);
        return parts.join(' ');
    }

    // ---------- formats ----------
    /** e.g., (555) 123-4567 x89 */
    get national(): string {
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
    get p(): string {return this.telephonePrefix}
    get n(): string {return this.lineNumber}
    get x(): string {return this.extension || ''}

    format(s: string){
        return s
            .replace('%c', this.c).replace('countryCode', this.c)
            .replace('%a', this.a).replace('areaCode', this.a)
            .replace('%p', this.p).replace('telephonePrefix', this.p)
            .replace('%n', this.n).replace('lineNumber', this.n)
            .replace('%x', this.x).replace('extension', this.x);
    }

    /** Default display */
    toString(format: 'raw' |'national'|'international'|'dashed'|'dotted'|'compact'|'rfc3966'|'e164'|'numeric' = 'national'): string {
        switch (format) {
            case 'raw':           return this.raw ?? this.compact;
            case 'international': return this.international;
            case 'dashed':        return this.dashed;
            case 'dotted':        return this.dotted;
            case 'compact':       return this.compact;
            case 'rfc3966':       return this.rfc3966 ?? '';
            case 'e164':          return this.e164 ?? '';
            case 'numeric':       return this.numeric;
            case 'national':      return this.national;
            default:              return this.format(format);
        }
    }


}

export const isPhoneNumber = (s: string) => PHONE_NUMBER_PATTERN.test(s);

const decomposePhoneNumber = (s: string): DecomposedPhoneNumber => {
    const m = s.match(PHONE_NUMBER_PATTERN);
    if (!m?.groups) {
        throw new Error("invalid phone number")
    }
    const { countryCode, areaCode, telephonePrefix, lineNumber, extension } =
        m.groups as Record<string, string | undefined>;
    return {
        raw: s,
        countryCode,
        areaCode: areaCode!,
        telephonePrefix: telephonePrefix!,
        lineNumber: lineNumber!,
        extension,
    };
};

export const toPhoneNumber = (s: string): PhoneNumber => {
    return new PhoneNumber(s);
}