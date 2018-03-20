"use strict";

const { SIMDBDataStream_DND } = require('../src/sim/simds_dnd');

const { Trader } = require('../src/trader');
const { Strategy_MarketMaker } = require('../src/strategy/marketmaker');
const { Strategy_MarketMaker2 } = require('../src/strategy/marketmaker2');
const BTCTraderMgr = require('../src/btctradermgr');
const fs = require('fs');
const process = require('process');

const SIMTRADE = true;

const cfg = JSON.parse(fs.readFileSync('./config.json', 'utf-8'));

BTCTraderMgr.singleton.init(cfg).then(async () => {
    var ds = new SIMDBDataStream_DND({
        mysqlcfg: cfg,
        tablename: 'bitflyer_btcexjpy',
        begintime: '2018-03-16 13:02:03 UTC',
        endtime: '2018-03-19 02:53:58 UTC',
        output_message: false,
        simtrade: SIMTRADE
    });

    // var ds = new quoinex.DataStream({
    //     // addr: 'wss://real.okcoin.com:10440/websocket',
    //     // symbol: 'btc_usd',
    //     // addr: 'wss://real.okex.com:10441/websocket',
    //     // symbol: 'btc_usdt',
    //     output_message: false,
    //     simtrade: SIMTRADE
    // });

    // var ds = new coincheck.DataStream({
    //     // addr: 'wss://real.okcoin.com:10440/websocket',
    //     // symbol: 'btc_usd',
    //     // addr: 'wss://real.okex.com:10441/websocket',
    //     // symbol: 'btc_usdt',
    //     output_message: false,
    //     simtrade: SIMTRADE
    // });

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
    trader.setStrategy(new Strategy_MarketMaker2());
    trader.addMarket('binance', 0, 0, 10000, ds);

    ds.init();

    await ds.run();

    process.exit();
});