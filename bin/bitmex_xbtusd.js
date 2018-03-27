"use strict";

const bitmex = require('../src/market/bitmex/index');

const fs = require('fs');

const SIMTRADE = true;

const cfg = JSON.parse(fs.readFileSync('./config.json', 'utf-8'));

bitmex.DataMgr.singleton.init(cfg).then(() => {
    var ds = new bitmex.DataStream({
        output_message: false,
        simtrade: SIMTRADE,
        tickdatatname: 'bitmex_xbtusd',
        candledatatname: 'bitmex_kl_xbtusd',
        // symbol: 'btcusdt'
    });

    ds.mgrData = bitmex.DataMgr.singleton;
    ds.init();
});