<template>
    {{ title }}
    <small v-if="!price || selectedPair.pair_id">
        {{ useTokenDisplay(price || 0, 8) }} {{ selectedPair.in.ticker }}/{{ selectedPair.out.ticker }}
    </small>
    <button v-else @click="emits('click')" class="btn btn--link">
        <small> {{ useTokenDisplay(price, 8) }} {{ selectedPair.in.ticker }}/{{ selectedPair.out.ticker }} </small>
    </button>
</template>

<script setup lang="ts">
import { useTokenDisplay } from "@nefty/use";
import type { TokenList } from "waxonedge-core";
import { PropType } from "vue";

defineProps({
    title: {
        type: String,
        default: "",
    },
    selectedPair: {
        type: Object as PropType<TokenList>,
        required: true,
    },
    price: {
        type: Number,
        default: 0,
    },
});

const emits = defineEmits(["click"]);
</script>
