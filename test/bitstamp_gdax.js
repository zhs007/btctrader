"use strict";

const bitstamp = require('../src/market/bitstamp/index');
const gdax = require('../src/market/gdax/index');
const { IndexDataStream } = require('../src/indexdatastream');

const fs = require('fs');

const SIMTRADE = true;

const cfg = JSON.parse(fs.readFileSync('./config.json', 'utf-8'));

bitstamp.DataMgr.singleton.init(cfg).then(() => {
    var ds0 = new bitstamp.DataStream({
        output_message: false,
        simtrade: SIMTRADE,
        // tickdatatname: 'bitmex_xbtusd',
        // candledatatname: 'bitmex_kl_xbtusd',
        // symbol: 'btcusdt'
    });

    var ds1 = new gdax.DataStream({
        output_message: false,
        simtrade: SIMTRADE,
        // tickdatatname: 'bitmex_xbtusd',
        // candledatatname: 'bitmex_kl_xbtusd',
        // symbol: 'btcusdt'
    });

    var ds = new IndexDataStream({
        output_message: false,
        simtrade: SIMTRADE,
        // tickdatatname: 'bitmex_xbtusd',
        candledatatname: 'bxbx_kl',
        // symbol: 'btcusdt'
    }, [ds0, ds1]);

    ds.mgrData = bitstamp.DataMgr.singleton;
    ds.init();
});