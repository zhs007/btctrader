"use strict";

require('../src/indicator/allindicator');

const bitmex = require('../src/market/bitmex/index');
const { SIMDBDataStream_DND } = require('../src/sim/simds_dnd');
const { runDNDLink } = require('../src/sim/run');

const { Trader2 } = require('../src/trader2');
const { Strategy2_MarketMaker5 } = require('../src/strategy2/marketmaker5');
const { Strategy2_CountBackLine } = require('../src/strategy2/countbackline');
// const { Strategy_MarketMaker2 } = require('../src/strategy/marketmaker2');
const Trader2Mgr = require('../src/trader2mgr');
const fs = require('fs');
const process = require('process');

const SIMTRADE = true;

const cfg = JSON.parse(fs.readFileSync('./config.json', 'utf-8'));

let bt = '2018-04-05 04:13:00 UTC';
let et = '2018-04-06 04:13:00 UTC';
// let et = '2018-04-05 04:12:00 UTC';

Trader2Mgr.singleton.init(cfg, 'btctrader_order2', 'btctrader_trade2', SIMTRADE).then(async () => {
    // OrderMgr.singleton.isSimMode = SIMTRADE;

    let traderctrl = new bitmex.TraderCtrl({
        symbol: 'XBTUSD',
        // baseuri: 'https://testnet.bitmex.com',
        apikey: '',
        apisecret: '',
    });

    let ds0 = new SIMDBDataStream_DND({
        mysqlcfg: cfg,
        tablename: 'bitmex_bxbt_2',
        begintime: bt,
        endtime: et,
        output_message: false,
        simtrade: SIMTRADE
    });

    let ds1 = new SIMDBDataStream_DND({
        mysqlcfg: cfg,
        tablename: 'bitmex_xbtusd_2',
        begintime: bt,
        endtime: et,
        output_message: false,
        simtrade: SIMTRADE
    });

    let trader = new Trader2();
    trader.setStrategy2(new Strategy2_MarketMaker5([60 * 1000, 14, 25, 10000, 10, 20, 100000]));
    trader.addDataStream('bg', 'bxbt', ds0, undefined);
    trader.addDataStream('bitmex', 'xbtusd', ds1, traderctrl);
    trader.start();

    await runDNDLink(ds0, ds1);

    process.exit();
});
