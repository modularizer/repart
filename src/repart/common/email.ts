import {re} from "../re";

export const EMAIL_PATTERN = /(?<emailHandle>[^\s@]+)@(?<emailDomain>[^\s@]+\.(?<emailTLD>[^\s@]+))/.as('email');
export const MAILTO_PATTERN = re`mailto:${EMAIL_PATTERN}`.as('mailto');

