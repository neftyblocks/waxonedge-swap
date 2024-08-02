import { useFetch, useImageUrl } from "@nefty/use";
import { useConfig } from "./config";
import { PairSource, TokenList } from "../types";

export const getPairSources = async (
    in_symbol_contract: string,
    out_symbol_contract: string
): Promise<PairSource[]> => {
    const [config] = useConfig();
    const { data, error } = await useFetch<PairSource[]>(
        `/pairDirectSources/${in_symbol_contract}/${out_symbol_contract}`,
        {
            baseUrl: config.API,
        }
    );

    const pairs = !error && data?.length ? data : [];
    return pairs;
};

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

export const useTokenUrl = (token_url: string | undefined) => {
    let checkedUrl = token_url;

    if (!token_url) checkedUrl = "https://neftyblocks.com/tokens/unknown.png";

    return useImageUrl(checkedUrl!, 100, true);
};
