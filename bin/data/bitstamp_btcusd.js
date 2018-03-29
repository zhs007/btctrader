"use strict";

const bitstamp = require('../../src/market/bitstamp/index');

const fs = require('fs');

const SIMTRADE = true;

const cfg = JSON.parse(fs.readFileSync('./config.json', 'utf-8'));

bitstamp.DataMgr.singleton.init(cfg).then(() => {
    var ds = new bitstamp.DataStream({
        output_message: false,
        simtrade: SIMTRADE,
        tickdatatname: 'bitstamp_btcusd',
        candledatatname: 'bitstamp_kl_btcusd',
        // symbol: 'btcusdt'
    });

    ds.mgrData = bitstamp.DataMgr.singleton;
    ds.init();
});