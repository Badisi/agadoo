<h1 align="center">
    @badisi/agadoo
</h1>

<p align="center">
    🍃 <i>Check whether a package is tree-shakeable.</i><br/>
</p>

<p align="center">
    <a href="https://www.npmjs.com/package/@badisi/agadoo">
        <img src="https://img.shields.io/npm/v/@badisi/agadoo.svg?color=blue&logo=npm" alt="npm version" /></a>
    <a href="https://npmcharts.com/compare/@badisi/agadoo?minimal=true">
        <img src="https://img.shields.io/npm/dw/@badisi/agadoo.svg?color=7986CB&logo=npm" alt="npm donwloads" /></a>
    <a href="https://github.com/Badisi/agadoo/blob/main/LICENSE">
        <img src="https://img.shields.io/npm/l/@badisi/agadoo.svg?color=ff69b4" alt="license" /></a>
</p>

<p align="center">
    <a href="https://github.com/Badisi/agadoo/actions/workflows/ci_tests.yml">
        <img src="https://img.shields.io/github/actions/workflow/status/badisi/agadoo/ci_tests.yml?logo=github" alt="build status" /></a>
    <a href="https://github.com/Badisi/agadoo/blob/main/CONTRIBUTING.md#-submitting-a-pull-request-pr">
        <img src="https://img.shields.io/badge/PRs-welcome-brightgreen.svg" alt="PRs welcome" /></a>
</p>

<hr/>

#### Tree-shaking

> It is a form of `dead-code elimination` that optimizes your production bundle size by removing unused code.
>
> With the advent of JavaScript modules (import and export), it is now possible to build libraries that are `tree-shakeable`. This means that a user of your library can import just the bits they need, without burdening their users with all the code they are *not* using. Modern bundlers use static analysis to track your export dependency graph, automatically pruning the "dead leaves" (unused exports) so that only active code ships to the browser.

<hr/>


## Getting started

This tool checks whether your JavaScript library is `tree-shakeable` by analyzing it with [Rollup](https://rollupjs.org).

> [!NOTE]
> This project is a revamp of the original [agadoo](https://github.com/Rich-Harris/agadoo) by [Rich Harris](https://github.com/Rich-Harris).


## Installation

```sh
npm install -g @badisi/agadoo
```

```sh
yarn add @badisi/agadoo
```


## Usage

```sh
bagadoo [path] [options]

# or without installation, using `npx` directly:
npx @badisi/agadoo [path] [options]
```


#### Arguments

| Argument | Description |
| :--- | :--- |
| `path` | Path to an entry file or package directory.</br>*Defaults to reading the `module` or `main` field from `package.json` in the current directory*. |


#### Options

| Option | Description |
| :--- | :--- |
| `-c, --config <file>` | Path to a Rollup config file for custom plugins, externals, etc. |
| `-v, --version` | Print version. |
| `-h, --help` | Show help message. |


#### Examples

* **Check the package in the current directory:**

```sh
bagadoo
```

* **Check a specific file:**

```sh
bagadoo dist/my-library.js
```

* **Check a package directory:**

```sh
bagadoo packages/my-lib
```

* **Use a custom Rollup config file to handle plugins or mark external dependencies:**

```sh
bagadoo --config rollup.config.js
```

* **Add it to your `prepublishOnly` script to prevent publishing if tree-shaking fails:**

```json
{
  "scripts": {
    "prepublishOnly": "bagadoo"
  }
}
```


## API

You can also use agadoo programmatically:

```ts
import { check } from '@badisi/agadoo';

const result = await check('./dist/my-library.js');
console.log(result.isShaken); // true or false
```

Pass custom Rollup options:

```ts
import { check } from '@badisi/agadoo';

const result = await check('./dist/my-library.js', {
  external: ['some-external-dep'],
  plugins: [myPlugin()]
});
```


## Help! my library isn't tree-shakeable

If tree-shaking fails, it means `Rollup` found side-effects in your code.

Here are common guidelines:

* Avoid transpilers like `Babel` and `Bublé` (if you're using TypeScript, target a modern JS version)
* Export plain functions — don't create instances of things on initial evaluation
* The output will show the code that remains after tree-shaking to help you diagnose the issue

If your library needs custom Rollup plugins (e.g., to handle non-standard file types), use the `--config` option.


## Development

See the [developer docs][developer].


## Contributing

#### > Want to Help ?

Want to file a bug, contribute some code or improve documentation ? Excellent!

But please read up first on the guidelines for [contributing][contributing], and learn about submission process, coding rules and more.

#### > Code of Conduct

Please read and follow the [Code of Conduct][codeofconduct] and help us keep this project open and inclusive.



[developer]: https://github.com/Badisi/agadoo/blob/main/DEVELOPER.md
[contributing]: https://github.com/Badisi/agadoo/blob/main/CONTRIBUTING.md
[codeofconduct]: https://github.com/Badisi/agadoo/blob/main/CODE_OF_CONDUCT.md
