"use strict";

const bitmex = require('../src/market/bitmex/index');
const { BXBTDataStream } = require('../src/index/bxbt');
const { Strategy_AnchoredPrice } = require('../src/strategy/anchoredprice');
const BTCTraderMgr = require('../src/btctradermgr');
const OrderMgr = require('../src/ordermgr');
const { Trader } = require('../src/trader');

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

OrderMgr.singleton.init(cfg, 'btctrader_order').then(() => {
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

    var strategy = new Strategy_AnchoredPrice();
    var trader = new Trader();
    // trader.setStrategy(new Strategy_AnchoredPrice());
    trader.setStrategy(strategy);
    trader.addMarket('bxbt', 0, 0, 10000, ds0);
    trader.addMarket('bitmex', 0, 0, 10000, ds1, traderctrl);

    // ds0.init();
    // ds1.init();

    strategy.start(1000);
});