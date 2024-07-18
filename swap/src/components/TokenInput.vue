<template>
    <div v-if="token" class="token-field">
        <button class="btn" @click="$emit('click')">
            <img :src="useTokenUrl(token?.logo)" alt="" width="25" height="25" />
            <small>{{ token?.ticker }}</small>
            <svg role="presentation" focusable="false" aria-hidden="true">
                <use xlink:href="#woe-chevron_down" />
            </svg>
        </button>
        <span v-if="!isInput && loading" class="skeleton skeleton-field"></span>
        <input
            v-else
            type="text"
            :disabled="!isInput"
            autocomplete="off"
            v-model="amount"
            :placeholder="isInput ? '0.00' : undefined"
            @input="$emit('input')"
        />
        <small v-if="!loading && amount" class="field-hint">
            {{ displayUSD }} {{ prettyFormatNumber(amount ? +amount : 0) }} {{ token.ticker }}
        </small>
    </div>
</template>

<script setup lang="ts">
import { useTokenDisplay } from "@nefty/use";
import { computed } from "vue";
import { useTokenUrl } from "../composables";
import type { TokenItem } from "../types";
import { prettyFormatNumber } from "../utils";

const token = defineModel<TokenItem>("token");
const [amount, modifiers] = defineModel("amount", {
    get(v) {
        if (modifiers.read) {
            if (!v) return v;

            return (v as number).toFixed(token.value?.precision);
        }

        return v;
    },
    set(value: string) {
        if (modifiers.token) {
            const data = formatNumber(value);

            return data;
        }

        return value;
    },
});

const props = defineProps({
    isInput: Boolean,
    conversion: Number,
    loading: Boolean,
});

const emit = defineEmits(["input", "click"]);

const displayUSD = computed(() => {
    if (!props.conversion || props.conversion === 0) return "";
    if (!amount.value) return "";

    return `${useTokenDisplay(+amount.value * props.conversion, 2)} USD ≈`;
});

const formatNumber = (value: string): number => {
    let formatValue = value.replace(/\s/g, "");
    formatValue = formatValue.replace(/,/g, ".");
    formatValue = formatValue.replace(/[^0-9.]/g, "");

    return +formatValue;
};
</script>
