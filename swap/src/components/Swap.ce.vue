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
                @input="hasInputUpdate"
                @click="triggerModal('in')"
            />
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
                :disabled="normalizedSigning || !outputValue"
                @click="swapToken"
            >
                {{ !outputValue ? "waiting for input" : normalizedSigning ? "Signing..." : "Swap" }}
            </button>
            <button v-else class="btn btn--center btn--big" @click="emit('connect')">Connect wallet</button>
        </section>
        <section class="swap-info" part="swap-info">
            <header>
                <PairPrice v-if="selectedPair" :selected-pair="selectedPair" :price="lastPrice" />
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
import { onClickOutside, toRefs, useDebounceFn } from "@vueuse/core";
import { type PropType, computed, ref, watch } from "vue";
import { useSwap } from "../composables/swap";
import type { Config, TokenItem, Wallet } from "waxonedge-core";
import {
    getTransferAmount,
    prettyFormatNumber,
    normalizedBoolean,
    normalizedObject,
    useAccount,
    useConfig,
    useCandles,
    Sprite,
    TokenInput,
    TokenModal,
    PairPrice,
} from "waxonedge-core";

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
        default: false,
    },
    wallet: {
        type: [String, Object] as PropType<string | Wallet>,
        default: null,
    },
    lock: {
        type: [String, Object] as PropType<string | Lock>,
        default: null,
    },
    swapping: {
        type: [String, Boolean],
        default: false,
    },
    signing: {
        type: [String, Boolean],
        default: false,
    },
    config: {
        type: [String, Object] as PropType<string | Config>,
        required: false,
    },
});

const showModal = ref(false);
const showPriceInfo = ref(true);
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

// Normalize
const { wallet, lock, signing, swapping, chart, config } = toRefs(props);
const normalizedChart = normalizedBoolean(chart);
const normalizedSigning = normalizedBoolean(signing || swapping);
const normalizedWallet = normalizedObject<Wallet>(wallet);
const normalizedLock = normalizedObject<any>(lock);

useConfig(config);

const filterLock = computed<string[] | undefined>(() => {
    const inOut = inverted.value ? ["out", "in"] : ["in", "out"];
    const select = inOut[whichTokenToUpdate.value === "in" ? 0 : 1];
    return normalizedLock.value ? normalizedLock.value?.[select]?.split(",") : undefined;
});

const { loadingInit, loadingRoute, selectedPair, conversion, settings, getRoute, getPairId, updateWaxPrice } = useSwap(
    normalizedLock.value
);
const { getLastPrice } = useCandles();
const { getBalanceByToken, updateBalances } = useAccount(normalizedWallet);

onClickOutside(settingsModal, () => {
    showSettings.value = false;
});

watch(normalizedSigning, () => {
    if (!loadingInit.value && !normalizedSigning.value) {
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

const setNewToken = async (token: TokenItem) => {
    if (!selectedPair.value) return;

    outputValue.value = undefined;
    showModal.value = false;
    loading.value = true;

    const clone = { ...selectedPair.value };
    selectedPair.value = null;

    const updateInput = whichTokenToUpdate.value === "in";
    let previousSelection;
    if (updateInput) {
        previousSelection = clone.in;
        inputValue.value = undefined;
        clone.in = token;
    } else {
        previousSelection = clone.out;
        clone.out = token;
    }

    // Reverse selection when selecting the same token
    const isSameToken = clone.in.ticker === clone.out.ticker && clone.in.contract === clone.out.contract;
    if (isSameToken && updateInput) {
        clone.out = previousSelection;
        clone.in = token;
    } else if (isSameToken) {
        clone.in = previousSelection;
        clone.out = token;
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
        fees.value = 0;
        minimumReceived.value = 0;
        priceImpact.value = 0;
    } else if (selectedPair.value) {
        const { adjustedAmount } = getTransferAmount(
            inputValue.value,
            getBalanceByToken(selectedPair.value.in),
            selectedPair.value.in.tax
        );

        // deref input
        let inputAmount = inputValue.value;
        inputAmount = adjustedAmount;

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
    const wallet = normalizedWallet.value;
    if (actionsRaw.value.length === 0 || !wallet || !selectedPair.value) return;

    const authorization = [
        {
            actor: wallet.accountName,
            permission: wallet.permission,
        },
    ];

    const removeRef = actionsRaw.value.map((action: Object) => {
        return {
            from: wallet.accountName,
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
@import "../scss/style.scss";
</style>
