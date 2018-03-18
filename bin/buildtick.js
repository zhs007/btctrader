"use strict";

const bitflyer = require('../src/market/bitflyer/index');
const { HTMLOutput_ECharts } = require('../src/htmloutput_echarts');

const fs = require('fs');
const process = require('process')

const SIMTRADE = true;
const TNAME = 'bitflyer_btcjpy';

const cfg = JSON.parse(fs.readFileSync('./config.json', 'utf-8'));

bitflyer.DataMgr.singleton.init(cfg).then(async () => {
    // var ds = new bitflyer.DataStream({
    //     output_message: false,
    //     simtrade: SIMTRADE,
    //     tickdatatname: 'bitflyer_btcexjpy'
    // });
    //
    // ds.mgrData = bitflyer.DataMgr.singleton;
    // ds.init();

    let mgrData = bitflyer.DataMgr.singleton;
    let data = await mgrData.getTick(TNAME);

    let arr = [];
    HTMLOutput_ECharts.singleton.outputLine(data, './html/' + new Date().getTime() + '.html');

    process.exit();
});