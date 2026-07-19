import { access, readFile, stat } from 'node:fs/promises';
import { relative, resolve } from 'node:path';
import { styleText } from 'node:util';
import { version as packageVersion } from '../package.json';

import { check } from './index';

const exitWithError = (message: string): never => {
    console.error(message);
    process.exit(1);
};

const ifExists = async (path: string): Promise<string | null> => {
    try {
        await access(path);
        return path;
    } catch {
        return null;
    }
};

const isDirectory = async (path: string): Promise<boolean> => {
    try {
        return (await stat(path)).isDirectory();
    } catch {
        return false;
    }
};

const resolveEntry = async (value: string): Promise<string | null> => {
    if (await isDirectory(value)) {
        return (await ifExists(`${value}/index.mjs`)) ?? (await ifExists(`${value}/index.js`));
    }
    return (await ifExists(value)) ?? (await ifExists(`${value}.mjs`)) ?? (await ifExists(`${value}.js`));
};

const getInput = async (): Promise<string> => {
    let pkgJson;
    try {
        pkgJson = JSON.parse(await readFile('package.json', 'utf-8'));
    } catch {
        exitWithError('Could not find or parse `package.json`');
    }
    const name = pkgJson.module ?? pkgJson.main ?? 'index';
    const entryPath = await resolveEntry(name);
    if (!entryPath) {
        exitWithError(`Could not resolve entry point: ${name}`);
    }
    return entryPath!;
};

const displayHelp = () => {
    console.log([
        `🍃 ${styleText(['bgGreen', 'black'], ' bagadoo ')}`,
        '',
        styleText('bold', 'VERSION:'),
        `    ${styleText('green', packageVersion)}`,
        '',
        styleText('bold', 'DESCRIPTION:'),
        '    Check whether a package is tree-shakeable.',
        '',
        styleText('bold', 'USAGE:'),
        '    $ bagadoo [path]',
        '',
        styleText('bold', 'ARGUMENTS:'),
        `    ${styleText('cyan', '[path]')}             Path to an entry file or package directory`,
        `    ${styleText(['gray', 'italic'], '                   (default: read module or main from package.json)')}`,
        '',
        styleText('bold', 'OPTIONS:'),
        `    ${styleText('cyan', '-v, --version')}      Print version`,
        `    ${styleText('cyan', '-h, --help')}         Show this help message`,
    ].join('\n'));
};

void (async (): Promise<void> => {
    if (process.argv.includes('--version') || process.argv.includes('-v')) {
        console.log(packageVersion);
        process.exit();
    } else if (process.argv.includes('--help') || process.argv.includes('-h')) {
        displayHelp();
        process.exit();
    } else {
        const input = process.argv[2] ?? await getInput();
        const absolutePath = resolve(process.cwd(), input);
        const relativePath = relative(process.cwd(), absolutePath);

        const result = await check(absolutePath);
        if (result.isShaken) {
            console.log(styleText('green', 'Success!') + ' ' + styleText('cyan', relativePath) + ' is fully tree-shakeable');
        } else {
            console.log(`${result.code}\n`);
            exitWithError(styleText('red', 'Failed to tree-shake ' + relativePath));
        }
    }
})();
