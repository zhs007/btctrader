"use strict";

const quoinex = require('../../src/market/quoinex/index');
// var SocksProxyAgent = require('socks-proxy-agent');

var ds = new quoinex.DataStream({
    // addr: 'wss://api.bitfinex.com/ws/2',
    // symbol: 'BTC',
    time_tick: 1000,
    output_message: true,
    simtrade: true,
    // proxysocks: {host: '118.193.167.118', port: 3824, protocol: 'socks5:', auth: 'xfan007:xfan007'}
});

ds.init();