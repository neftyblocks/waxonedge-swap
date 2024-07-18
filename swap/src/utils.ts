export const prettyFormatNumber = (
    amount: number,
    options: Intl.NumberFormatOptions = { notation: "compact" }
): string => {
    const formatter = Intl.NumberFormat(undefined, options);
    return formatter.format(amount);
};

export const limitPrecision = (value: number): number => {
    const multiplier = 10 ** 8;
    return Math.round(value * multiplier) / multiplier;
};
