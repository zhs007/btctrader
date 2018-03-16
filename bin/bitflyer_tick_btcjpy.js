"use strict";

const bitflyer = require('../src/market/bitflyer/index');

const fs = require('fs');

const SIMTRADE = true;

const cfg = JSON.parse(fs.readFileSync('./config.json', 'utf-8'));

bitflyer.DataMgr.singleton.init(cfg).then(() => {
    var ds = new bitflyer.DataStream({
        output_message: true,
        simtrade: SIMTRADE,
        tickdatatname: 'bitflyer_btcjpy',
        symbol: 'BTC_JPY'
    });

    ds.mgrData = bitflyer.DataMgr.singleton;
    ds.init();
});