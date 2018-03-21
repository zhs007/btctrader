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

    var ds0 = new SIMDBDataStream_DND({
        mysqlcfg: cfg,
        tablename: 'bitflyer_btcjpy',
        begintime: '2018-03-16 13:02:03 UTC',
        endtime: '2018-03-19 02:53:58 UTC',
        output_message: false,
        simtrade: SIMTRADE
    });

    var ds1 = new SIMDBDataStream_DND({
        mysqlcfg: cfg,
        tablename: 'bitflyer_btcexjpy',
        begintime: '2018-03-16 13:02:03 UTC',
        endtime: '2018-03-19 02:53:58 UTC',
        output_message: false,
        simtrade: SIMTRADE
    });

    let strategy = new Strategy_MarketLink();
    strategy.simid = simid;
    strategy.save2db = true;

    var trader = new Trader();
    trader.setStrategy(strategy);
    trader.addMarket('btc', 0, 0, 10000, ds0);
    trader.addMarket('btcex', 0, 0, 10000, ds1);

    // ds0.init();
    // ds1.init();

    strategy.start(1000);

    await runDNDLink(ds0, ds1);
});