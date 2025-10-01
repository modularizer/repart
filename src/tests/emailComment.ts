import {k, matchAndExtract, re} from "../repart";
import {linkto} from "../repart/md";
import {g, paddedline} from "../repart/generic";
import {htmlComment} from "../repart/common";

const s = '<!-- this is what an email link looks like: [someone](mailto:john@sample.com) -->';
export const EMAIL_PATTERN = /(?<email>(?<handle>[^\s@]+)@(?<domain>[^\s@]+\.(?<tld>[^\s@]+)))/;
export const MAILTO_PATTERN = re`mailto:${EMAIL_PATTERN}`;
export const markdownEmailLink = g('link')`${linkto`${MAILTO_PATTERN}`}`;

const comment = k(paddedline, htmlComment);

const markdownEmailComment: RegExp = comment`(?<comment>(?<desc>this is what an email link looks like: )${markdownEmailLink})`


const r = matchAndExtract(s, markdownEmailComment);
console.log(r);
// {
//     comment: 'this is what an email link looks like: [someone](mailto:john@sample.com)',
//     desc: 'this is what an email link looks like: ',
//     link: '[someone](mailto:john@sample.com)',
//     label: 'someone',
//     url: 'mailto:john@sample.com',
//     email: 'john@sample.com',
//     handle: 'john',
//     domain: 'sample.com',
//     tld: 'com'
// }
