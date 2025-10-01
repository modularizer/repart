import {re} from "../re";

export const EMAIL_PATTERN = /(?<email>(?<emailHandle>[^\s@]+)@(?<emailDomain>[^\s@]+\.(?<emailTLD>[^\s@]+)))/;
export const MAILTO_PATTERN = re`(?<mailto>mailto:${EMAIL_PATTERN})`;

