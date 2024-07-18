import { reactive } from "vue";
import type { EndpointsConfig } from "../types";

const globalState = reactive<EndpointsConfig>({
    API: "https://woe-api.neftyblocks.com",
    RATES_API: "https://rates.neftyblocks.com",
    CHAIN_API: "https://wax-public.neftyblocks.com",
    CHAIN: "wax",
});

export const useEndpointsConfig = (): [EndpointsConfig, (config: EndpointsConfig) => void] => {
    return [
        globalState,
        (config: EndpointsConfig) => {
            Object.assign(globalState, config);
        },
    ];
};
