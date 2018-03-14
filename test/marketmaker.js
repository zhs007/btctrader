"use strict";

const binance = require('../src/market/binance/index');
const huobi = require('../src/market/huobi/index');
const okcoinex = require('../src/market/okcoinex/index');
const bitfinex = require('../src/market/bitfinex/index');
const bithumb = require('../src/market/bithumb/index');
const coincheck = require('../src/market/coincheck/index');

const { Trader } = require('../src/trader');
const { Strategy_MarketMaker } = require('../src/strategy/marketmaker');
const BTCTraderMgr = require('../src/btctradermgr');
const fs = require('fs');

const SIMTRADE = true;

const cfg = JSON.parse(fs.readFileSync('./config.json', 'utf-8'));

BTCTraderMgr.singleton.init(cfg).then(() => {
    var ds = new coincheck.DataStream({
        // addr: 'wss://real.okcoin.com:10440/websocket',
        // symbol: 'btc_usd',
        // addr: 'wss://real.okex.com:10441/websocket',
        // symbol: 'btc_usdt',
        output_message: false,
        simtrade: SIMTRADE
    });

    // var ds = new bithumb.DataStream({
    //     // addr: 'wss://real.okcoin.com:10440/websocket',
    //     // symbol: 'btc_usd',
    //     // addr: 'wss://real.okex.com:10441/websocket',
    //     // symbol: 'btc_usdt',
    //     output_message: false,
    //     simtrade: SIMTRADE
    // });

    // var ds = new bitfinex.DataStream({
    //     // addr: 'wss://real.okcoin.com:10440/websocket',
    //     // symbol: 'btc_usd',
    //     // addr: 'wss://real.okex.com:10441/websocket',
    //     // symbol: 'btc_usdt',
    //     output_message: false,
    //     simtrade: SIMTRADE
    // });

    // var ds = new okcoinex.DataStream({
    //     // addr: 'wss://real.okcoin.com:10440/websocket',
    //     // symbol: 'btc_usd',
    //     addr: 'wss://real.okex.com:10441/websocket',
    //     symbol: 'btc_usdt',
    //     output_message: false,
    //     simtrade: SIMTRADE
    // });

    // var ds = new huobi.DataStream({
    //     addr: 'wss://api.huobi.pro/ws',
    //     symbol: 'btcusdt',
    //     simtrade: SIMTRADE
    // });

    // var ds = new binance.DataStream({
    //     addr: 'wss://stream.binance.com:9443/ws',
    //     symbol: 'btcusdt',
    //     timeout_keepalive: 30 * 1000,
    //     timeout_connect: 30 * 1000,
    //     timeout_message: 30 * 1000,
    //     output_message: true,
    //     simtrade: SIMTRADE,
    // });

    var trader = new Trader();
    trader.setStrategy(new Strategy_MarketMaker());
    trader.addMarket('binance', 0, 0, 10000, ds);

    ds.init();
});