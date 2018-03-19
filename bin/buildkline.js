"use strict";

const bitflyer = require('../src/market/bitflyer/index');

const fs = require('fs');
const { buildCandles2, alignCandles2 } = require('libtrader');

const SIMTRADE = true;
const TNAME = 'bitflyer_btcexjpy';
const TNAME_DEST = 'bitflyer_kl_btcexjpy';

const cfg = JSON.parse(fs.readFileSync('./config.json', 'utf-8'));

bitflyer.DataMgr.singleton.init(cfg).then(async () => {
    // var ds = new bitflyer.DataStream({
    //     output_message: false,
    //     simtrade: SIMTRADE,
    //     tickdatatname: 'bitflyer_btcjpy',
    //     symbol: 'BTC_JPY'
    // });
    //
    // ds.mgrData = bitflyer.DataMgr.singleton;
    // ds.init();

    let st = new Date('2018-03-16').getTime();
    let et = new Date('2018-03-19').getTime();
    let mgrData = bitflyer.DataMgr.singleton;

    let dealsoptions = {
        tsms: 'tsms',
        price: 'price',
        volume: 'volume',
        askprice: 'askprice',
        askvolume: 'askvolume',
        bidprice: 'bidprice',
        bidvolume: 'bidvolume'
    };

    let candlesoptions = {
        realtime: 'ts',
        ask_o: 'ask_o',
        ask_c: 'ask_c',
        ask_h: 'ask_h',
        ask_l: 'ask_l',
        bid_o: 'bid_o',
        bid_c: 'bid_c',
        bid_h: 'bid_h',
        bid_l: 'bid_l',
        op: 'op',
        cp: 'cp',
        hp: 'hp',
        lp: 'lp',
        volume: 'volume'
    };

    while (st <= et) {
        let lsttick = await mgrData.getTick(TNAME, st, st + 24 * 60 * 60 * 1000);

        let lstkl = buildCandles2(lsttick, dealsoptions, candlesoptions,
            st, st + 24 * 60 * 60 * 1000);

        let lstkl2 = alignCandles2(lstkl, candlesoptions, (timems) => {
            return timems + 1000;
        }, st, st + 24 * 60 * 60 * 1000);

        lstkl2.splice(lstkl2.length - 1, 1);

        await mgrData.saveCandles(TNAME_DEST, lstkl2);

        st += 24 * 60 * 60 * 1000;
    }

    process.exit();
});