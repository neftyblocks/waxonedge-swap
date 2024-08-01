import { defineCustomElement } from "vue";
import Liquidity from "./components/Liquidity.ce.vue";

// convert into custom element constructor
const LiquidityElement = defineCustomElement(Liquidity);

// register
customElements.define("waxonedge-liquidity", LiquidityElement);
