import { defineCustomElement } from "vue";
import Swap from "./components/Swap.ce.vue";

// convert into custom element constructor
const SwapElement = defineCustomElement(Swap);

// register
customElements.define("waxonedge-swap", SwapElement);
