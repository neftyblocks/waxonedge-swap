import { useFetch } from "@nefty/use";
import { computed, onBeforeMount, ref } from "vue";
import type { Lock, Settings, TokenItem, TokenList } from "waxonedge-core";
import { useConfig, useCandles, getPairSources, getTokenList } from "waxonedge-core";

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
    const { getUsdRate } = useCandles();

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

    const updateWaxPrice = async (contract: string, ticker: string, input: boolean) => {
        const { data, error } = await useFetch<{ wax_price: number }>(`/wax_price/${contract}/${ticker}`, {
            baseUrl: config.API,
        });

        let wax_price = 0;

        if (!error && data) wax_price = data.wax_price;

        if (input) inputWaxPrice.value = wax_price;
        else outputWaxPrice.value = wax_price;
    };

    const getPairId = async (in_symbol_contract: string, out_symbol_contract: string) =>
        (await getPairSources(in_symbol_contract, out_symbol_contract))[0]?.pair_id;

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
