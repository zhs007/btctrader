"use strict";

const allcoin = require('../src/market/allcoin/index');
// var SocksProxyAgent = require('socks-proxy-agent');

var ds = new allcoin.DataStream({
    // addr: 'wss://api.bitfinex.com/ws/2',
    // symbol: 'BTC',
    time_tick: 1000,
    output_message: true,
    simtrade: true,
    // proxysocks: {host: '118.193.167.118', port: 3824, protocol: 'socks5:', auth: 'xfan007:xfan007'}
});

ds.init();