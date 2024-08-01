<template>
    <button class="btn-clear" @click="flip = !flip">
        1 {{ flip ? selectedPair.out.ticker : selectedPair.in.ticker }} ≈
        {{
            price
                ? flip
                    ? useTokenDisplay(price, selectedPair.in.precision)
                    : useTokenDisplay(1 / price, selectedPair.out.precision)
                : 0
        }}
        {{ flip ? selectedPair.in.ticker : selectedPair.out.ticker }}

        <svg role="presentation" focusable="false" aria-hidden="true">
            <use xlink:href="#woe-swap" />
        </svg>
    </button>
</template>

<script setup lang="ts">
import { useTokenDisplay } from "@nefty/use";
import type { TokenList } from "../types";
import { PropType, ref } from "vue";

const flip = ref(false);

defineProps({
    selectedPair: {
        type: Object as PropType<TokenList>,
        required: true,
    },
    price: {
        type: Number,
        default: 0,
    },
});
</script>
