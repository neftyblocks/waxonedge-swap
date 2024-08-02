import { reactive, Ref, watch } from "vue";
import type { Config } from "../types";
import { normalizedObject } from "./normalize";

const globalState = reactive<Config>({
    API: "https://woe-api.neftyblocks.com",
    RATES_API: "https://rates.neftyblocks.com",
    CHAIN_API: "https://wax-public.neftyblocks.com",
    CHAIN: "wax",
});

export const useConfig = (value?: Ref<Config | string | undefined>): [Config, (config: Config) => void] => {
    const setConfig = (config: Config) => {
        Object.assign(globalState, config);
    };

    if (value) {
        const config = normalizedObject<Config>(value);
        if (config.value) {
            setConfig(config.value);
        }

        watch(config, (value) => {
            if (value) setConfig(value);
        });
    }

    return [globalState, setConfig];
};
