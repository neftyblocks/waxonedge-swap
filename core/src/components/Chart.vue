<template>
    <div v-if="pair" class="chart">
        <header>
            <button class="btn-clear" v-if="localInput && localOutput" @click="flip = !flip">
                1 {{ flip ? localOutput.ticker : localInput.ticker }} ≈
                {{
                    last
                        ? flip
                            ? useTokenDisplay(1 / +last.close, localInput.precision)
                            : useTokenDisplay(last.close, localOutput.precision)
                        : 0
                }}
                {{ flip ? localInput.ticker : localOutput.ticker }}

                <svg role="presentation" focusable="false" aria-hidden="true">
                    <use xlink:href="#woe-swap" />
                </svg>
            </button>

            <p :style="`color: ${priceDifferencePercentage > 0 ? 'var(--success)' : 'var(--error)'}`">
                {{ useTokenDisplay(priceDifferencePercentage, 2) }} %
            </p>
        </header>
        <svg
            role="presentation"
            focusable="false"
            aria-hidden="true"
            :style="style"
            :viewBox="`0 0 ${viewBoxWidth} ${viewBoxHeight}`"
        >
            <defs>
                <linearGradient :id="id" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stop-color="currentColor" />
                    <stop offset="100%" stop-color="var(--bg)" />
                </linearGradient>
            </defs>

            <polygon :points="`0,${viewBoxHeight} ${points} ${viewBoxWidth},${viewBoxHeight}`" :fill="`url(#${id})`" />

            <polyline
                fill="none"
                stroke="currentColor"
                stroke-linecap="round"
                stroke-linejoin="round"
                :stroke-width="lineWidth"
                :points="points"
            />
        </svg>
    </div>
</template>

<script setup lang="ts">
import { useTokenDisplay } from "@nefty/use";
import { type PropType, computed, onMounted, ref } from "vue";
import { useCandles } from "../composables/candle";
import type { OHLCVCustom, TokenItem } from "../types";

const viewBoxHeight = 100;
const viewBoxWidth = 600;
const lineWidth = 2;
const { cache, getCandle } = useCandles();

const points = ref("");
const style = ref("");
const localInput = ref<TokenItem>();
const localOutput = ref<TokenItem>();
const flip = ref(false);

const data = ref<OHLCVCustom[]>([]);

const props = defineProps({
    exchange: {
        type: String,
        required: true,
    },
    pair: {
        type: String,
        required: true,
    },
    input: {
        type: Object as PropType<TokenItem>,
        required: true,
    },
    output: {
        type: Object as PropType<TokenItem>,
        required: true,
    },
});

const priceDifferencePercentage = computed(() => {
    if (!data.value?.length) return 0;

    return ((+data.value[data.value.length - 1].close - +data.value[0].close) / +data.value[0].close) * 100;
});

const last = computed(() => (data.value ? data.value[data.value.length - 1] : null));

const id = computed(() => `${props.exchange}-${props.pair}`);

onMounted(async () => {
    localInput.value = props.input;
    localOutput.value = props.output;

    if (cache.value[id.value]) {
        data.value = cache.value[id.value];
    } else {
        data.value = await getCandle(props.exchange, props.pair);
    }

    createChart();
});

const createChart = () => {
    if (data.value.length <= 1) {
        const shared = viewBoxWidth / 24;
        for (let i = 0; i < 24; i++) {
            points.value += `${shared * i}, 50 `;
        }

        style.value = `color: var(--neutral);`;

        return;
    }

    const shared = viewBoxWidth / data.value.length;
    const closingPrices: number[] = data.value.map((p) => +p.close);

    // Find the minimum and maximum closing prices
    const minPrice: number = Math.min(...closingPrices);
    const maxPrice: number = Math.max(...closingPrices);

    for (let i = 0; i < data.value.length; i++) {
        const { close } = data.value[i];

        // Scale the average price to fit within the range of 0 to 100
        const scaledValue: number = 100 - ((+close - minPrice) / (maxPrice - minPrice)) * viewBoxHeight;

        points.value += `${shared * i},${scaledValue} `;
    }

    if (data.value[0].close < data.value[data.value.length - 1].close) {
        style.value = `color: var(--success);`;
    } else style.value = `color: var(--error);`;
};
</script>
