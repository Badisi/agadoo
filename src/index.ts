import { rollup, type RollupOptions } from 'rollup';
import virtual from '@rollup/plugin-virtual';

export interface CheckResult {
    isShaken: boolean;
    code: string;
    warnings: string[];
}

export const check = async (path: string, rollupOptions?: Partial<RollupOptions>): Promise<CheckResult> => {
    const { plugins, onwarn, ...restOptions } = rollupOptions ?? {};
    const warnings: string[] = [];

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

    const { output } = await bundle.generate({ format: 'esm' });

    // Fix the orphaned region comments issue
    let openRegionsCount = 0;
    const processed = output[0].code.trim().split('\n').filter(line => {
        const trimmedLine = line.trim();
        if (trimmedLine.startsWith('//#region ')) {
            return ++openRegionsCount;
        } else if (trimmedLine.startsWith('//#endregion')) {
            return (openRegionsCount > 0) ? openRegionsCount-- : false;
        }
        return true;
    });
    const code = [...processed, ...Array(openRegionsCount).fill('//#endregion')].join('\n');
    // ---

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
