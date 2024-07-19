import { reactive } from "vue";
import type { Config } from "../types";

const globalState = reactive<Config>({
    API: "https://woe-api.neftyblocks.com",
    RATES_API: "https://rates.neftyblocks.com",
    CHAIN_API: "https://wax-public.neftyblocks.com",
    CHAIN: "wax",
});

export const useConfig = (): [Config, (config: Config) => void] => {
    return [
        globalState,
        (config: Config) => {
            Object.assign(globalState, config);
        },
    ];
};
