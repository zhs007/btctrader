"use strict";

const huobi = require('../src/market/huobi/index');

var ds = new huobi.DataStream({
    addr: 'wss://api.huobi.pro/ws',
    symbol: 'btcusdt'
});

ds.init();