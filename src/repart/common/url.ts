import {re} from "../core";




const scheme = re`(?:(?<scheme>https?|ftp):\/\/)`;
const subdomain = re`(?:(?<subdomain>[a-z0-9-]+\.)+\.)`;
const domain = re`(?<domain>[a-z0-9-]+)`;
const tld = re`(?<tld>[a-z]{2,})`;
const port = re`(?::(?<port>\d{2,5}))`;
const path = re`(?<path>\/[^\s?#]*)`;
const query = re`(?:\?(?<query>[^\s#]*))`;
const fragment = re`(?:\#(?<fragment>[^\s]*))`;


export const url = re`^(?<url>(?<host>${scheme}?(?<fulldomain>${subdomain}?${domain}\.${tld})${port}?)(?<route>${path}?}${query}?${fragment}?))$`;
export const https = re`^(?<url>(?<host>https:\/\/(?<fulldomain>${subdomain}?${domain}\.${tld})${port}?)(?<route>${path}?}${query}?${fragment}?))$`;

export function domainlink(strings: TemplateStringsArray, ...vals: Array<string | number | RegExp>) {
    return re`^(?<url>(?<host>(https:\/\/(?:www\\.)?${re(strings, ...vals)}(?<route>${path}?}${query}?${fragment}?))$`
}
// export const url = re`\b(?:https?:\/\/)?(?:localhost|\d{1,3}(?:\.\d{1,3}){3}|(?:[\w-]+\.)+[a-z]{2,})(?::\d{2,5})?(?:\/[^\s?#]*)?(?:\?[^\s#]*)?(?:#[^\s]*)?\b;
// export const url = re`(?:\\.|[^()\s\\]|(?:\((?:\\.|[^()\\])*\))+)`;