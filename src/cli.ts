import { access, readFile, stat } from 'node:fs/promises';
import { relative, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { styleText } from 'node:util';
import type { RollupOptions } from 'rollup';

import { version as packageVersion } from '../package.json';
import { check } from './index';

interface Options {
    rollupOptions?: RollupOptions;
    absolutePath: string;
    relativePath: string;
}

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
        `    ${styleText('cyan', '-c, --config <file>')}  Path to a Rollup config file`,
        `    ${styleText('cyan', '-v, --version')}        Print version`,
        `    ${styleText('cyan', '-h, --help')}           Show this help message`,
    ].join('\n'));
};

const getOptions = async (): Promise<Options> => {
    const args = process.argv.slice(2);
    let configPath: string | undefined;

    const configIndex = args.findIndex(a => a.startsWith('--config=') || a.startsWith('-c='));
    if (configIndex !== -1) {
        const match = args[configIndex];
        configPath = match.slice(match.indexOf('=') + 1);
        args.splice(configIndex, 1);
    }

    for (const flag of ['--config', '-c']) {
        const idx = args.indexOf(flag);
        if (idx !== -1) {
            configPath = args[idx + 1];
            args.splice(idx, 2);
            break;
        }
    }

    let rollupOptions: Partial<RollupOptions> | undefined;
    if (configPath) {
        const absoluteConfigPath = resolve(process.cwd(), configPath);
        const configModule = await import(pathToFileURL(absoluteConfigPath).href);
        const config = configModule.default ?? configModule;
        rollupOptions = config?.rollup ?? config;
    }

    const input = args[0] ?? await getInput();
    const absolutePath = resolve(process.cwd(), input);
    return {
        rollupOptions,
        absolutePath,
        relativePath: relative(process.cwd(), absolutePath),
    }
}

void (async (): Promise<void> => {
    if (process.argv.includes('--version') || process.argv.includes('-v')) {
        console.log(packageVersion);
        process.exit();
    } else if (process.argv.includes('--help') || process.argv.includes('-h')) {
        displayHelp();
        process.exit();
    } else {
        const options = await getOptions();
        const result = await check(options.absolutePath, options.rollupOptions);
        if (result.isShaken) {
            console.log(styleText('green', 'Success!') + ' ' + styleText('cyan', options.relativePath) + ' is fully tree-shakeable');
        } else {
            console.log(`${result.code}\n`);
            exitWithError(styleText('red', 'Failed to tree-shake ' + options.relativePath));
        }
    }
})();
