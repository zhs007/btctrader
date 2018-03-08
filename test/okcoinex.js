"use strict";

const okcoinex = require('../src/market/okcoinex/index');

var ds = new okcoinex.DataStream({
    addr: 'wss://real.okex.com:10441/websocket',
    symbol: 'btc_usdt',
    timeout_keepalive: 30 * 1000,
    timeout_connect: 30 * 1000,
    timeout_message: 30 * 1000,
    output_message: true,
    simtrade: true
});

ds.init();