import { useFetch } from "@nefty/use";
import { ref } from "vue";
import type { OHLCVCustom, TableRowsApi } from "../types";
import { useConfig } from "./config";
import { limitPrecision } from "../utils";

const cache = ref<Record<string, OHLCVCustom[]>>({});

export const useCandles = () => {
    const [config] = useConfig();
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

    return {
        cache,
        getLastPrice,
        getCandle,
        getUsdRate,
    };
};
