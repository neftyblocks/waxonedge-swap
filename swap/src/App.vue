<template>
    <waxonedge-swap
        theme="dark"
        :chart="false"
        :wallet="wallet"
        :signing="signing"
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
import type { Wallet } from "waxonedge-core";

const SwapElement = defineCustomElement(Swap);

customElements.define("waxonedge-swap", SwapElement);

const wallet = ref<Wallet | null>(null);

const locked = {
    // in: "usdt.alcor_USDT,token.nefty_NEFTY,eosio.token_WAX",
    // out: "usdt.alcor_USDT,token.nefty_NEFTY,eosio.token_WAX",
};
const signing = ref(false);

const connectEvent = () => {
    wallet.value = {
        accountName: "eosio.null",
        permission: "active",
    };
};

const signTransaction = ({ detail }: any) => {
    signing.value = true;

    console.log("signing transaction...", detail[0]);

    setTimeout(() => {
        signing.value = false;
    }, 1000);
};
</script>

<style lang="scss">
body {
    display: flex;
    justify-content: center;
    align-items: center;
    background-color: #262d36;
    flex-direction: column;
    // background-color: #fff;
    padding: 2.4rem;

    font-family: sans-serif;
    color: white;
}
</style>
