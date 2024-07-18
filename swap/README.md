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
