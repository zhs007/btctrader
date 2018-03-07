"use strict";

const huobi = require('../src/market/huobi/index');

var ds = new huobi.DataStream({
    addr: 'wss://api.huobi.pro/ws',
    symbol: 'btcusdt',
    timeout_keepalive: 30 * 1000,
    timeout_connect: 30 * 1000,
    timeout_message: 30 * 1000,
    output_message: true
});

ds.init();