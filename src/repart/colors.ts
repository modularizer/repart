// FIXME: find a way to conditionally make terminal colors available to server environments
const isServer = typeof window === 'undefined';
export const colors = isServer?{
    reset: '\x1b[0m',
    red: '\x1b[31m',
    dim: '\x1b[2m',
    normal: '\x1b[22m', // undim (also cancels bold)
    bold: '\x1b[1m',
    cyan: '\x1b[36m',
    yellow: '\x1b[33m',
    green: '\x1b[32m',
    magenta: '\x1b[35m',
    brightMagenta: '\x1b[95m',
    blue: '\x1b[34m',
    gray: '\x1b[90m',
    orange: '\x1b[38;2;255;165;0m',
}:{
    reset: '',
    red: '',
    dim: '',
    normal: '', // undim (also cancels bold)
    bold: '',
    cyan: '',
    yellow: '',
    green: '',
    magenta: '',
    brightMagenta: '',
    blue: '',
    gray: '',
    orange: '',
};
// export const colors = Object.fromEntries(Object.entries(_colors).map(([k, v]) => [k, _pre + v + 'm']));