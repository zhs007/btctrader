"use strict";

const bitfinex = require('../../src/market/bitfinex/index');
// var SocksProxyAgent = require('socks-proxy-agent');

var ds = new bitfinex.DataStream({
    addr: 'wss://api.bitfinex.com/ws/2',
    symbol: 'BTCUSD',
    timeout_keepalive: 30 * 1000,
    timeout_connect: 30 * 1000,
    timeout_message: 30 * 1000,
    output_message: true,
    simtrade: true,
    // proxysocks: {host: '118.193.167.118', port: 3824, protocol: 'socks5:', auth: 'xfan007:xfan007'}
});

ds.init();