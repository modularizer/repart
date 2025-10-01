/**
 * Demo: Cascading Text Parsing
 * 
 * This demo shows how to use RePart's cascading parsing to split text into
 * hierarchical sections and then further parse each section into components.
 *
 * Goal: we want to split into lots of parts (headerLine, title, headline, author, published, paragraphs, links, etc).
 * Solution: Use cascading parsers to split on easy boundaries, then search the matched values
 *
 * Benefits:
 *   * avoid writing one huge regexp which could be more error prone
 *
 * Implementation:
 *  1. Use a simple regexp to split the doc into header, body, footer
 *  2. split header => eaderLine, and the title
 *  3. split body => headline, author, published, article
 *  4. convert published to a date
 *  5. split article into paragraphs, using a custom function
 *  6. split footer => find links
 */

import { re } from '../src/repart/re';
import { addToPrototype } from '../src/repart/global';
import {h1, link} from "../src/repart/md";
import {any, newLine, quote} from "../src/repart/generic";

// Initialize the global RegExp extensions
addToPrototype();

// Sample text to parse
const sampleText = `
# Welcome to Our Blog

## Breaking News: Technology Advances
By: Jane Smith
Published: 2024-01-15

In a groundbreaking development, researchers have discovered new methods for 
artificial intelligence that could revolutionize how we interact with technology. 
The new algorithms show promise in natural language processing and could lead 
to more intuitive human-computer interfaces.

The research team, led by Dr. Sarah Johnson at Tech University, spent three 
years developing these innovative approaches. Their findings were published 
in the prestigious Journal of Computer Science.

"This is a significant milestone in AI research," said Dr. Johnson. "We're 
excited to see how these techniques will be applied in real-world scenarios."

---

## Footer Links
- [Home](https://example.com)
- [About Us](https://example.com/about)
- [Contact](https://example.com/contact)
- [Privacy Policy](https://example.com/privacy)
- [Terms of Service](https://example.com/terms)
`;


// Step 1: Define the main document structure parser
const documentParser = re`${h1`.*`.as('header')}\s*(?<body>${any}+?)\s*---\s*(?<footer>${any}+?)$`.withParsers({
  // Parse header into title
  header: re`#\s*(?<title>.*)\s*`.as('headerLine'),
  
  // Parse body into headline, author, and article
  body: re`\s*#*\s*(?<headline>.*?)\s*${newLine}By:\s*(?<author>.*?)\s*${newLine}Published:\s*(?<published>.*?)\s*${newLine}\s*(?<article>${any}*)`.withParsers({
    _article: (s: string) => {
      const norm = s
          .replace('\r\n', '\n')     // Normalize Windows line endings
          .replace('\r', '\n')       // Normalize old Mac line endings
          .split('\n')                  // Split by line
          .map((line: string) => line.trim())
          .join('\n')
          .trim();
      const paragraphs = norm.split(/\n\n/);
      return {
        paragraphs,
      }
    },
    published: (s: string) => {
      try{
        const d = new Date(s);
        if (d.getTime()){
          return d;
        }
      }catch{
        return s
      }
    }
  }),
  
  // Parse footer into links
  footer: re`##\s*Footer Links\s*(?<linksgroup>.*)`.withFlags('s').withParsers({
    _linksgroup: (s: string) => {
      return {
        links: link.withFlags('g').matchAndExtract(s)
      }
    }
  })
});

// Step 2: Parse the document
const document = documentParser.match(sampleText);
console.log(document);
// {
//   header: {
//     headerLine: '# Welcome to Our Blog\n',
//     title: 'Welcome to Our Blog'
//   },
//   body: {
//     headline: 'Breaking News: Technology Advances',
//     author: 'Jane Smith',
//     published: 2024-01-15T00:00:00.000Z,
//     paragraphs: [
//       'In a groundbreaking development, researchers have discovered new methods for\n' +
//       'artificial intelligence that could revolutionize how we interact with technology.\n' +
//       'The new algorithms show promise in natural language processing and could lead\n' +
//       'to more intuitive human-computer interfaces.',
//       'The research team, led by Dr. Sarah Johnson at Tech University, spent three\n' +
//       'years developing these innovative approaches. Their findings were published\n' +
//       'in the prestigious Journal of Computer Science.',
//       `"This is a significant milestone in AI research," said Dr. Johnson. "We're\n` +
//       'excited to see how these techniques will be applied in real-world scenarios."'
//     ]
//   },
//   footer: { links: [ [Object], [Object], [Object], [Object], [Object] ] }
// }
console.log(document.footer.links);
// [
//   { label: 'Home', url: 'https://example.com' },
//   { label: 'About Us', url: 'https://example.com/about' },
//   { label: 'Contact', url: 'https://example.com/contact' },
//   { label: 'Privacy Policy', url: 'https://example.com/privacy' },
//   { label: 'Terms of Service', url: 'https://example.com/terms' }
// ]

