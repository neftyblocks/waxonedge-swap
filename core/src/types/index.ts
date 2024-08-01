export type Wallet = {
    accountName: string;
    permission: string;
};

export type Lock = {
    in: string;
    out: string;
};

export type Settings = {
    slippage: number;
    hops: number;
    allowed_exchanges: string;
    filter_type: string;
};

export type TokenApi = {
    contract: string;
    symbol: {
        ticker: string;
        precision: number;
    };
    amount: number;
    wax_price: number;
    tvl: number;
    in_pool: {
        src: string;
        src_type: string;
        pairid: number;
        quote_amount: number;
        vstoken: {
            contract: string;
            symbol: {
                ticker: string;
                precision: number;
            };
            amount: number;
        };
    }[];
};

export type TokenList = {
    pair_id?: string;
    exchange: string;
    in: TokenItem;
    out: TokenItem;
};

export type TokenItem = {
    ticker: string;
    contract: string;
    tax: number;
    precision: number;
    logo: string;
};

export type BalanceAPI = {
    amount: string;
    contract: string;
    currency: string;
    decimals: string;
    usdValue: string;
    tax: number;
    logo: string;
};

// use: contract_symbol as key
export type Balances = Record<string, Balance>;
export type Balance = {
    amount: number;
    usdValue: number;
    token: TokenItem;
};

export type OHLCVCustom = {
    updated_at_time: string;
    mode: string;
    block_num: string;
    global_sequence: string;
    high: string;
    low: string;
    open: string;
    close: string;
    volumeA: string;
    volumeB: string;
    trade_count: number;
    accounts: string[];
};

export type TableRowsApi = {
    rows: {
        id: number;
        owner: string;
        value: number;
        median: number;
        timestamp: string;
    }[];
    more: boolean;
    next_key: string;
};

export type PairSource = {
    src: string;
    src_type: string;
    pair_id: string;
    token0: PairToken;
    token1: PairToken;
    fee: number;
    sqrtPriceX64?: string;
};

export interface PairToken {
    symbol: PairSymbol;
    amount: number;
    contract: string;
}

export interface PairSymbol {
    ticker: string;
    precision: number;
}

export type Config = {
    API: string;
    RATES_API: string;
    CHAIN_API: string;
    CHAIN: "wax" | "waxtest";
};
