<template>
    <waxonedge-swap
        theme="dark"
        :chart="true"
        :wallet="wallet"
        :swapping="swapping"
        :lock="locked"
        @connect="connectEvent"
        @sign="signTransaction"
    ></waxonedge-swap>
</template>

<script setup lang="ts">
// this is needed because the component doesn't register itself
// if the project is build the `main.ce.ts` file is used and the
// component is registered.

import { defineCustomElement, ref } from "vue";
import Swap from "./components/Swap.ce.vue";
import type { Wallet } from "./types";

const SwapElement = defineCustomElement(Swap);

customElements.define("waxonedge-swap", SwapElement);

const wallet = ref<Wallet | null>(null);

const locked = {};

const swapping = ref(false);

const connectEvent = () => {
    console.log("connecting wallet...");

    wallet.value = {
        accountName: "eosio.token",
        permission: "active",
    };
};

const signTransaction = ({ detail }: any) => {
    swapping.value = true;

    console.log("signing transaction...", detail[0]);

    setTimeout(() => {
        swapping.value = false;
    }, 1000);
};
</script>

<style lang="scss">
body {
    display: flex;
    justify-content: center;
    align-items: center;
    background-color: #262d36;
    // background-color: #fff;
    padding: 2.4rem;
}
</style>
