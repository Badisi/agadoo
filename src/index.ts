import { rollup } from 'rollup';
import type { RollupOptions } from 'rollup';
import virtual from '@rollup/plugin-virtual';

export interface CheckResult {
    isShaken: boolean;
    code: string;
}

export const check = async (path: string, rollupOptions?: Partial<RollupOptions>): Promise<CheckResult> => {
    const { plugins, onwarn, ...restOptions } = rollupOptions ?? {};

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
                handle(warning);
            }
        },
    });

    const { output } = await bundle.generate({ format: 'esm' });
    const code = output[0].code.trim();
    const isShaken = !code.split('\n').some(line => {
        const t = line.trim();
        return t && !t.startsWith('import ') && !t.startsWith('//#region') && !t.startsWith('//#endregion');
    });
    return { isShaken, code };
};
