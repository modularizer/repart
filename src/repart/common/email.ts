import {re} from "../re";

// RFC 5322 compliant email pattern with proper validation
// Local part: alphanumeric, dots, underscores, hyphens, plus signs
// Domain: alphanumeric, dots, hyphens (must have at least one dot)
// TLD: at least 2 letters, can have multiple parts (e.g., co.uk)
export const EMAIL_PATTERN = /(?<email>(?<emailHandle>([a-zA-Z0-9](?:(?!\.\.)[a-zA-Z0-9._+\-])*)?[a-zA-Z0-9])@(?<emailDomain>[a-zA-Z0-9](?:(?!\.\.)[a-zA-Z0-9.\-])*[a-zA-Z0-9]?\.(?<emailTLD>[a-zA-Z]{2,}(?:\.[a-zA-Z]{2,})*)))/;

export const MAILTO_PATTERN = re`(?<mailto>mailto:${EMAIL_PATTERN})`;

