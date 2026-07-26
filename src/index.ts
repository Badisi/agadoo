import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { rollup, type RollupOptions } from 'rollup';
import virtual from '@rollup/plugin-virtual';
import { decode } from '@jridgewell/sourcemap-codec';

export interface CheckResult {
    isShaken: boolean;
    code: string;
    warnings: string[];
}

interface RegionGroup {
    region: string | null;
    lines: string[];
}

const buildLineToRegion = async (path: string): Promise<Map<number, string>> => {
    try {
        const sourceCode = await readFile(path, 'utf-8');
        const lineToRegion = new Map<number, string>();
        const lines = sourceCode.split('\n');
        let currentRegion = '';
        for (let i = 0; i < lines.length; i++) {
            const trimmed = lines[i].trim();
            if (trimmed.startsWith('//#region ')) {
                currentRegion = trimmed.slice('//#region '.length);
            } else if (trimmed.startsWith('//#endregion')) {
                currentRegion = '';
            } else if (currentRegion) {
                lineToRegion.set(i, currentRegion);
            }
        }
        return lineToRegion;
    } catch {
        return new Map();
    }
};

const findTargetSourceIndex = (sources: string[], targetPath: string): number => {
    const resolvedTarget = resolve(targetPath);
    for (let i = 0; i < sources.length; i++) {
        if (resolve(process.cwd(), sources[i]) === resolvedTarget) return i;
    }
    return -1;
};

export const check = async (path: string, rollupOptions?: Partial<RollupOptions>): Promise<CheckResult> => {
    const { plugins, onwarn, ...restOptions } = rollupOptions ?? {};
    const warnings: string[] = [];

    const lineToRegion = await buildLineToRegion(path);
    const useSourcemap = lineToRegion.size > 0;

    const bundle = await rollup({
        ...restOptions,
        input: '__badisi_agadoo__',
        plugins: [
            virtual({
                __badisi_agadoo__: `import * as __agadoo__ from ${JSON.stringify(path)}`
            }),
            ...(Array.isArray(plugins) ? plugins : (plugins ? [plugins] : [])),
        ],
        onwarn: (warning, handle) => {
            if (onwarn) {
                onwarn(warning, handle);
            } else if (warning.code !== 'EMPTY_BUNDLE') {
                warnings.push(warning.message);
            }
        },
    });

    const { output } = await bundle.generate({ format: 'esm', sourcemap: useSourcemap });

    let code = output[0].code.trim();

    if (useSourcemap) {
        // Strip Rollup's own region markers and sourceMappingURL from the output
        const rawLines = code.split('\n');
        const decoded = decode(output[0].map!.mappings);
        const outputLines: string[] = [];
        const filteredDecoded: ReturnType<typeof decode> = [];
        for (let i = 0; i < rawLines.length; i++) {
            const t = rawLines[i].trim();
            if (t.startsWith('//#region ') || t.startsWith('//#endregion') || t.startsWith('//# sourceMappingURL')) continue;
            outputLines.push(rawLines[i]);
            filteredDecoded.push(decoded[i] ?? []);
        }
        const targetSourceIndex = findTargetSourceIndex(output[0].map!.sources, path);

        const lineRegions: Array<{ line: string; region: string | null }> = [];
        for (let i = 0; i < outputLines.length; i++) {
            const segments = filteredDecoded[i];
            let region: string | null = null;
            if (segments && segments.length > 0 && targetSourceIndex >= 0) {
                for (const seg of segments) {
                    if (seg.length >= 4) {
                        if (seg[1] === targetSourceIndex) {
                            region = lineToRegion.get(seg[2]!) ?? null;
                        }
                        break;
                    }
                }
            }
            const trimmed = outputLines[i].trim();
            if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('import ') || trimmed.startsWith('/*') || trimmed.startsWith('*')) {
                region = null;
            }
            lineRegions.push({ line: outputLines[i], region });
        }

        const groups: RegionGroup[] = [];
        for (const item of lineRegions) {
            const last = groups[groups.length - 1];
            if (last && last.region === item.region) {
                last.lines.push(item.line);
            } else {
                groups.push({ region: item.region, lines: [item.line] });
            }
        }

        const result: string[] = [];
        for (const group of groups) {
            if (group.region !== null) {
                result.push(`//#region ${group.region}`);
                result.push(...group.lines);
                result.push('//#endregion');
            } else {
                result.push(...group.lines);
            }
        }
        code = result.join('\n');
    } else {
        // Fix orphaned region comments issue (no source regions to track)
        let openRegionsCount = 0;
        const processed = code.split('\n').filter(line => {
            const trimmedLine = line.trim();
            if (trimmedLine.startsWith('//#region ')) {
                return ++openRegionsCount;
            } else if (trimmedLine.startsWith('//#endregion')) {
                return (openRegionsCount > 0) ? openRegionsCount-- : false;
            }
            return true;
        });
        code = [...processed, ...Array(openRegionsCount).fill('//#endregion')].join('\n');
    }

    const isShaken = !code.split('\n').some(line => {
        const trimmedLine = line.trim();
        return trimmedLine
            && !trimmedLine.startsWith('import ')
            && !trimmedLine.startsWith('//')
            && !trimmedLine.startsWith('/*')
            && !trimmedLine.startsWith('*')
            && !trimmedLine.startsWith('*/');
    });
    return { isShaken, code, warnings };
};
