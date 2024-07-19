# WaxOnEdge Swap

[![npm bundle size](https://img.shields.io/bundlephobia/min/@waxonedge/swap?style=flat)](https://www.npmjs.org/package/@waxonedge/swap)
[![npm](https://img.shields.io/npm/dw/@waxonedge/swap?style=flat)](https://www.npmjs.org/package/@waxonedge/swap)
[![npm](https://img.shields.io/npm/v/@waxonedge/swap?style=flat)](https://www.npmjs.org/package/@waxonedge/swap)

> ⚠️ This component is still in development and we will change how it works until we have hit a stable V1.0.0.

A component for swapping tokens in the WAX ecosystem. the component is created to use the WaxOnEdge system for optimal routing and best in class swapping.

#### What does this component include?

-   🎨 Customizable look (dark and light theme included)
-   💲 Swapping all WAX tokens
-   📈 Chart for tokens trend (Optional)
-   🚀 Easy signable transaction (wallet login not included)

## 🚀 Usage

First of all, you need to install the library:

#### Package manager

1. Type in the terminal:

```bash
    # install dependencies
    $ npm i @waxonedge/swap

    # pnpm
    $ pnpm add @waxonedge/swap

    # or yarn
    $ yarn add @waxonedge/swap
```

2. Include in your javascript/typescript file:

```js
import "@waxonedge/swap";

// or if vue@^3.x.x is already used in your code
import "@waxonedge/swap/dist/vueless";
```

3. Place in your HTML where you want to embed the market:

```html
<waxonedge-swap theme="dark" chart="true"></waxonedge-swap>
```

```js
const component = document.querySelector("waxonedge-swap");

// user wants to connect wallet
component.addEventListener("connect", () => {});

// user wants to sign transaction
component.addEventListener("sign", ({ detail }) => {
    // swapping is started
    component.addAttribute("swapping", "true");

    const actions = detail[0];

    // ... sign transaction

    component.removeAttribute("swapping");
});
```

## 🎛 Options

Options are placed the element as `attributes` with a `value`.
which looks as follows:

```html
<waxonedge-swap theme="dark" chart="true"></waxonedge-swap>
```

| Attribute  | Value                     | Default | Description                                                                     |
| ---------- | ------------------------- | ------- | ------------------------------------------------------------------------------- |
| `theme`    | `light \ dark`            | `dark`  | which color scheme it should use.                                               |
| `chart`    | `boolean`                 | `false` | shows a small chart with 48 hour token info. **WORK IN PROGRESS**               |
| `wallet`   | [see wallet type](#types) | None    | the user wallet to create actions and get balances from.                        |
| `lock`     | [see lock type](#types)   | None    | lock in and output tokens.                                                      |
| `swapping` | `boolean`                 | `false` | letting the component know that it is swapping. and should show a loading state |
| `config`   | [see config type](#types) | None    | custom config for **DEVELOPMENT**                                               |

## 🙌 Events

Events are placed the element as `listeners`.

```js
const component = document.querySelector("waxonedge-swap");

component.addEventListener("connect", () => {});
```

| event     | Value                   | Description                                                                 |
| --------- | ----------------------- | --------------------------------------------------------------------------- |
| `connect` | `void`                  | buttons to connect wallet has been pressed (if wallet attribute is empty)   |
| `sign`    | [see sign type](#types) | button to swap has been pressed and the user wants to sign the transaction. |

### types

special attributes that needs to be formatted in a specific way

-   wallet:
    ```ts
    {
        accountName: string;
        permission: string;
    }
    ```
-   lock:

    ```ts
    {
        in: string | undefined;
        out: string | undefined;
    }
    ```

    `in` and `out` is a list of tokens `contract_symbol` separated by `,`. example: `usdt.alcor_USDT,token.nefty_NEFTY,eosio.token_WAX`

    both in or out can be `undefined` to not lock in or out.

-   config:
    ```ts
    {
        API: string;
        RATES_API: string;
        CHAIN_API: string;
        CHAIN: "wax" | "waxtest";
    }
    ```
-   sign:

    ```ts
        {
            // first item in the array are the actions
            detail: [action[],];
        }
    ```

    select the first item in the array `detail[0]` to get the actions to sign

## 🎨 Styling

To get your look and feel to match your project, can customize by using [css variables](https://www.w3schools.com/css/css3_variables.asp).

either place this in your `style.css` css file or add a `<style> ... css here ... </style>` tag in your HTML.

```scss
:root {
    --index: var(--waxonedge-index, 0);
    // space is equal to 10px
    --space: var(--waxonedge-space, 0.625rem);
    --space-x: calc(var(--space) * 10);

    --spacing: calc(var(--space) * 2.4);
    --radius: calc(var(--space) * 1.2);

    // font sizing
    --font-s: calc(var(--font) * 0.85);
    --font: var(--waxonedge-font, 0.9rem);
    --font-m: calc(var(--font) * 1.85);

    // style
    --theme-bg: var(--waxonedge-bg, #1c2128);
    --theme-bg-inverted: var(--waxonedge-bg-inverted, #e3e3e3);

    --theme-shadow: var(--waxonedge-shadow, rgba(255, 255, 255, 0.1));
    --theme-shadow-modal: var(--waxonedge-shadow-modal, rgba(0, 0, 0, 0.5));
    --theme-shadow-inverted: var(--waxonedge-shadow-inverted, rgba(0, 0, 0, 0.1));

    --theme-highlight: var(--waxonedge-highlight, #10e994);

    --theme-success: var(--waxonedge-success, #12de8d);
    --theme-error: var(--waxonedge-error, #cd1313);
    --theme-neutral: var(--waxonedge-neutral, #757f91);

    --theme-green: var(--waxonedge-green, #10e994);
    --theme-yellow: var(--waxonedge-yellow, #f7d700);
    --theme-orange: var(--waxonedge-orange, #f79800);
    --theme-red: var(--waxonedge-red, #cd1313);

    --theme-color: var(--waxonedge-color, #dce1ea);
    --theme-color-subtle: var(--waxonedge-color-subtle, #757f91);
    --theme-color-inverted: var(--waxonedge-color-inverted, #1c2128);
    --theme-color-subtle-inverted: var(--waxonedge-color-subtle-inverted, #535c69);

    --theme-border: var(--waxonedge-border, #344150);
    --theme-border-inverted: var(--waxonedge-border-inverted, #b6b6b6);

    // input
    --theme-input: var(--waxonedge-input, #1c2128);
    --theme-input-color: var(--waxonedge-input-color, #dce1ea);
    --theme-input-border: var(--waxonedge-input-border, #344150);

    --theme-input-inverted: var(--waxonedge-input-inverted, #ffffff);
    --theme-input-color-inverted: var(--waxonedge-input-color-inverted, #1c2128);
    --theme-input-border-inverted: var(--waxonedge-input-border-inverted, #b6b6b6);

    // btn
    --theme-btn: var(--waxonedge-btn, #1c2128);
    --theme-btn-color: var(--waxonedge-btn-color, #dce1ea);
    --theme-btn-border: var(--waxonedge-btn-border, #344150);

    --theme-btn-inverted: var(--waxonedge-btn-inverted, #fafafa);
    --theme-btn-color-inverted: var(--waxonedge-btn-color-inverted, #1c2128);
    --theme-btn-border-inverted: var(--waxonedge-btn-border-inverted, #b6b6b6);
}
```

### 🪄 Advanced Styling Options

For more options we partially support the use of `::part` which will give you full control to overwrite styling. [read more about ::part](https://developer.mozilla.org/en-US/docs/Web/CSS/::part)

To see what you can style look at the HTML in the inspector and look for the attribute `part="..."`

```css
waxonedge-swap::part(part-name) {
    /* override the styling */
}
```
