"use strict";

const binance = require('../src/market/binance/index');
const huobi = require('../src/market/huobi/index');
const okcoinex = require('../src/market/okcoinex/index');
const bitfinex = require('../src/market/bitfinex/index');
const bithumb = require('../src/market/bithumb/index');
const coincheck = require('../src/market/coincheck/index');
const bitflyer = require('../src/market/bitflyer/index');
const quoinex = require('../src/market/quoinex/index');

const { Trader } = require('../src/trader');
const { Strategy_MulMarket } = require('../src/strategy/mulmarket');
const BTCTraderMgr = require('../src/btctradermgr');
const fs = require('fs');

const SIMTRADE = true;

const cfg = JSON.parse(fs.readFileSync('./config.json', 'utf-8'));

BTCTraderMgr.singleton.init(cfg).then(() => {
    var ds0 = new bitfinex.DataStream({
        // addr: 'wss://real.okcoin.com:10440/websocket',
        // symbol: 'btc_usd',
        // addr: 'wss://real.okex.com:10441/websocket',
        symbol: 'BTCUSD',
        output_message: false,
        simtrade: SIMTRADE
    });

    // var ds0 = new okcoinex.DataStream({
    //     // addr: 'wss://real.okcoin.com:10440/websocket',
    //     // symbol: 'btc_usd',
    //     addr: 'wss://real.okex.com:10441/websocket',
    //     symbol: 'btc_usdt',
    //     output_message: false,
    //     simtrade: SIMTRADE
    // });

    // var ds0 = new huobi.DataStream({
    //     addr: 'wss://api.huobi.pro/ws',
    //     symbol: 'ethusdt',
    //     simtrade: SIMTRADE
    // });

    // var ds0 = new binance.DataStream({
    //     // addr: 'wss://stream.binance.com:9443/ws',
    //     // symbol: 'eosusdt',
    //     timeout_keepalive: 30 * 1000,
    //     timeout_connect: 30 * 1000,
    //     timeout_message: 30 * 1000,
    //     output_message: false,
    //     simtrade: SIMTRADE,
    // });

    // var ds0 = new quoinex.DataStream({
    //     // addr: 'wss://api.bitfinex.com/ws/2',
    //     // symbol: 'BTC',
    //     time_tick: 1000,
    //     output_message: false,
    //     simtrade: true,
    //     // proxysocks: {host: '118.193.167.118', port: 3824, protocol: 'socks5:', auth: 'xfan007:xfan007'}
    // });

    // var ds1 = new okcoinex.DataStream({
    //     // addr: 'wss://real.okcoin.com:10440/websocket',
    //     // symbol: 'btc_usd',
    //     addr: 'wss://real.okex.com:10441/websocket',
    //     symbol: 'eos_usdt',
    //     output_message: false,
    //     simtrade: SIMTRADE
    // });

    // var ds1 = new bithumb.DataStream({
    //     // addr: 'wss://real.okcoin.com:10440/websocket',
    //     // symbol: 'btc_usd',
    //     // addr: 'wss://real.okex.com:10441/websocket',
    //     // symbol: 'btc_usdt',
    //     output_message: false,
    //     simtrade: SIMTRADE
    // });

    // var ds1 = new coincheck.DataStream({
    //     // addr: 'wss://real.okcoin.com:10440/websocket',
    //     // symbol: 'btc_usd',
    //     // addr: 'wss://real.okex.com:10441/websocket',
    //     // symbol: 'btc_usdt',
    //     output_message: false,
    //     simtrade: SIMTRADE
    // });

    var ds1 = new bitflyer.DataStream({
        // addr: 'wss://real.okcoin.com:10440/websocket',
        // symbol: 'btc_usd',
        // addr: 'wss://real.okex.com:10441/websocket',
        symbol: 'BTC_JPY',
        output_message: false,
        simtrade: SIMTRADE
    });

    var trader = new Trader();
    trader.setStrategy(new Strategy_MulMarket());
    trader.addMarket('bitfinex', 0, 0, 10000, ds0);
    trader.addMarket('binance', 0, 0, 10000, ds1);

    ds0.init();
    ds1.init();
});