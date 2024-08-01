<template>
    <section class="modal" ref="modal">
        <div class="modal-content">
            <header class="modal-header">
                <div class="search">
                    <svg role="presentation" focusable="false" aria-hidden="true">
                        <use xlink:href="#woe-search" />
                    </svg>
                    <input
                        type="search"
                        placeholder="Search by name or contract"
                        v-model="search"
                        autofocus="true"
                        @input="debouncedSearch"
                    />
                </div>

                <button class="btn-clear close" @click="$emit('click')">
                    <svg role="presentation" focusable="false" aria-hidden="true">
                        <use xlink:href="#woe-close" />
                    </svg>
                </button>
            </header>

            <main v-if="data?.length" class="tokens-group">
                <button v-for="(token, i) in data" :key="i" class="btn-clear tokens-item" @click="selectToken(token)">
                    <img :src="useTokenUrl(token.logo)" alt="" width="25" height="25" />
                    <article>
                        <h3>{{ token.ticker }}</h3>
                        <p>{{ token.contract }}</p>
                    </article>

                    <article v-if="token.balance" class="end">
                        <h3>{{ prettyFormatNumber(token.balance) }} {{ token.ticker }}</h3>
                        <p>{{ prettyFormatNumber(token.usdValue) }} USD</p>
                    </article>
                </button>
            </main>
        </div>
        <span class="modal-background" @click="$emit('click')"></span>
    </section>
</template>

<script setup lang="ts">
import { ref, onMounted, PropType, toRef } from "vue";
import { onKeyDown, useDebounceFn } from "@vueuse/core";
import { getTokenList, useTokenUrl, useAccount } from "../composables";
import { TokenItem, Wallet } from "../types";
import { prettyFormatNumber } from "../utils";

type TokenModalItem = TokenItem & { usdValue: number; balance: number };

const emit = defineEmits(["click", "select"]);

const props = defineProps({
    wallet: {
        type: Object as PropType<Wallet>,
        default: () => null,
    },
    filter: {
        type: Array as PropType<string[]>,
        default: () => [],
    },
    balanceOnly: {
        type: Boolean,
        default: false,
    },
});
const wallet = toRef(props, "wallet");
const { getBalancesList, getPresetBalance, getBalanceByToken, getValueByToken } = useAccount(wallet);

const modal = ref();
const data = ref<Array<TokenModalItem> | null>(null);
const search = ref();

onMounted(() => {
    getData();
});

const getData = async () => {
    let tokens: Array<TokenModalItem> = [];
    if (props.balanceOnly) {
        const balances = getBalancesList();
        const items = (balances || []).map((balance) => ({
            ...balance.token,
            balance: +balance.amount,
            usdValue: +balance.usdValue,
        }));

        if (search.value?.trim()) {
            tokens = localTokenSearch(items, search.value);
        } else {
            tokens = items;
        }
    } else {
        const balancePreset = getPresetBalance();
        const preset = props.filter.length ? [...new Set([...balancePreset, ...props.filter])] : balancePreset;

        tokens = (
            await getTokenList({
                preset: search.value ? "" : preset.join(","),
                search: search.value || "",
            })
        ).map((token) => ({
            ...token.in,
            usdValue: getValueByToken(token.in) || 0,
            balance: getBalanceByToken(token.in) || 0,
        }));
    }

    if (props.filter.length) {
        tokens = tokens.filter((token) => props.filter.includes(`${token.contract}_${token.ticker}`));
    }

    data.value = tokens.sort((a, b) =>
        +b.usdValue > 0 && +a.usdValue > 0 ? +b.usdValue - +a.usdValue : +b.balance - +a.balance
    );
};

const localTokenSearch = (item: TokenModalItem[], search: string): TokenModalItem[] => {
    return item
        .map((item) => {
            const trimmedSearch = search.trim();
            const { contract, ticker } = item;
            const closeSymbolScore = ticker.includes(trimmedSearch.toUpperCase()) ? 1 : 0;
            const closeContractScore = contract.includes(trimmedSearch.toLowerCase()) ? 1 : 0;
            const startsSymbolScore = ticker.startsWith(trimmedSearch.toUpperCase()) ? 2 : 0;
            const startsContractScore = contract.startsWith(trimmedSearch.toLowerCase()) ? 2 : 0;
            const exactMatch =
                ticker === trimmedSearch.toUpperCase() || trimmedSearch.toLocaleLowerCase() === contract ? 100 : 0;

            const totalScore =
                closeSymbolScore + closeContractScore + startsSymbolScore + startsContractScore + exactMatch;
            if (totalScore) {
                return {
                    item,
                    score: totalScore,
                };
            } else {
                return null;
            }
        })
        .filter((x) => !!x)
        .sort((a, b) => b.score - a.score)
        .map((x) => x.item);
};

const debouncedSearch = useDebounceFn(() => {
    getData();
}, 500);

const selectToken = (token: TokenItem) => {
    emit("select", token);
};

onKeyDown("Escape", (e) => {
    if (modal.value) {
        e.preventDefault();
        emit("click");
    }
});
</script>

<style scoped lang="scss"></style>
