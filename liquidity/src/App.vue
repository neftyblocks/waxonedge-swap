<template>
    <waxonedge-liquidity
        theme="dark"
        :wallet="wallet"
        :signing="signing"
        :lock="lockedLiquidity"
        @connect="connectEvent"
        @sign="signTransaction"
    ></waxonedge-liquidity>
</template>

<script setup lang="ts">
// this is needed because the component doesn't register itself
// if the project is build the `main.ce.ts` file is used and the
// component is registered.

import { defineCustomElement, ref } from "vue";
import Liquidity from "./components/Liquidity.ce.vue";
import type { Wallet } from "waxonedge-core";

const LiquidityElement = defineCustomElement(Liquidity);

customElements.define("waxonedge-liquidity", LiquidityElement);

const wallet = ref<Wallet | null>(null);

const lockedLiquidity = {
    // in: "usdt.alcor_USDT",
    // out: "eosio.token_WAX",
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
