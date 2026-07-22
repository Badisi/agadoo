import { access, readFile, stat } from 'node:fs/promises';
import { styleText } from 'node:util';
import { resolve } from 'node:path';

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

const exitWithError = (message: string): never => {
    console.error(styleText('red', `Error: ${message}`));
    process.exit(1);
};

const resolveEntry = async (value: string): Promise<string | never> => {
    if (await isDirectory(value)) {
        try {
            const pkgJson = JSON.parse(await readFile(`${value}/package.json`, 'utf-8'));
            const name = pkgJson.module ?? pkgJson.main;
            if (name) {
                return await resolveEntry(resolve(value, name));
            }
        } catch { /* invalid or missing package.json —> fall through to index file check */ }
        const indexEntry = (await ifExists(`${value}/index.mjs`)) ?? (await ifExists(`${value}/index.js`));
        return indexEntry ?? exitWithError(`Could not resolve entry point in '${value}'`);
    } else {
        const fileEntry = (await ifExists(value)) ?? (await ifExists(`${value}.mjs`)) ?? (await ifExists(`${value}.js`));
        return fileEntry ?? exitWithError(`Could not resolve entry point '${value}'`);
    }
};

export { resolveEntry, exitWithError };
