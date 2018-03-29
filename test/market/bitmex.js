"use strict";

const bitmex = require('../../src/market/bitmex/index');
const { countOrderList } = require('../../src/order');
const process = require('process');
// var SocksProxyAgent = require('socks-proxy-agent');

var ds = new bitmex.DataStream({
    addr: 'wss://testnet.bitmex.com/realtime',
    // symbol: 'BTC',
    time_tick: 1000,
    output_message: true,
    simtrade: true,
    apikey: 'S5Sz2chVmHCcgOkACnOP736M',
    apisecret: 'wz380WdzyRxJct6Dx8hzoJ22STrIy6b2woGLZhdB5FMlI2mH',
    // proxysocks: {host: '118.193.167.118', port: 3824, protocol: 'socks5:', auth: 'xfan007:xfan007'}
});

ds.init();

var traderctrl = new bitmex.TraderCtrl({
    baseuri: 'https://testnet.bitmex.com',
    apikey: 'S5Sz2chVmHCcgOkACnOP736M',
    apisecret: 'wz380WdzyRxJct6Dx8hzoJ22STrIy6b2woGLZhdB5FMlI2mH',
});

process.nextTick(async () => {
    let lst = await traderctrl.getAllOrderList();
    console.log(lst);
    let ret = countOrderList(lst);
    console.log(ret);
});
