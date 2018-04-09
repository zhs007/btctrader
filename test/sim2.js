"use strict";

const { SIMDBDataStream_DND } = require('../src/sim/simds_dnd');
const { runDNDLink } = require('../src/sim/run');

const { Trader2 } = require('../src/trader2');
const { Strategy2_MarketMaker } = require('../src/strategy2/marketmaker');
// const { Strategy_MarketMaker2 } = require('../src/strategy/marketmaker2');
// const BTCTraderMgr = require('../src/btctradermgr');
const fs = require('fs');
const process = require('process');

const SIMTRADE = true;

const cfg = JSON.parse(fs.readFileSync('./config.json', 'utf-8'));

let bt = '2018-04-01 13:29:00 UTC';
let et = '2018-04-02 04:12:00 UTC';
// let et = '2018-04-05 04:12:00 UTC';

process.nextTick(async () => {
    let ds0 = new SIMDBDataStream_DND({
        mysqlcfg: cfg,
        tablename: 'bitmex_bxbt',
        begintime: bt,
        endtime: et,
        output_message: false,
        simtrade: SIMTRADE
    });

    let ds1 = new SIMDBDataStream_DND({
        mysqlcfg: cfg,
        tablename: 'bitmex_xbtusd',
        begintime: bt,
        endtime: et,
        output_message: false,
        simtrade: SIMTRADE
    });

    let trader = new Trader2();
    trader.setStrategy2(new Strategy2_MarketMaker());
    trader.addDataStream('bg', 'bxbt', ds0, undefined);
    trader.addDataStream('bitmex', 'xbtusd', ds1, undefined);
    trader.start();

    await runDNDLink(ds0, ds1);

    process.exit();
});