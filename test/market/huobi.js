"use strict";

const huobi = require('../../src/market/huobi/index');
// var SocksProxyAgent = require('socks-proxy-agent');

var ds = new huobi.DataStream({
    addr: 'wss://api.huobi.pro/ws',
    symbol: 'btcusdt',
    timeout_keepalive: 30 * 1000,
    timeout_connect: 30 * 1000,
    timeout_message: 30 * 1000,
    output_message: true,
    simtrade: true,
    // proxysocks: {host: '118.193.167.118', port: 3824, protocol: 'socks5:', auth: 'xfan007:xfan007'}
});

ds.init();