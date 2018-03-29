"use strict";

const bitflyer = require('../../src/market/bitflyer/index');

const fs = require('fs');

const SIMTRADE = true;

const cfg = JSON.parse(fs.readFileSync('./config.json', 'utf-8'));

bitflyer.DataMgr.singleton.init(cfg).then(() => {
    var ds = new bitflyer.DataStream({
        output_message: false,
        simtrade: SIMTRADE,
        tickdatatname: 'bitflyer_btcexjpy_5',
        candledatatname: 'bitflyer_kl_btcexjpy_5'
    });

    ds.mgrData = bitflyer.DataMgr.singleton;
    ds.init();
});