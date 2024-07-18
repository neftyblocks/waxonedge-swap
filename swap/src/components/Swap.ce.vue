<template>
    <Sprite />
    <main class="swap" :class="theme">
        <header class="swap-header">
            <button class="btn" @click="refresh">
                <svg role="presentation" focusable="false" aria-hidden="true">
                    <use xlink:href="#woe-refresh" />
                </svg>
            </button>
            <button class="btn settings" @click="showSettings = !showSettings">
                <small> {{ settings.slippage }}% </small>
                <svg role="presentation" focusable="false" aria-hidden="true">
                    <use xlink:href="#woe-settings" />
                </svg>
            </button>
            <div v-if="showSettings" class="settings-modal" ref="settingsModal">
                <div class="field">
                    <label for="woe-slippage">slippage</label>
                    <input
                        id="woe-slippage"
                        type="number"
                        :value="settings.slippage"
                        min="0.5"
                        step="0.1"
                        max="100"
                        @input="setSlippage"
                    />
                </div>
            </div>
        </header>
        <section class="swap-container">
            <header class="swap-input-header">
                <label>Selling</label>
                <button
                    v-if="!loadingInit && normalizedWallet && selectedPair"
                    class="btn-clear"
                    @click="setInputAmount(getBalanceByToken(selectedPair!.in))"
                >
                    <span>{{ getBalanceByToken(selectedPair!.in) }} {{ selectedPair!.in.ticker }}</span>

                    <svg role="presentation" focusable="false" aria-hidden="true">
                        <use xlink:href="#woe-wallet" />
                    </svg>
                </button>
            </header>
            <span v-if="loadingInit" class="skeleton skeleton-input"></span>
            <TokenInput
                v-else-if="selectedPair"
                v-model:amount.token="inputValue"
                :is-input="true"
                :conversion="conversion.in"
                v-model:token="selectedPair!.in"
                :loading="loadingRoute || loading"
                :class="{ 'token-field--tax': taxAmount }"
                @input="hasInputUpdate"
                @click="triggerModal('in')"
            />
            <small v-if="taxAmount" class="swap-tax"
                >total cost: {{ prettyFormatNumber(inputValue) }} {{ selectedPair!.in.ticker }} +
                {{ prettyFormatNumber(taxAmount) }} {{ selectedPair!.in.ticker }} ({{
                    prettyFormatNumber(selectedPair!.in.tax * 100)
                }}% fee)
            </small>
            <button class="btn btn--center" @click="switchSelected">
                <svg role="presentation" focusable="false" aria-hidden="true">
                    <use xlink:href="#woe-swap" />
                </svg>
            </button>
            <header class="swap-input-header">
                <label>Buying</label>
                <button v-if="!loadingInit && normalizedWallet && selectedPair" class="btn-clear" disabled="true">
                    <span>{{ getBalanceByToken(selectedPair!.out) }} {{ selectedPair!.out.ticker }}</span>

                    <svg role="presentation" focusable="false" aria-hidden="true">
                        <use xlink:href="#woe-wallet" />
                    </svg>
                </button>
            </header>
            <span v-if="loadingInit" class="skeleton skeleton-input"></span>
            <TokenInput
                v-else-if="selectedPair"
                v-model:amount.read="outputValue"
                v-model:token="selectedPair!.out"
                :conversion="conversion.out"
                :loading="loadingRoute || loading"
                @click="triggerModal('out')"
            />

            <button
                v-if="normalizedWallet"
                class="btn btn--center btn--big"
                :disabled="normalizedSwapping || !outputValue"
                @click="swapToken"
            >
                {{ !outputValue ? "waiting for input" : normalizedSwapping ? "Signing..." : "Swap" }}
            </button>
            <button v-else class="btn btn--center btn--big" @click="emit('connect')">Connect wallet</button>
        </section>
        <section class="swap-info" part="swap-info">
            <header>
                <button class="btn-clear" v-if="selectedPair" @click="flip = !flip">
                    1 {{ flip ? selectedPair.out.ticker : selectedPair.in.ticker }} ≈
                    {{
                        lastPrice
                            ? flip
                                ? useTokenDisplay(1 / lastPrice, selectedPair.in.precision)
                                : useTokenDisplay(lastPrice, selectedPair.out.precision)
                            : 0
                    }}
                    {{ flip ? selectedPair.in.ticker : selectedPair.out.ticker }}

                    <svg role="presentation" focusable="false" aria-hidden="true">
                        <use xlink:href="#woe-swap" />
                    </svg>
                </button>

                <button
                    v-if="selectedPair"
                    class="btn-clear"
                    :class="{ active: showPriceInfo }"
                    @click="() => (showPriceInfo = !showPriceInfo)"
                >
                    {{ showPriceInfo ? "Hide" : "Show" }} price info
                    <svg role="presentation" focusable="false" aria-hidden="true">
                        <use xlink:href="#woe-chevron_down" />
                    </svg>
                </button>
            </header>
            <ul v-if="showPriceInfo && selectedPair" class="swap-info-list">
                <li :class="priceImpactIndicator(priceImpact)">
                    Price impact
                    <small
                        >{{ priceImpact ? `${prettyFormatNumber(priceImpact * 100)}` : prettyFormatNumber(0) }}%</small
                    >
                </li>
                <li>
                    Minimum received
                    <small>{{
                        minimumReceived
                            ? `${useTokenDisplay(minimumReceived, selectedPair.out.precision)} ${
                                  selectedPair.out.ticker
                              }`
                            : "---"
                    }}</small>
                </li>
                <li>
                    Token transfer fee
                    <small
                        >{{
                            selectedPair.in.tax
                                ? `${prettyFormatNumber(selectedPair.in.tax * 100)}`
                                : prettyFormatNumber(0)
                        }}%</small
                    >
                </li>
                <li>
                    Fees <small>{{ fees ? `${prettyFormatNumber(fees / 100)}` : prettyFormatNumber(0) }}%</small>
                </li>
            </ul>
        </section>
        <template v-if="normalizedChart">
            <Chart
                v-if="selectedPair"
                :exchange="selectedPair.exchange"
                :pair="selectedPair.pair_id || ''"
                :input="selectedPair!.in"
                :output="selectedPair!.out"
            />
            <span v-else class="skeleton skeleton-chart"> </span>
        </template>
        <footer class="swap-footer" part="swap-footer">
            <a class="author" href="https://waxonedge.app" target="_blank" rel="noopener" :class="theme">
                powered by WaxOnEdge
            </a>
        </footer>
        <TokenModal
            v-if="showModal"
            :wallet="normalizedWallet"
            :filter="filterLock"
            @click="showModal = false"
            @select="setNewToken"
        />
    </main>
</template>

<script setup lang="ts">
import { useTokenDisplay } from "@nefty/use";
import { onClickOutside, useDebounceFn } from "@vueuse/core";
import { type PropType, computed, ref, watch } from "vue";
import { useAccount, useEndpointsConfig, useSwap } from "../composables";
import type { EndpointsConfig, TokenList, Wallet } from "../types";
import { prettyFormatNumber } from "../utils";

import { useCandles } from "../composables/candle";
import Chart from "./Chart.vue";
// Components
import Sprite from "./Sprite.vue";
import TokenInput from "./TokenInput.vue";
import TokenModal from "./TokenModal.vue";

const emit = defineEmits<{
    connect: [];
    sign: [any[]];
}>();

const props = defineProps({
    // light or dark
    theme: {
        type: String,
        default: "dark",
    },
    chart: {
        type: [String, Boolean],
        default: true,
    },
    wallet: {
        type: [String, Object] as PropType<string | Wallet>,
        default: null,
    },
    lock: {
        type: [String, Object] as PropType<string | Lock>,
        default: null,
    },
    preset: {
        type: String,
        default: "",
    },
    swapping: {
        type: [String, Boolean],
        default: false,
    },
    endpoints: {
        type: [String, Object] as PropType<string | EndpointsConfig>,
        required: false,
    },
});

const showModal = ref(false);
const flip = ref(false);
const showPriceInfo = ref(false);
const showSettings = ref(false);
const settingsModal = ref();
const loading = ref(false);
const whichTokenToUpdate = ref("in");
const fees = ref(0);
const minimumReceived = ref(0);
const priceImpact = ref(0);
const lastPrice = ref(0);
const inputValue = ref();
const outputValue = ref();
const actionsRaw = ref([]);
const inverted = ref(false);
const taxAmount = ref(0);
const [, setEndpointsConfig] = useEndpointsConfig();

const normalizedEndpoints = computed(() => {
    if (typeof props.endpoints === "string") return JSON.parse(props.endpoints);
    return props.endpoints;
});

if (normalizedEndpoints.value) {
    setEndpointsConfig(normalizedEndpoints.value);
}

watch(normalizedEndpoints, (value) => {
    if (value) setEndpointsConfig(value);
});

const normalizedChart = computed(() => {
    if (typeof props.chart === "string") return props.chart === "true" ? true : props.chart === "" ? true : false;

    return props.chart;
});

const normalizedSwapping = computed(() => {
    if (typeof props.swapping === "string")
        return props.swapping === "true" ? true : props.swapping === "" ? true : false;

    return props.swapping;
});

const normalizedWallet = computed(() => {
    if (!props.wallet) return null;
    else {
        if (typeof props.wallet === "string") return JSON.parse(props.wallet);

        return props.wallet;
    }
});

const normalizedLock = computed(() => {
    if (typeof props.lock === "string") return JSON.parse(props.lock);
    return props.lock;
});

const filterLock = computed<string[] | undefined>(() => {
    const inOut = inverted.value ? ["out", "in"] : ["in", "out"];
    const select = inOut[whichTokenToUpdate.value === "in" ? 0 : 1];
    return normalizedLock.value ? normalizedLock.value[select]?.split(",") : undefined;
});

const { loadingInit, loadingRoute, selectedPair, conversion, settings, getRoute, getPairId, updateWaxPrice } = useSwap(
    props.preset,
    normalizedLock.value
);
const { getLastPrice } = useCandles();
const { getBalanceByToken, updateBalances } = useAccount(normalizedWallet);

onClickOutside(settingsModal, () => {
    showSettings.value = false;
});

watch(normalizedSwapping, () => {
    if (!loadingInit.value && !normalizedSwapping.value) {
        inputValue.value = undefined;
        outputValue.value = undefined;
        actionsRaw.value = [];
        showModal.value = false;
        loading.value = false;

        setTimeout(() => {
            refresh();
        }, 2000);
    }
});

watch(selectedPair, async () => {
    if (selectedPair.value && selectedPair.value.pair_id) {
        lastPrice.value = await getLastPrice(selectedPair.value.exchange, selectedPair.value.pair_id);
    }
});

const priceImpactIndicator = (value: number) => {
    if (!value) return "";
    else if (value < 0.01) return "green";
    else if (value < 0.025) return "yellow";
    else if (value < 0.05) return "orange";
    else return "red";
};

const triggerModal = (token: "in" | "out") => {
    whichTokenToUpdate.value = token;
    showModal.value = true;
};

const setNewToken = async (token: TokenList) => {
    if (!selectedPair.value) return;

    outputValue.value = undefined;
    showModal.value = false;
    loading.value = true;

    const clone = { ...selectedPair.value };
    selectedPair.value = null;

    const updateInput = whichTokenToUpdate.value === "in";
    if (updateInput) {
        inputValue.value = undefined;
        clone.in = token.in;
    } else {
        clone.out = token.in;
    }

    // Reset selection when selecting the same token
    const isSameToken = clone.in.ticker === clone.out.ticker && clone.in.contract === clone.out.contract;
    if (isSameToken && updateInput) {
        clone.in = token.in;
        clone.out = token.out;
    } else if (isSameToken) {
        clone.out = token.in;
        clone.in = token.out;
    }

    selectedPair.value = clone;

    setTimeout(async () => {
        const pairId = await getPairId(
            `${selectedPair.value?.in.ticker}_${selectedPair.value?.in.contract}`,
            `${selectedPair.value?.out.ticker}_${selectedPair.value?.out.contract}`
        );

        selectedPair.value!.pair_id = pairId;
        await updateConversion();
        await hasInputUpdate();

        loading.value = false;
    }, 100);
};

const setInputAmount = (amount: number) => {
    inputValue.value = amount;

    hasInputUpdate();
};

const setSlippage = (e: Event) => {
    const { value } = e.target as HTMLInputElement;
    settings.value.slippage = +value;

    hasInputUpdate();
};

const hasInputUpdate = useDebounceFn(async () => {
    if (!inputValue.value || inputValue.value === 0) {
        outputValue.value = undefined;
        taxAmount.value = 0;
        fees.value = 0;
        minimumReceived.value = 0;
        priceImpact.value = 0;
    } else {
        // deref input
        let inputAmount = inputValue.value;

        if (selectedPair.value?.in.tax) {
            const balance = getBalanceByToken(selectedPair.value!.in);
            const total = balance / (1 + selectedPair.value?.in.tax);

            taxAmount.value = inputAmount * selectedPair.value?.in.tax;

            if (balance <= inputAmount + taxAmount.value) {
                inputAmount = total;
            }
        }

        const route = await getRoute(inputAmount, normalizedWallet.value?.accountName || "");

        if (route) {
            inputValue.value = route.amount_in;
            outputValue.value = route.amount_received;
            actionsRaw.value = route.actions;
            fees.value = route.fees + route.platform_fees;
            minimumReceived.value = route.minimum_received;
            priceImpact.value = route.price_impact;
            lastPrice.value = 1 / route.route_price;
        }
    }
}, 500);

const updateConversion = async () => {
    fees.value = 0;
    minimumReceived.value = 0;
    priceImpact.value = 0;
    if (selectedPair.value) {
        await Promise.all([
            updateWaxPrice(selectedPair.value.in.contract, selectedPair.value.in.ticker, true),
            updateWaxPrice(selectedPair.value.out.contract, selectedPair.value.out.ticker, false),
        ]);
    }
};

const switchSelected = async () => {
    if (selectedPair.value) {
        inverted.value = !inverted.value;
        loading.value = true;
        const clone = { ...selectedPair.value };

        // swap in and out
        clone.in = clone.out;
        clone.out = selectedPair.value.in;

        inputValue.value = outputValue.value;
        outputValue.value = undefined;
        taxAmount.value = 0;

        selectedPair.value = clone;

        hasInputUpdate();

        await updateConversion();
        loading.value = false;
    }
};

const refresh = async () => {
    loading.value = true;
    await Promise.all([updateBalances(), hasInputUpdate(), updateConversion()]);
    loading.value = false;
};

const swapToken = () => {
    if (actionsRaw.value.length === 0 && !normalizedWallet.value && !selectedPair.value) return;

    const authorization = [
        {
            actor: normalizedWallet.value.accountName,
            permission: normalizedWallet.value.permission,
        },
    ];

    const removeRef = actionsRaw.value.map((action: Object) => {
        return {
            from: normalizedWallet.value.accountName,
            ...action,
        };
    });

    const actions = [
        {
            account: "swap.we",
            name: "madeonwoe",
            authorization,
            data: {},
        },
    ];

    for (let i = 0; i < removeRef.length; i++) {
        const data = removeRef[i];

        actions.push({
            account: selectedPair.value!.in.contract,
            name: "transfer",
            authorization,
            data,
        });
    }

    emit("sign", actions);
};
</script>

<style lang="scss">
@import "./../scss/style.scss";

:host {
    --index: var(--waxonedge-index, 0);
    // space is equal to 10px
    --space: var(--waxonedge-space, 0.625rem);
    --space-x: calc(var(--space) * 10);

    --spacing: calc(var(--space) * 2.4);
    --radius: calc(var(--space) * 1.2);

    // font sizing
    --font-s: calc(var(--font) * 0.85);
    --font: var(--waxonedge-font, 0.9rem);
    --font-m: calc(var(--font) * 1.85);

    // style
    --theme-bg: var(--waxonedge-bg, #1c2128);
    --theme-bg-inverted: var(--waxonedge-bg-inverted, #e3e3e3);

    --theme-shadow: var(--waxonedge-shadow, rgba(255, 255, 255, 0.1));
    --theme-shadow-modal: var(--waxonedge-shadow-modal, rgba(0, 0, 0, 0.5));
    --theme-shadow-inverted: var(--waxonedge-shadow-inverted, rgba(0, 0, 0, 0.1));

    --theme-highlight: var(--waxonedge-highlight, #10e994);

    --theme-success: var(--waxonedge-success, #12de8d);
    --theme-error: var(--waxonedge-error, #cd1313);
    --theme-neutral: var(--waxonedge-neutral, #757f91);

    --theme-green: var(--waxonedge-green, #10e994);
    --theme-yellow: var(--waxonedge-yellow, #f7d700);
    --theme-orange: var(--waxonedge-orange, #f79800);
    --theme-red: var(--waxonedge-red, #cd1313);

    --theme-color: var(--waxonedge-color, #dce1ea);
    --theme-color-subtle: var(--waxonedge-color-subtle, #757f91);
    --theme-color-inverted: var(--waxonedge-color-inverted, #1c2128);
    --theme-color-subtle-inverted: var(--waxonedge-color-subtle-inverted, #535c69);

    --theme-border: var(--waxonedge-border, #344150);
    --theme-border-inverted: var(--waxonedge-border-inverted, #b6b6b6);

    // input
    --theme-input: var(--waxonedge-input, #1c2128);
    --theme-input-color: var(--waxonedge-input-color, #dce1ea);
    --theme-input-border: var(--waxonedge-input-border, #344150);

    --theme-input-inverted: var(--waxonedge-input-inverted, #ffffff);
    --theme-input-color-inverted: var(--waxonedge-input-color-inverted, #1c2128);
    --theme-input-border-inverted: var(--waxonedge-input-border-inverted, #b6b6b6);

    // btn
    --theme-btn: var(--waxonedge-btn, #1c2128);
    --theme-btn-color: var(--waxonedge-btn-color, #dce1ea);
    --theme-btn-border: var(--waxonedge-btn-border, #344150);

    --theme-btn-inverted: var(--waxonedge-btn-inverted, #fafafa);
    --theme-btn-color-inverted: var(--waxonedge-btn-color-inverted, #1c2128);
    --theme-btn-border-inverted: var(--waxonedge-btn-border-inverted, #b6b6b6);

    font-family: sans-serif;
}

main {
    width: calc(var(--space-x) * 2.5);
    z-index: var(--index);
    position: relative;

    --highlight: var(--theme-highlight);
    --success: var(--theme-success);
    --error: var(--theme-error);
    --neutral: var(--theme-neutral);
    --green: var(--theme-green);
    --yellow: var(--theme-yellow);
    --orange: var(--theme-orange);
    --red: var(--theme-red);

    &.dark {
        --bg: var(--theme-bg);
        --color: var(--theme-color);
        --color-subtle: var(--theme-color-subtle);
        --border: var(--theme-border);
        --shadow: var(--theme-shadow);
        --shadow-modal: var(--theme-shadow-modal);

        --btn: var(--theme-btn);
        --btn-color: var(--theme-btn-color);
        --btn-border: var(--theme-btn-border);

        --input: var(--theme-input);
        --input-color: var(--theme-input-color);
        --input-border: var(--theme-input-border);
    }

    &.light {
        --bg: var(--theme-bg-inverted);
        --color: var(--theme-color-inverted);
        --color-subtle: var(--theme-color-subtle-inverted);
        --border: var(--theme-border-inverted);
        --shadow: var(--theme-shadow-inverted);
        --shadow-modal: var(--theme-shadow-modal);

        --btn: var(--theme-btn-inverted);
        --btn-color: var(--theme-btn-color-inverted);
        --btn-border: var(--theme-btn-border-inverted);

        --input: var(--theme-input-inverted);
        --input-color: var(--theme-input-color-inverted);
        --input-border: var(--theme-input-border-inverted);
    }
}

@media all and (min-width: 350px) {
    main {
        width: calc(var(--space-x) * 3);
    }
}

@media all and (min-width: 500px) {
    main {
        width: calc(var(--space-x) * 4);
    }
}
</style>
