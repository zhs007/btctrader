"use strict";

require('../src/indicator/allindicator');

const bitmex = require('../src/market/bitmex/index');
const { BXBTDataStream } = require('../src/index/bxbt');
const { Strategy2_MarketMaker } = require('../src/strategy2/marketmaker');
const { Strategy2_MarketMaker5 } = require('../src/strategy2/marketmaker5');
const { Trader2 } = require('../src/trader2');
const Trader2Mgr = require('../src/trader2mgr');

const fs = require('fs');

const SIMTRADE = false;

const cfg = JSON.parse(fs.readFileSync('./config.json', 'utf-8'));

Trader2Mgr.singleton.init(cfg, 'btctrader_order2', 'btctrader_trade2', SIMTRADE).then(() => {
    let ds0 = new BXBTDataStream({
        simtrade: SIMTRADE
    });

    let ds1 = new bitmex.DataStream({
        addr: 'wss://testnet.bitmex.com/realtime',
        time_tick: 1000,
        output_message: false,
        simtrade: SIMTRADE,
        apikey: 'S5Sz2chVmHCcgOkACnOP736M',
        apisecret: 'wz380WdzyRxJct6Dx8hzoJ22STrIy6b2woGLZhdB5FMlI2mH',
    });

    let traderctrl = new bitmex.TraderCtrl({
        symbol: 'XBTUSD',
        baseuri: 'https://testnet.bitmex.com',
        apikey: 'S5Sz2chVmHCcgOkACnOP736M',
        apisecret: 'wz380WdzyRxJct6Dx8hzoJ22STrIy6b2woGLZhdB5FMlI2mH',
    });

    let strategy2 = new Strategy2_MarketMaker5([60 * 1000, 14, 25, 10000, 10, 20, 5000]);
    let trader2 = new Trader2();

    trader2.setStrategy2(strategy2);
    trader2.addDataStream('bg', 'bxbt', ds0, undefined);
    trader2.addDataStream('bitmex', 'XBTUSD', ds1, traderctrl);
    trader2.start();
});