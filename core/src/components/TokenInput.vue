<template>
    <div class="token-field" :class="{ 'token-field--tax': taxAmount }">
        <button class="btn" @click="$emit('click')">
            <img :src="useTokenUrl(token?.logo)" alt="" width="25" height="25" />
            <small>{{ token?.ticker || "Select" }}</small>
            <svg role="presentation" focusable="false" aria-hidden="true">
                <use xlink:href="#woe-chevron_down" />
            </svg>
        </button>
        <span v-if="!isInput && loading" class="skeleton skeleton-field"></span>
        <input
            v-else
            ref="amountInput"
            type="text"
            :disabled="!isInput || !token"
            autocomplete="off"
            v-model="amount"
            :placeholder="isInput ? '0.00' : undefined"
            @input="$emit('input')"
        />
        <small v-if="!loading && amount" class="field-hint">
            <template v-if="token">
                {{ displayUSD }} {{ prettyFormatNumber(amount ? +amount : 0) }} {{ token.ticker }}
            </template>
            <template v-else> {{ displayUSD }} --- </template>
        </small>
    </div>
    <small v-if="amount && taxAmount && token" class="swap-tax"
        >total cost: {{ prettyFormatNumber(+amount) }} {{ token.ticker }} + {{ prettyFormatNumber(taxAmount) }}
        {{ token.ticker }} ({{ prettyFormatNumber(token.tax * 100) }}% fee)
    </small>
</template>

<script setup lang="ts">
import { useTokenDisplay } from "@nefty/use";
import { computed, ref } from "vue";
import { useTokenUrl } from "../composables";
import type { TokenItem } from "../types";
import { prettyFormatNumber } from "../utils";

const amountInput = ref<HTMLInputElement>();
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

const taxAmount = computed(() => {
    if (!amount.value) return 0;
    if (!token.value) return 0;

    return +amount.value * token.value.tax;
});

const displayUSD = computed(() => {
    if (!props.conversion || props.conversion === 0) return "";
    if (!amount.value) return "";

    return `${useTokenDisplay(+amount.value * props.conversion, 2)} USD ≈`;
});

const formatNumber = (value: string): string | number => {
    let formatValue = value.replace(/\s/g, "");
    formatValue = formatValue.replace(/,/g, ".");
    formatValue = formatValue.replace(/\\.*/g, ".");
    formatValue = formatValue.replace(/[^0-9.]/g, "");
    const numericValue = parseFloat(formatValue);
    if (Number.isNaN(numericValue) || formatValue.matchAll(/^.*\\.0*$/g)) {
        return formatValue;
    }
    return numericValue;
};
</script>
