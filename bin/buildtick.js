"use strict";

const bitflyer = require('../src/market/bitflyer/index');
const { HTMLOutput_ECharts } = require('../src/htmloutput_echarts');

const fs = require('fs');
const process = require('process');

const SIMTRADE = true;
const TNAME0 = 'bitflyer_kl_btcjpy';
const TNAME1 = 'bitflyer_kl_btcexjpy';

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
    let data0 = await mgrData.getCandles(TNAME0, '2018-03-16', '2018-03-17');
    let data1 = await mgrData.getCandles(TNAME1, '2018-03-16', '2018-03-17');

    // let arr = [];
    HTMLOutput_ECharts.singleton.outputKLineOff(data1, data0, './html/' + new Date().getTime() + '.html');

    process.exit();
});