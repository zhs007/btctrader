"use strict";

const { SIMDBDataStream_DND } = require('../src/sim/simds_dnd');
const { runDNDLink } = require('../src/sim/run');

const { Trader } = require('../src/trader');
const { Strategy_MarketLink } = require('../src/strategy/marketlink');
const BTCTraderMgr = require('../src/btctradermgr');
const fs = require('fs');

const SIMTRADE = true;
const SIMNAME = 'markerlink';

const cfg = JSON.parse(fs.readFileSync('./config.json', 'utf-8'));

BTCTraderMgr.singleton.init(cfg).then(async () => {

    let simid = await BTCTraderMgr.singleton.newSim(SIMNAME);
    console.log('new simid is ' + simid);

    // var ds0 = new SIMDBDataStream_DND({
    //     mysqlcfg: cfg,
    //     tablename: 'bitflyer_btcjpy_3',
    //     begintime: '2018-03-20 06:53:22 UTC',
    //     endtime: '2018-03-23 14:02:50 UTC',
    //     output_message: false,
    //     simtrade: SIMTRADE
    // });
    //
    // var ds1 = new SIMDBDataStream_DND({
    //     mysqlcfg: cfg,
    //     tablename: 'bitflyer_btcexjpy_3',
    //     begintime: '2018-03-20 06:53:22 UTC',
    //     endtime: '2018-03-23 14:02:50 UTC',
    //     output_message: false,
    //     simtrade: SIMTRADE
    // });

    let tablename0 = 'bitflyer_btcjpy2';
    let tablename1 = 'bitflyer_btcexjpy2';
    let begintime = new Date('2018-03-19 02:54:03 UTC').getTime();
    let endtime = new Date('2018-03-20 06:53:13 UTC').getTime();

    // let tablename0 = 'bitflyer_btcjpy';
    // let tablename1 = 'bitflyer_btcexjpy';
    // let begintime = new Date('2018-03-16 13:02:04 UTC').getTime();
    // let endtime = new Date('2018-03-19 02:53:55 UTC').getTime();

    // let tablename0 = 'bitflyer_btcjpy_3';
    // let tablename1 = 'bitflyer_btcexjpy_3';
    // let begintime = new Date('2018-03-20 06:53:22 UTC').getTime();
    // let endtime = new Date('2018-03-23 14:02:50 UTC').getTime();

    // var ds0 = new SIMDBDataStream_DND({
    //     mysqlcfg: cfg,
    //     tablename: 'bitflyer_btcjpy2',
    //     begintime: begintime,//'2018-03-19 02:54:03 UTC',
    //     endtime: endtime,//'2018-03-20 06:53:13 UTC',
    //     output_message: false,
    //     simtrade: SIMTRADE
    // });
    //
    // var ds1 = new SIMDBDataStream_DND({
    //     mysqlcfg: cfg,
    //     tablename: 'bitflyer_btcexjpy2',
    //     begintime: begintime,//'2018-03-19 02:54:03 UTC',
    //     endtime: endtime,//'2018-03-20 06:53:13 UTC',
    //     output_message: false,
    //     simtrade: SIMTRADE
    // });

    var ds0 = new SIMDBDataStream_DND({
        mysqlcfg: cfg,
        tablename: tablename0,//'bitflyer_btcjpy',
        begintime: begintime,//'2018-03-19 02:54:03 UTC',
        endtime: endtime,//'2018-03-20 06:53:13 UTC',
        output_message: false,
        simtrade: SIMTRADE
    });

    var ds1 = new SIMDBDataStream_DND({
        mysqlcfg: cfg,
        tablename: tablename1,//'bitflyer_btcexjpy',
        begintime: begintime,//'2018-03-19 02:54:03 UTC',
        endtime: endtime,//'2018-03-20 06:53:13 UTC',
        output_message: false,
        simtrade: SIMTRADE
    });

    let strategy = new Strategy_MarketLink();
    strategy.simid = simid;
    strategy.save2db = true;
    strategy.setSimTime(begintime, endtime, begintime + 5 * 60 * 1000, endtime - 5 * 60 * 1000);

    var trader = new Trader();
    trader.setStrategy(strategy);
    trader.addMarket('btc', 0, 0, 10000, ds0);
    trader.addMarket('btcex', 0, 0, 10000, ds1);

    // ds0.init();
    // ds1.init();

    strategy.start(1000);

    await runDNDLink(ds0, ds1);

    BTCTraderMgr.singleton.safeExit(async () => {
        strategy.statistics.output();

        await BTCTraderMgr.singleton.updSim(simid, begintime + 5 * 60 * 1000, endtime - 5 * 60 * 1000,
            strategy.statistics.roi,
            strategy.statistics.startMoney, strategy.statistics.curMoney,
            strategy.statistics.startValue, strategy.statistics.curValue,
            strategy.statistics.maxDrawdown);
    });
});