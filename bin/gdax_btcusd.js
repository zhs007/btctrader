"use strict";

const gdax = require('../src/market/gdax/index');

const fs = require('fs');

const SIMTRADE = true;

const cfg = JSON.parse(fs.readFileSync('./config.json', 'utf-8'));

gdax.DataMgr.singleton.init(cfg).then(() => {
    var ds = new gdax.DataStream({
        output_message: false,
        simtrade: SIMTRADE,
        tickdatatname: 'gdax_btcusd',
        candledatatname: 'gdax_kl_btcusd',
        // symbol: 'btcusdt'
    });

    ds.mgrData = gdax.DataMgr.singleton;
    ds.init();
});