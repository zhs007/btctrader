"use strict";

const binance = require('../src/market/binance/index');

const { Trader } = require('../src/trader');
const { Strategy_MarketMaker } = require('../src/strategy/marketmaker');
const BTCTraderMgr = require('../src/btctradermgr');
const fs = require('fs');

const SIMTRADE = true;

const cfg = JSON.parse(fs.readFileSync('./config.json', 'utf-8'));

BTCTraderMgr.singleton.init(cfg).then(() => {
    var ds = new binance.DataStream({
        addr: 'wss://stream.binance.com:9443/ws',
        symbol: 'btcusdt',
        timeout_keepalive: 30 * 1000,
        timeout_connect: 30 * 1000,
        timeout_message: 30 * 1000,
        output_message: true,
        simtrade: SIMTRADE,
    });

    var trader = new Trader();
    trader.setStrategy(new Strategy_MarketMaker());
    trader.addMarket('binance', 0, 0, 10000, ds);

    ds.init();
});