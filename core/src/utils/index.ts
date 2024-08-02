import { PairSource, TokenItem } from "../types";

export const prettyFormatNumber = (
    amount: number,
    options: Intl.NumberFormatOptions = { notation: "compact" }
): string => {
    const formatter = Intl.NumberFormat(undefined, options);
    return formatter.format(amount);
};

export const limitPrecision = (value: number, precision = 8): number => {
    const multiplier = 10 ** precision;
    return Math.round(value * multiplier) / multiplier;
};

export const numberToString = (value: number, token: TokenItem): string => {
    return `${limitPrecision(value, token.precision).toFixed(token.precision)} ${token.ticker}`;
};

export const getTransferAmount = (
    value: number,
    balance: number,
    tax: number
): {
    adjustedAmount: number;
    taxAmount: number;
    changed: boolean;
} => {
    let adjustedAmount = value;
    let taxAmount = 0;
    let changed = false;
    let maxAmountToTransfer = balance;
    if (tax) {
        maxAmountToTransfer = balance / (1 + tax);
        taxAmount = value * tax;
    }

    if (balance && balance <= value + taxAmount) {
        adjustedAmount = maxAmountToTransfer;
        changed = true;
    }

    return {
        adjustedAmount,
        taxAmount,
        changed,
    };
};

export const calculateSourcePrice = (source: PairSource, inverted: boolean): number => {
    const token0 = source.token0;
    const token1 = source.token1;

    if (source.src_type === "poolsv3" && source.sqrtPriceX64) {
        if (!inverted) {
            return (
                (2 ** 128 / Number(source.sqrtPriceX64) ** 2) *
                10 ** (token1.symbol.precision - token0.symbol.precision)
            );
        }
        return (
            (Number(source.sqrtPriceX64) ** 2 / 2 ** 128) * 10 ** (token0.symbol.precision - token1.symbol.precision)
        );
    }

    if (inverted) {
        return token1.amount / token0.amount;
    }
    return token0.amount / token1.amount;
};

export const calculateTokenPairAmounts = ({
    input,
    output,
    source,
    rate,
    inverted,
}: {
    input?: number;
    output?: number;
    source?: PairSource;
    rate?: number;
    inverted: boolean;
}): { input: number; output: number } => {
    if (!input && !output) return { input: 0, output: 0 };
    if (!source && !rate) throw new Error("Missing source or rate");

    let price = rate ? rate : calculateSourcePrice(source!, false);
    if (inverted) {
        price = 1 / price;
    }
    if (input) {
        return {
            input: input,
            output: input / price,
        };
    } else if (output) {
        return {
            input: output * price,
            output: output,
        };
    } else {
        return { input: 0, output: 0 };
    }
};
