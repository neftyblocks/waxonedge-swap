import { useFetch } from "@nefty/use";
import { ref } from "vue";
import type { OHLCVCustom } from "../types";
import { useEndpointsConfig } from "./config";

const cache = ref<Record<string, OHLCVCustom[]>>({});

export const useCandles = () => {
    const [config] = useEndpointsConfig();
    const getCandle = async (exchange: string, pair: string) => {
        const id = `${exchange}-${pair.toString}`;
        const now = Date.now();
        const hours = 24 + 1;
        const back = now - hours * 60 * 60 * 1000;

        const { data, error } = await useFetch<OHLCVCustom[]>("/candles", {
            baseUrl: config.API,
            params: {
                duration: "30m",
                src: exchange,
                pair_id: pair,
                is_reversed: Boolean(false).toString(),
                startAt: back.toString(),
                endAt: now.toString(),
                countBack: Number(0).toString(),
            },
        });

        if (!error && data?.length) {
            cache.value[id] = data;

            return data;
        }

        return [];
    };

    const getLastPrice = async (exchange: string, pair: string) => {
        const id = `last-${exchange}-${pair.toString}`;
        const now = Date.now();
        const back = now;

        const { data, error } = await useFetch<OHLCVCustom[]>("/candles", {
            baseUrl: config.API,
            params: {
                duration: "1m",
                src: exchange,
                pair_id: pair,
                is_reversed: Boolean(false).toString(),
                startAt: back.toString(),
                endAt: now.toString(),
                countBack: Number(1).toString(),
            },
        });

        if (!error && data?.length) {
            cache.value[id] = data;

            return +data[0].close;
        }

        return 0;
    };

    return {
        cache,
        getLastPrice,
        getCandle,
    };
};
