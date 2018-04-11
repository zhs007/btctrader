"use strict";

const { Mysql } = require('./mysql');
const { randomInt, randomString, makeInsertSql, makeUpdateSql } = require('./util');
const { TRADESIDE, TRADEEXECTYPE, ORDERTYPE, ORDERSIDE } = require('./basedef');
const util = require('util');

class MarketTrade {
    constructor() {
        this.lstTrade = [];
        // this.mapServOrder = {};

        // this.lstLimitBuy = [];
        // this.lstLimitSell = [];
        //
        // this.lstMarketBuy = [];
        // this.lstMarketSell = [];
    }

    addTrade(trade) {
        this.lstTrade.push(trade);
    }
};

class TradeMgr {
    constructor() {
        this.cfg = undefined;
        this.mysql = undefined;

        this.tablename = '';

        this.mapMarket = {};
    }

    async init(cfg, tablename) {
        this.tablename = tablename;
        this.cfg = cfg;
        this.mysql = new Mysql(cfg);
    }

    _addTrade(trade) {
        if (!this.mapMarket.hasOwnProperty(trade.market)) {
            this.mapMarket[trade.market] = new MarketTrade();
        }

        this.mapMarket[trade.market].addTrade(trade);
    }

    newTrade(order, price, volume, timems) {
        let cv = volume;

        if (!order.hasOwnProperty('lastvolume')) {
            order.lastvolume = order.volume;
        }

        if (order.lastvolume <= volume) {
            cv = order.lastvolume;
        }

        if (order.lastvolume != order.volume) {
            order.avgprice = (order.avgprice * (order.volume - order.lastvolume) + price * cv) / (order.volume - order.lastvolume + cv);
        }
        else {
            order.avgprice = price;
        }

        order.lastvolume -= cv;

        let ct = {
            market: order.market,
            symbol: order.symbol,
            side: order.side,
            timems: timems,
            ordervolume: order.volume,
            // orderprice: order.price,
            price: price,
            volume: volume,
            exectype: TRADEEXECTYPE.TRADE,
            ordertype: order.ordtype,
            ordermainid: order.mainid,
            orderindex: order.orderindex
        };

        if (ct.hasOwnProperty('price')) {
            ct.orderprice = ct.price;
        }

        if (order.side == ORDERSIDE.BUY) {
            console.log('trade - buy ' + price);
        }
        else {
            console.log('trade - sell ' + price);
        }

        this._addTrade(ct);

        return ct;
    }
};

exports.singleton = new TradeMgr();