import { describe, it, expect } from 'vitest';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

import { resolveEntry } from '../src/cli-utils';

const testDir = fileURLToPath(new URL('.', import.meta.url));

describe('resolveEntry', () => {
    describe('directory input', () => {
        it('resolves to index.js when directory contains index.js', async () => {
            const result = await resolveEntry(resolve(testDir, 'pass/simple'));
            expect(result).toBe(resolve(testDir, 'pass/simple/index.js'));
        });

        it('resolves to index.mjs when directory contains index.mjs', async () => {
            const result = await resolveEntry(resolve(testDir, 'pass/simple-mjs'));
            expect(result).toBe(resolve(testDir, 'pass/simple-mjs/index.mjs'));
        });

        it('resolves via package.json module field when present', async () => {
            const result = await resolveEntry(resolve(testDir, 'pass/custom-entry'));
            expect(result).toBe(resolve(testDir, 'pass/custom-entry/custom.js'));
        });

        it('throws when directory has no resolvable entry', async () => {
            await expect(resolveEntry(resolve(testDir, 'empty'))).rejects.toThrow();
        });

        it('throws when directory does not exist', async () => {
            await expect(resolveEntry(resolve(testDir, 'nonexistent-dir'))).rejects.toThrow();
        });
    });

    describe('file input', () => {
        it('returns the path when file exists', async () => {
            const result = await resolveEntry(resolve(testDir, 'pass/simple/index.js'));
            expect(result).toBe(resolve(testDir, 'pass/simple/index.js'));
        });

        it('resolves with .mjs extension when file without extension has .mjs', async () => {
            const result = await resolveEntry(resolve(testDir, 'pass/simple-mjs/index'));
            expect(result).toBe(resolve(testDir, 'pass/simple-mjs/index.mjs'));
        });

        it('resolves with .js extension when file without extension has .js', async () => {
            const result = await resolveEntry(resolve(testDir, 'pass/simple/index'));
            expect(result).toBe(resolve(testDir, 'pass/simple/index.js'));
        });

        it('throws when file does not exist', async () => {
            await expect(resolveEntry(resolve(testDir, 'pass/simple/nonexistent.js'))).rejects.toThrow();
        });

        it('throws when file without extension does not exist', async () => {
            await expect(resolveEntry(resolve(testDir, 'pass/simple/nonexistent'))).rejects.toThrow();
        });
    });
});
