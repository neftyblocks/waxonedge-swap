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
                    <img :src="useTokenUrl(token.in.logo)" alt="" width="25" height="25" />
                    <article>
                        <h3>{{ token.in.ticker }}</h3>
                        <p>{{ token.in.contract }}</p>
                    </article>

                    <article v-if="getBalanceByToken(token.in)" class="end">
                        <h3>{{ prettyFormatNumber(getBalanceByToken(token.in)) }} {{ token.in.ticker }}</h3>
                        <p>{{ prettyFormatNumber(getValueByToken(token.in)) }} USD</p>
                    </article>
                </button>
            </main>
        </div>
        <span class="modal-background" @click="$emit('click')"></span>
    </section>
</template>

<script setup lang="ts">
import { onKeyDown, useDebounceFn } from "@vueuse/core";
import { type PropType, onMounted, ref, toRef } from "vue";
import { getTokenList, useAccount, useTokenUrl } from "../composables";
import type { TokenList, Wallet } from "../types";
import { prettyFormatNumber } from "../utils";

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
});
const wallet = toRef(props, "wallet");
const { getPresetBalance, getBalanceByToken, getValueByToken } = useAccount(wallet);

const modal = ref();
const data = ref<TokenList[] | null>(null);
const search = ref();

onMounted(() => {
    getData();
});

const getData = async () => {
    const balancePreset = getPresetBalance();
    const preset = props.filter.length ? [...new Set([...balancePreset, ...props.filter])] : balancePreset;

    const tokens = await getTokenList({
        preset: search.value ? "" : preset.join(","),
        search: search.value || "",
    });

    if (props.filter.length) {
        data.value = tokens.filter((token) => props.filter.includes(`${token.in.contract}_${token.in.ticker}`));
    } else {
        data.value = tokens;
    }
};

const debouncedSearch = useDebounceFn(() => {
    getData();
}, 500);

const selectToken = (token: TokenList) => {
    emit("select", token);
};

onKeyDown("Escape", (e) => {
    if (modal.value) {
        e.preventDefault();
        emit("click");
    }
});
</script>
