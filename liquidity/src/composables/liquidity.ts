import { useFetch } from "@nefty/use";
import { computed, onBeforeMount, ref } from "vue";
import type { Lock, PairSource, Settings, TokenItem, TokenList } from "waxonedge-core";

import { calculateSourcePrice, useConfig, getPairSources, getTokenList, useCandles } from "waxonedge-core";

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

const tokenIn = ref<TokenItem | undefined>(undefined);
const tokenOut = ref<TokenItem | undefined>(undefined);
const selectedPair = ref<
    (TokenList & { source?: PairSource; inverted: boolean; bestPoolPrice?: number; averagePrice?: number }) | undefined
>(undefined);

export const useLiquidity = (exchange: string, lock?: Lock) => {
    const loadingInit = ref(true);
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
                    tokenIn.value = pair.out;
                    tokenOut.value = pair.in;
                } else {
                    tokenIn.value = pair.in;
                    tokenOut.value = pair.out;
                }

                await updateSelectedPair();
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

    const updateWaxPrice = async (contract: string, ticker: string, input: boolean) => {
        const { data, error } = await useFetch<{ wax_price: number }>(`/wax_price/${contract}/${ticker}`, {
            baseUrl: config.API,
        });

        let wax_price = 0;

        if (!error && data) wax_price = data.wax_price;

        if (input) inputWaxPrice.value = wax_price;
        else outputWaxPrice.value = wax_price;
    };

    const getPairSource = async (
        in_symbol_contract: string,
        out_symbol_contract: string,
        exchange?: string
    ): Promise<{ source?: PairSource; bestPoolPrice?: number; averagePrice?: number }> => {
        const sources = await getPairSources(in_symbol_contract, out_symbol_contract);

        const pools = sources
            .filter((s) => s.token0.amount > 0 && s.token1.amount > 0)
            .map((s) => {
                const { token0, token1, src } = s;
                const key = `${token1.symbol.ticker}_${token1.contract}`;
                const reverse = key === in_symbol_contract;
                return {
                    src,
                    price: calculateSourcePrice(s, reverse),
                    token0: reverse ? token1 : token0,
                    token1: reverse ? token0 : token1,
                };
            })
            .sort((a, b) => b.token0.amount - a.token0.amount);

        const bestPoolPrice = pools[0]?.price;
        const averagePrice = pools.length
            ? pools.map((p) => p.price).reduce((acc, price) => acc + price, 0) / pools.length
            : 0;

        let source = undefined;
        if (!exchange) source = sources[0];
        source = sources.find((p) => p.src === exchange);

        return {
            source,
            bestPoolPrice,
            averagePrice,
        };
    };

    const updateSelectedPair = async () => {
        const { source, bestPoolPrice, averagePrice } = await getPairSource(
            `${tokenIn.value?.ticker}_${tokenIn.value?.contract}`,
            `${tokenOut.value?.ticker}_${tokenOut.value?.contract}`,
            exchange
        );

        const inverted = source
            ? source.token1.contract === tokenIn.value?.contract &&
              source.token1.symbol.ticker === tokenIn.value?.ticker
            : false;

        selectedPair.value = {
            in: tokenIn.value!,
            out: tokenOut.value!,
            pair_id: source?.pair_id,
            source: source,
            inverted,
            exchange,
            bestPoolPrice,
            averagePrice,
        };
    };

    const suggestedPairPrice = computed(() => {
        if (!selectedPair.value?.bestPoolPrice) return 0;
        return selectedPair.value.bestPoolPrice;
    });

    return {
        loadingInit,
        tokens,
        waxConversion,
        conversion,
        settings,
        updateWaxPrice,
        updateSelectedPair,
        tokenIn,
        tokenOut,
        selectedPair,
        suggestedPairPrice,
    };
};
