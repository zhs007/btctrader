"use strict";

const bitmex = require('../../src/market/bitmex/index');
const { BXBTDataStream } = require('../../src/index/bxbt');

const fs = require('fs');

const SIMTRADE = true;

const cfg = JSON.parse(fs.readFileSync('./config.json', 'utf-8'));

bitmex.DataMgr.singleton.init(cfg).then(() => {
    var ds = new BXBTDataStream({
        output_message: false,
        simtrade: SIMTRADE,
        tickdatatname: 'bitmex_bxbt_2',
        candledatatname: 'bitmex_kl_bxbt_2',
        tickdataex: true,
        onlycandleinfo: true
        // symbol: 'btcusdt'
    });

    ds.mgrData = bitmex.DataMgr.singleton;
    ds.init();
});