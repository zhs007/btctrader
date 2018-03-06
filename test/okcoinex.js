"use strict";

const okcoinex = require('../src/market/okcoinex/index');

var ds = new okcoinex.DataStream({
    addr: 'wss://real.okex.com:10441/websocket',
    symbol: 'btc_usdt'
});

ds.init();