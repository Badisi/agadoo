import { describe, it, expect, vi } from 'vitest';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

import { resolveEntry } from '../src/cli-utils';
import { check } from '../src/index';

const testDir = fileURLToPath(new URL('.', import.meta.url));

const passFixtures = [
    { name: 'simple', entry: 'pass/simple/index.js' },
    { name: 'external-imports', entry: 'pass/external-imports/index.js' },
    { name: 'class', entry: 'pass/class/index.js' },
    { name: 'reexport', entry: 'pass/reexport/index.js' },
    { name: 'comments', entry: 'pass/comments/index.js' },
];

const failFixtures = [
    { name: 'side-effect', entry: 'fail/side-effect/index.js' },
    { name: 'transitive', entry: 'fail/transitive/index.js' },
];

describe('check', () => {
    describe('should pass (tree-shakeable)', () => {
        for (const { name, entry } of passFixtures) {
            it(name, async () => {
                const result = await check(resolve(testDir, entry));
                expect(result.isShaken).toBe(true);
            });
        }
    });

    describe('should fail (not tree-shakeable)', () => {
        for (const { name, entry } of failFixtures) {
            it(name, async () => {
                const result = await check(resolve(testDir, entry));
                expect(result.isShaken).toBe(false);
            });
        }
    });

    describe('directory input', () => {
        for (const { name, entry } of passFixtures) {
            it(name, async () => {
                const resolved = await resolveEntry(resolve(testDir, entry.replace('/index.js', '')));
                const result = await check(resolved!);
                expect(result.isShaken).toBe(true);
            });
        }

        for (const { name, entry } of failFixtures) {
            it(name, async () => {
                const resolved = await resolveEntry(resolve(testDir, entry.replace('/index.js', '')));
                const result = await check(resolved!);
                expect(result.isShaken).toBe(false);
            });
        }
    });

    describe('with custom rollup options', () => {
        it('forwards onwarn handler', async () => {
            const onwarn = vi.fn();
            const result = await check(resolve(testDir, 'pass/simple/index.js'), { onwarn });
            expect(result.isShaken).toBe(true);
            expect(onwarn).toHaveBeenCalledOnce();
            expect(onwarn).toHaveBeenCalledWith(
                expect.objectContaining({ code: 'EMPTY_BUNDLE' }),
                expect.any(Function)
            );
        });

        it('forwards external option', async () => {
            const result = await check(resolve(testDir, 'pass/external-imports/index.js'), {
                external: [/^foo$/],
            });
            expect(result.isShaken).toBe(true);
        });
    });
});
