import { rollup } from 'rollup';
import virtual from '@rollup/plugin-virtual';

export const check = async (path: string): Promise<{ isShaken: boolean; code: string }> => {
    const bundle = await rollup({
        input: '__badisi_agadoo__',
        plugins: [
            virtual({
                __badisi_agadoo__: `import * as __agadoo__ from ${JSON.stringify(path)}`
            })
        ],
        onwarn: (warning, handle) => {
            if (warning.code !== 'EMPTY_BUNDLE') handle(warning);
        }
    });

    const { output } = await bundle.generate({ format: 'esm' });
    const code = output[0].code.trim();
    const isShaken = !code.split('\n').some(line => {
        const t = line.trim();
        return t && !t.startsWith('import ') && !t.startsWith('//#region') && !t.startsWith('//#endregion');
    });
    return { isShaken, code };
};
