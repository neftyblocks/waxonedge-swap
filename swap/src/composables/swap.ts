import { useFetch, useImageUrl } from "@nefty/use";
import { computed, onBeforeMount, ref } from "vue";
import type { Lock, Settings, TableRowsApi, TokenItem, TokenList } from "../types";
import { limitPrecision } from "../utils";
import { useConfig } from "./config";

const selectedPair = ref<TokenList | null>(null);
const inputWaxPrice = ref(0);
const outputWaxPrice = ref(0);
const conversion = computed(() => ({
    in: inputWaxPrice.value * waxConversion.value,
    out: outputWaxPrice.value * waxConversion.value,
}));
const settings = ref<Settings>({
    slippage: 1,
    hops: 4,
    allowed_exchanges: "",
    filter_type: "",
});
const tokens = ref<TokenList[]>([]);
const waxConversion = ref<number>(0);

let controller: AbortController | null = null;
let signal: AbortSignal | undefined = undefined;

export const useSwap = (lock?: Lock) => {
    const loadingInit = ref(true);
    const loadingRoute = ref(false);
    const [config] = useConfig();

    onBeforeMount(async () => {
        const locked = [lock?.out, lock?.in].filter(Boolean).join(",");

        const [tokenP, usdP] = await Promise.allSettled([
            getTokenList({ limit: 1, preset: lock ? locked : "" }),
            getUsdRate(),
        ]);

        const isTokenInList = (token: TokenItem, filter: string[]) =>
            filter.length === 0 || filter.includes(`${token.contract}_${token.ticker}`);

        if (tokenP.status === "fulfilled") {
            const lockedInputs = lock?.in?.split(",") || [];
            const lockedOutputs = lock?.out?.split(",") || [];
            const pair = tokenP.value.find(
                (p) =>
                    (isTokenInList(p.in, lockedInputs) && isTokenInList(p.out, lockedOutputs)) ||
                    (isTokenInList(p.in, lockedOutputs) && isTokenInList(p.out, lockedInputs))
            );
            if (pair) {
                const invertPair = !isTokenInList(pair.in, lockedInputs) || !isTokenInList(pair.out, lockedOutputs);
                if (invertPair) {
                    selectedPair.value = {
                        in: pair.out,
                        out: pair.in,
                        exchange: pair.exchange,
                    };
                } else {
                    selectedPair.value = pair;
                }
            }
        }
        if (usdP.status === "fulfilled") waxConversion.value = usdP.value;

        if (selectedPair.value)
            await Promise.all([
                updateWaxPrice(selectedPair.value.in.contract, selectedPair.value.in.ticker, true),
                updateWaxPrice(selectedPair.value.out.contract, selectedPair.value.out.ticker, false),
            ]);

        loadingInit.value = false;
    });

    const getRoute = async (amount: number, accountName: string) => {
        if (!selectedPair.value) return;

        loadingRoute.value = true;

        const inToken = selectedPair.value.in;
        const input = `${inToken.ticker}_${inToken.contract}`;
        const outToken = selectedPair.value.out;
        const output = `${outToken.ticker}_${outToken.contract}`;

        // cancel old request if there is a new one
        if (!controller) {
            controller = new AbortController();
            signal = controller.signal;
        } else {
            controller.abort();
            controller = new AbortController();
            signal = controller.signal;
        }

        // biome-ignore lint/suspicious/noExplicitAny:
        const { data, error } = await useFetch<any>("/api/swap/routes", {
            baseUrl: config.RATES_API,
            signal,
            params: {
                token_in: input,
                token_out: output,
                amount_in: amount.toString(),
                slippage: Math.round(settings.value.slippage * 100).toString(),
                receiver: accountName,
                split_max_routes: settings.value.hops.toString(),
                filter_exchange: settings.value.allowed_exchanges,
                filter_type: settings.value.filter_type,
                chain: config.CHAIN,
            },
        });

        loadingRoute.value = false;

        if (!error && data?.length) return data[0];

        return null;
    };

    const getPairId = async (in_symbol_contract: string, out_symbol_contract: string): Promise<string | undefined> => {
        // biome-ignore lint/suspicious/noExplicitAny:
        const { data, error } = await useFetch<any>(`/pairDirectSources/${in_symbol_contract}/${out_symbol_contract}`, {
            baseUrl: config.API,
        });

        if (!error && data?.length) {
            return data[0].pair_id;
        }

        return undefined;
    };

    const updateWaxPrice = async (contract: string, ticker: string, input: boolean) => {
        const { data, error } = await useFetch<{ wax_price: number }>(`/wax_price/${contract}/${ticker}`, {
            baseUrl: config.API,
        });

        let wax_price = 0;

        if (!error && data) wax_price = data.wax_price;

        if (input) inputWaxPrice.value = wax_price;
        else outputWaxPrice.value = wax_price;
    };

    return {
        loadingInit,
        loadingRoute,
        selectedPair,
        tokens,
        waxConversion,
        conversion,
        settings,
        getRoute,
        getPairId,
        updateWaxPrice,
    };
};

// biome-ignore lint/suspicious/noExplicitAny:
export const getTokenList = async (params: null | any = null): Promise<TokenList[]> => {
    const [config] = useConfig();
    const { data, error } = await useFetch<TokenList[]>("/api/waxonedge/tokens", {
        baseUrl: config.RATES_API,
        params: {
            ...params,
            chain: config.CHAIN,
        },
    });

    if (!error && data) {
        return data;
    }

    return [];
};

export const useTokenUrl = (token_url: string) => {
    let checkedUrl = token_url;

    if (!token_url) checkedUrl = "https://neftyblocks.com/tokens/unknown.png";

    return useImageUrl(checkedUrl, 100, true);
};

// ====================
//  HELPER FUNCTIONS
// ====================

const getUsdRate = async (): Promise<number> => {
    const [config] = useConfig();
    const { data, error } = await useFetch<TableRowsApi>("/v1/chain/get_table_rows", {
        baseUrl: config.CHAIN_API,
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: {
            json: true,
            index_position: 3,
            key_type: "i64",
            code: "delphioracle",
            scope: "waxpusd",
            table: "datapoints",
            limit: 1,
            reverse: true,
            show_payer: false,
        },
    });

    if (!error && data) {
        const { rows } = data;

        return rows[0] ? limitPrecision(rows[0].median / 10000) : 0;
    }

    return 0;
};
