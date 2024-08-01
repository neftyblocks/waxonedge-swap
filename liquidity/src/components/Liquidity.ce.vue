<template>
    <Sprite />
    <main class="swap" :class="theme">
        <header class="swap-header">
            <button class="btn" @click="refresh">
                <svg role="presentation" focusable="false" aria-hidden="true">
                    <use xlink:href="#woe-refresh" />
                </svg>
            </button>
        </header>
        <section class="swap-container">
            <header class="swap-input-header">
                <label>Token 1</label>
                <button
                    v-if="!loadingInit && normalizedWallet && tokenIn"
                    class="btn-clear"
                    @click="setInputAmount(getBalanceByToken(tokenIn))"
                >
                    <span>{{ getBalanceByToken(tokenIn) }} {{ tokenIn.ticker }}</span>

                    <svg role="presentation" focusable="false" aria-hidden="true">
                        <use xlink:href="#woe-wallet" />
                    </svg>
                </button>
            </header>
            <span v-if="loadingInit" class="skeleton skeleton-input"></span>
            <TokenInput
                v-else
                v-model:amount.token="inputValue"
                v-model:token="tokenIn"
                :conversion="conversion.in"
                :loading="loading"
                is-input
                @input="hasInputUpdateDebounced"
                @click="triggerModal('in')"
            />
            <button class="btn btn--center" @click="switchSelected">
                <svg role="presentation" focusable="false" aria-hidden="true">
                    <use xlink:href="#woe-swap" />
                </svg>
            </button>
            <header class="swap-input-header">
                <label>Token 2</label>
                <button
                    v-if="!loadingInit && normalizedWallet && tokenOut"
                    class="btn-clear"
                    @click="setOutputAmount(getBalanceByToken(tokenOut))"
                >
                    <span>{{ getBalanceByToken(tokenOut) }} {{ tokenOut.ticker }}</span>

                    <svg role="presentation" focusable="false" aria-hidden="true">
                        <use xlink:href="#woe-wallet" />
                    </svg>
                </button>
            </header>
            <span v-if="loadingInit" class="skeleton skeleton-input"></span>
            <TokenInput
                v-else
                v-model:amount.token="outputValue"
                v-model:token="tokenOut"
                :conversion="conversion.out"
                :loading="loading"
                is-input
                @input="hasOutputUpdateDebounced"
                @click="triggerModal('out')"
            />

            <div v-if="selectedPair && !selectedPair.pair_id" class="toast toast--info">
                <p>
                    You are creating a new pair. The price for this pair will be determined by the amounts of tokens you
                    set.
                </p>
            </div>

            <div v-if="priceDifferencePercentage > 0.05" class="toast toast--warn">
                <p>
                    There is a {{ (priceDifferencePercentage * 100).toFixed(2) }}%. Difference between the new pair
                    price and the suggested price.
                    <button class="btn btn--link" @click="matchPrice(suggestedPairPrice)">Use suggested price.</button>
                </p>
            </div>

            <button
                v-if="normalizedWallet"
                class="btn btn--center btn--big btn--top-spaced"
                :disabled="normalizedSigning || !outputValue"
                @click="addLiquidity"
            >
                <template v-if="!selectedPair">Select tokens</template>
                <template v-else-if="(!outputValue || !inputValue) && !selectedPair.pair_id"
                    >Fill in both amounts</template
                >
                <template v-else-if="!outputValue || !inputValue">Waiting for input</template>
                <template v-else-if="normalizedSigning">Signing...</template>
                <template v-else-if="selectedPair.pair_id">Add liquidity</template>
                <template v-else>Create pair</template>
            </button>
            <button v-else class="btn btn--center btn--big btn--top-spaced" @click="emit('connect')">
                Connect wallet
            </button>
        </section>

        <section class="swap-info" part="swap-info">
            <header>
                <PairPrice v-if="selectedPair" :selected-pair="selectedPair" :price="pairPrice" />
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
                <li>
                    {{ selectedPair.pair_id ? "Pair price" : "New pair price" }}
                    <small>
                        {{ pairPrice ? `${useTokenDisplay(pairPrice, 8)}` : useTokenDisplay(0, 8) }}
                        {{ selectedPair.in.ticker }}/{{ selectedPair.out.ticker }}
                    </small>
                </li>
                <li>
                    <LiquidityPriceInfo
                        v-if="!selectedPair.source && suggestedPairPrice"
                        title="Suggested price"
                        :selected-pair="selectedPair"
                        :price="suggestedPairPrice"
                        @click="matchPrice(suggestedPairPrice)"
                    />
                </li>
            </ul>
        </section>

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
import { PropType, computed, ref, toRefs, watch } from "vue";
import { useDebounceFn, onClickOutside } from "@vueuse/core";
import type { Wallet, Config, TokenItem } from "waxonedge-core";
import { useLiquidity } from "../composables";
import { normalizedBoolean, normalizedObject, useAccount, useConfig } from "waxonedge-core";
import {
    calculateSourcePrice,
    calculateTokenPairAmounts,
    getTransferAmount,
    limitPrecision,
    numberToString,
    Sprite,
    TokenInput,
    TokenModal,
    PairPrice,
} from "waxonedge-core";

// Components
import LiquidityPriceInfo from "./LiquidityPriceInfo.vue";

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
    signing: {
        type: [String, Boolean],
        default: false,
    },
    config: {
        type: [String, Object] as PropType<string | Config>,
        required: false,
    },
    exchange: {
        type: String,
        default: "neftyblocks",
    },
});

const showModal = ref(false);
const showSettings = ref(false);
const settingsModal = ref();
const loading = ref(false);
const whichTokenToUpdate = ref("in");
const inputValue = ref();
const outputValue = ref();
const inverted = ref(false);
const showPriceInfo = ref(true);
const selectedPairPrice = ref(0);

// Normalize props
const { signing, wallet, lock, config } = toRefs(props);
const normalizedSigning = normalizedBoolean(signing);
const normalizedWallet = normalizedObject<Wallet>(wallet);
const normalizedLock = normalizedObject<any>(lock);

useConfig(config);

const filterLock = computed<string[] | undefined>(() => {
    const inOut = inverted.value ? ["out", "in"] : ["in", "out"];
    const select = inOut[whichTokenToUpdate.value === "in" ? 0 : 1];
    return normalizedLock.value ? normalizedLock.value[select]?.split(",") : undefined;
});

const pairPrice = computed(() => {
    if (!selectedPair.value) return 0;
    if (selectedPair.value.source) {
        return calculateSourcePrice(selectedPair.value.source, selectedPair.value.inverted);
    }
    if (selectedPairPrice.value) {
        return selectedPair.value.inverted ? 1 / selectedPairPrice.value : selectedPairPrice.value;
    }
    if (!inputValue.value || !outputValue.value) return 0;
    return +inputValue.value / +outputValue.value;
});

const {
    loadingInit,
    conversion,
    updateSelectedPair,
    updateWaxPrice,
    tokenIn,
    tokenOut,
    selectedPair,
    suggestedPairPrice,
} = useLiquidity(props.exchange, normalizedLock.value);
const { getBalanceByToken, updateBalances } = useAccount(normalizedWallet);

onClickOutside(settingsModal, () => {
    showSettings.value = false;
});

watch(normalizedSigning, () => {
    if (!loadingInit.value && !normalizedSigning.value) {
        inputValue.value = undefined;
        outputValue.value = undefined;
        showModal.value = false;
        loading.value = false;

        setTimeout(() => {
            refresh();
        }, 2000);
    }
});

const triggerModal = (token: "in" | "out") => {
    whichTokenToUpdate.value = token;
    showModal.value = true;
};

const setNewToken = async (token: TokenItem) => {
    inputValue.value = undefined;
    outputValue.value = undefined;
    showModal.value = false;

    const updateInput = whichTokenToUpdate.value === "in";
    let previousSelection;
    if (updateInput) {
        previousSelection = tokenIn.value;
        inputValue.value = undefined;
        tokenIn.value = token;
    } else {
        previousSelection = tokenOut.value;
        tokenOut.value = token;
    }

    // Reverse selection when selecting the same token
    const isSameToken =
        tokenIn.value?.ticker === tokenOut.value?.ticker && tokenIn.value?.contract === tokenOut.value?.contract;
    if (isSameToken && updateInput) {
        tokenOut.value = previousSelection;
        tokenIn.value = token;
    } else if (isSameToken) {
        tokenIn.value = previousSelection;
        tokenOut.value = token;
    }

    if (!tokenOut.value || !tokenIn.value) {
        return;
    }

    loading.value = true;
    setTimeout(async () => {
        selectedPairPrice.value = 0;
        await updateSelectedPair();
        await updateConversion();
        await hasInputUpdate();
        await hasOutputUpdate();

        loading.value = false;
    }, 100);
};

const setInputAmount = (amount: number, updateOutput = true) => {
    if (!tokenIn.value) return;
    inputValue.value = limitPrecision(amount, tokenIn.value?.precision);
    hasInputUpdate(updateOutput);
};

const setOutputAmount = (amount: number, updateInput = true) => {
    if (!tokenOut.value) return;
    outputValue.value = limitPrecision(amount, tokenOut.value?.precision);
    hasOutputUpdate(updateInput);
};

const priceDifferencePercentage = computed(() => {
    if (!pairPrice.value || !suggestedPairPrice.value) return 0;

    return Math.abs(pairPrice.value - suggestedPairPrice.value) / suggestedPairPrice.value;
});

const pairCalculationParameters = computed(() => {
    if (!selectedPair.value) return null;
    const { source, inverted } = selectedPair.value;
    const rate = !source && selectedPairPrice.value ? selectedPairPrice.value : undefined;
    if (!source && !rate) return null;
    return {
        source,
        inverted,
        rate,
    };
});

const hasInputUpdate = (updateOutput = true) => {
    let shouldUpdateOutput = updateOutput;
    if (tokenIn.value && inputValue.value) {
        const { adjustedAmount, changed } = getTransferAmount(
            inputValue.value,
            getBalanceByToken(tokenIn.value),
            tokenIn.value.tax
        );
        inputValue.value = adjustedAmount;
        if (changed) {
            shouldUpdateOutput = true;
        }
    }

    if (pairCalculationParameters.value && shouldUpdateOutput) {
        const { output } = calculateTokenPairAmounts({
            ...pairCalculationParameters.value,
            input: inputValue.value,
        });
        setOutputAmount(output, false);
    }
};

const hasOutputUpdate = (updateInput = true) => {
    let shouldUpdateInput = updateInput;
    if (tokenOut.value && outputValue.value) {
        const { adjustedAmount, changed } = getTransferAmount(
            outputValue.value,
            getBalanceByToken(tokenOut.value),
            tokenOut.value.tax
        );
        outputValue.value = adjustedAmount;
        if (changed) {
            shouldUpdateInput = true;
        }
    }

    if (pairCalculationParameters.value && shouldUpdateInput) {
        const { input } = calculateTokenPairAmounts({
            ...pairCalculationParameters.value,
            output: outputValue.value,
        });
        setInputAmount(input, false);
    }
};

const hasInputUpdateDebounced = useDebounceFn(hasInputUpdate, 500);
const hasOutputUpdateDebounced = useDebounceFn(hasOutputUpdate, 500);

const matchPrice = (price: number) => {
    if (!price || !selectedPair.value) return;

    if (selectedPair.value.inverted) {
        selectedPairPrice.value = 1 / price;
    } else {
        selectedPairPrice.value = price;
    }

    if (inputValue.value) {
        const { output } = calculateTokenPairAmounts({
            rate: selectedPairPrice.value,
            input: inputValue.value,
            inverted: selectedPair.value.inverted,
        });
        setOutputAmount(output, false);
    } else if (outputValue.value) {
        const { input } = calculateTokenPairAmounts({
            rate: selectedPairPrice.value,
            output: outputValue.value,
            inverted: selectedPair.value.inverted,
        });
        setInputAmount(input, false);
    }
};

const updateConversion = async () => {
    const promises = [];
    if (tokenIn.value) {
        promises.push(updateWaxPrice(tokenIn.value.contract, tokenIn.value.ticker, true));
    }

    if (tokenOut.value) {
        promises.push(updateWaxPrice(tokenOut.value.contract, tokenOut.value.ticker, false));
    }

    await Promise.all(promises);
};

const switchSelected = async () => {
    if (selectedPair.value) {
        inverted.value = !inverted.value;
        loading.value = true;

        const newOutput = inputValue.value;
        inputValue.value = outputValue.value;
        outputValue.value = newOutput;

        const newTokenOut = tokenIn.value;
        tokenIn.value = tokenOut.value;
        tokenOut.value = newTokenOut;

        selectedPair.value.in = tokenIn.value!;
        selectedPair.value.out = tokenOut.value!;
        selectedPair.value.inverted = !selectedPair.value.inverted;
        if (selectedPair.value.bestPoolPrice) {
            selectedPair.value.bestPoolPrice = 1 / selectedPair.value.bestPoolPrice;
        }
        if (selectedPair.value.averagePrice) {
            selectedPair.value.averagePrice = 1 / selectedPair.value.averagePrice;
        }
        hasInputUpdate();

        await updateConversion();
        loading.value = false;
    }
};

const refresh = async () => {
    loading.value = true;
    await Promise.all([updateBalances(), hasInputUpdate(false), hasOutputUpdate(false), updateConversion()]);
    loading.value = false;
};

const addLiquidity = () => {
    if (!normalizedWallet.value || !selectedPair.value) return;

    const swapContract = "swap.nefty";
    const actor = normalizedWallet.value.accountName;
    const authorization = [
        {
            actor,
            permission: normalizedWallet.value.permission,
        },
    ];

    const pool1 = selectedPair.value.in;
    const pool2 = selectedPair.value.out;

    const poolKey = `${pool1.ticker}@${pool1.contract}-${pool2.ticker}@${pool2.contract}`;
    const pairSource = selectedPair.value.source;
    const depositMemo = `deposit_to_pair:${poolKey}`;

    const token1Quantity = numberToString(inputValue.value, pool1);
    const token2Quantity = numberToString(outputValue.value, pool2);

    const token1ExtendedSymbol = {
        sym: `${pool1.precision},${pool1.ticker}`,
        contract: pool1.contract,
    };
    const token2ExtendedSymbol = {
        sym: `${pool2.precision},${pool2.ticker}`,
        contract: pool2.contract,
    };

    let actions = [];
    if (pairSource && pairSource.token0.amount > 0 && pairSource.token1.amount > 0) {
        actions = [
            {
                account: pool1.contract,
                name: "transfer",
                authorization,
                data: {
                    from: actor,
                    to: swapContract,
                    quantity: token1Quantity,
                    memo: depositMemo,
                },
            },
            {
                account: pool2.contract,
                name: "transfer",
                authorization,
                data: {
                    from: actor,
                    to: swapContract,
                    quantity: token2Quantity,
                    memo: depositMemo,
                },
            },
            {
                account: swapContract,
                name: "addliquidity",
                authorization,
                data: {
                    owner: actor,
                    token0: token1ExtendedSymbol,
                    token1: token2ExtendedSymbol,
                },
            },
        ];
    } else {
        actions = [
            {
                account: swapContract,
                name: "createpair",
                authorization,
                data: {
                    token0: token1ExtendedSymbol,
                    token1: token2ExtendedSymbol,
                    creator: actor,
                },
            },
            {
                account: pool1.contract,
                name: "transfer",
                authorization,
                data: {
                    from: actor,
                    to: swapContract,
                    quantity: token1Quantity,
                    memo: depositMemo,
                },
            },
            {
                account: pool2.contract.toString(),
                name: "transfer",
                authorization,
                data: {
                    from: actor,
                    to: swapContract,
                    quantity: token2Quantity,
                    memo: depositMemo,
                },
            },
            {
                account: swapContract,
                name: "addliquidity",
                authorization,
                data: {
                    owner: actor,
                    token0: token1ExtendedSymbol,
                    token1: token2ExtendedSymbol,
                },
            },
        ];
    }

    emit("sign", actions);
};
</script>

<style lang="scss">
@import "./../scss/style.scss";
</style>
