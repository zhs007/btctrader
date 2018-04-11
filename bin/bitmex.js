"use strict";

const bitmex = require('../src/market/bitmex/index');
const { BXBTDataStream } = require('../src/index/bxbt');
const { Strategy2_MarketMaker } = require('../src/strategy2/marketmaker');
const BTCTraderMgr = require('../src/btctradermgr');
const OrderMgr = require('../src/ordermgr');
const { Trader2 } = require('../src/trader2');
const Trader2Mgr = require('../src/trader2mgr');

const fs = require('fs');

const SIMTRADE = false;

const cfg = JSON.parse(fs.readFileSync('./config.json', 'utf-8'));

// bitmex.DataMgr.singleton.init(cfg).then(() => {
//     var ds = new bitmex.DataStream({
//         output_message: false,
//         simtrade: SIMTRADE,
//         tickdatatname: 'bitmex_xbtusd',
//         candledatatname: 'bitmex_kl_xbtusd',
//         // symbol: 'btcusdt'
//     });
//
//     ds.mgrData = bitmex.DataMgr.singleton;
//     ds.init();
// });

Trader2Mgr.singleton.init(cfg, 'btctrader_order2', 'btctrader_trade2', SIMTRADE).then(() => {
    var ds0 = new BXBTDataStream({
        simtrade: SIMTRADE
    });

    var ds1 = new bitmex.DataStream({
        addr: 'wss://testnet.bitmex.com/realtime',
        time_tick: 1000,
        output_message: false,
        simtrade: SIMTRADE,
        apikey: 'S5Sz2chVmHCcgOkACnOP736M',
        apisecret: 'wz380WdzyRxJct6Dx8hzoJ22STrIy6b2woGLZhdB5FMlI2mH',
    });

    var traderctrl = new bitmex.TraderCtrl({
        symbol: 'XBTUSD',
        baseuri: 'https://testnet.bitmex.com',
        apikey: 'S5Sz2chVmHCcgOkACnOP736M',
        apisecret: 'wz380WdzyRxJct6Dx8hzoJ22STrIy6b2woGLZhdB5FMlI2mH',
    });

    var strategy2 = new Strategy2_MarketMaker();
    var trader2 = new Trader2();
    // trader.setStrategy(new Strategy_AnchoredPrice());
    trader2.setStrategy2(strategy2);
    // trader2.addMarket('bxbt', 0, 0, 10000, ds0);
    // trader2.addMarket('bitmex', 0, 0, 10000, ds1, traderctrl);

    trader2.addDataStream('bg', 'bxbt', ds0, undefined);
    trader2.addDataStream('bitmex', 'XBTUSD', ds1, traderctrl);
    trader2.start();

    // ds0.init();
    // ds1.init();

    // strategy.start(1000);
});