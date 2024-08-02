import { Ref, ref, watch } from "vue";
import type { BalanceAPI, Balances, TokenItem, Wallet } from "../types";
import { useFetch } from "@nefty/use";
import { useConfig } from "./config";

const balances = ref<Balances | null>(null);

export const useAccount = (wallet: Ref<Wallet | null | undefined>) => {
    const updateBalances = async () => {
        if (wallet.value) {
            balances.value = await getBalances(wallet.value?.accountName || "");
        } else {
            balances.value = null;
        }
    };

    watch(wallet, async () => await updateBalances(), { immediate: true });

    const getBalanceByToken = (token: TokenItem) => {
        if (!balances.value) return 0.0;

        if (balances.value[`${token.contract}_${token.ticker}`]) {
            return balances.value[`${token.contract}_${token.ticker}`].amount;
        }

        return 0.0;
    };
    const getValueByToken = (token: TokenItem) => {
        if (!balances.value) return 0.0;

        if (balances.value[`${token.contract}_${token.ticker}`]) {
            return balances.value[`${token.contract}_${token.ticker}`].usdValue;
        }

        return 0.0;
    };

    const getPresetBalance = () => {
        if (!balances.value) return [];

        const keys = Object.keys(balances.value);

        return keys.slice(0, 100);
    };

    const getBalancesList = () => {
        if (!balances.value) return [];

        return Object.values(balances.value);
    };

    return {
        balances,
        updateBalances,
        getValueByToken,
        getPresetBalance,
        getBalanceByToken,
        getBalancesList,
    };
};

const getBalances = async (accountName: string): Promise<Balances> => {
    const result: Balances = {};
    const [config] = useConfig();

    const { data, error } = await useFetch<BalanceAPI[]>("/api/balances/wax", {
        baseUrl: config.RATES_API,
        params: {
            account: accountName,
        },
    });

    if (!error && data) {
        const sortBalancesByAmount = data.sort((a, b) =>
            +b.usdValue > 0 && +a.usdValue > 0 ? +b.usdValue - +a.usdValue : +b.amount - +a.amount
        );

        for (let i = 0; i < sortBalancesByAmount.length; i++) {
            const { amount, contract, currency, usdValue, decimals, tax, logo } = sortBalancesByAmount[i];

            result[`${contract}_${currency}`] = {
                amount: +amount,
                usdValue: +usdValue,
                token: {
                    contract,
                    ticker: currency,
                    precision: +decimals,
                    tax,
                    logo,
                },
            };
        }
    }

    return result;
};
