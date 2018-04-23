"use strict";

const { Mysql } = require('./mysql');
const { randomInt, randomString, makeInsertSql, makeUpdateSql } = require('./util');
const { TRADESIDE, TRADEEXECTYPE, ORDERTYPE, ORDERSIDE, ORDERSTATE } = require('./basedef');
const { addTrade2Order } = require('./order');
const util = require('util');

// trade.market
// trade.symbol
// trade.side           - TRADESIDE
// trade.timems
// trade.ordervolume
// trade.orderprice
// trade.price
// trade.volume
// trade.feerate
// trade.feepaid
// trade.exectype       - TRADEEXECTYPE
// trade.ordertype      - ORDERTYPE
// trade.ordermainid
// trade.orderindex
// trade.simid

const LST_INSORDER_KEY = [
    'market',
    'symbol',
    'side',
    'timems',
    'ordervolume',
    'orderprice',
    'price',
    'volume',
    'feerate',
    'feepaid',
    'exectype',
    'ordertype',
    'ordermainid',
    'orderindex',
];

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
        await this.mysql.connect();
    }

    async insTrade(trade) {
        if (this.mysql == undefined) {
            return -1;
        }

        let sql = makeInsertSql(this.tablename, trade, (key) => {
            return LST_INSORDER_KEY.indexOf(key) >= 0;
        });

        try {
            let [err, rows, fields] = await this.mysql.run(sql);
            if (err) {
                console.log('TradeMgr.insTrade(' + sql + ') err ' + err);

                return -1;
            }

            return rows.insertId;
        }
        catch (err) {
            console.log('TradeMgr.insTrade(' + sql + ') err ' + err);
        }

        return -1;
    }

    _addTrade(trade) {
        if (!this.mapMarket.hasOwnProperty(trade.market)) {
            this.mapMarket[trade.market] = new MarketTrade();
        }

        this.insTrade(trade);

        this.mapMarket[trade.market].addTrade(trade);
    }

    newTrade(order, price, volume, timems) {
        let cv = volume;

        if (!order.hasOwnProperty('lastvolume')) {
            order.lastvolume = order.volume;
        }

        order.lastturnvolume = order.volume - order.lastvolume;
        order.lastturnprice = order.avgprice;

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
        if (order.lastvolume <= 0) {
            order.closems = timems;
            order.ordstate = ORDERSTATE.CLOSE;
        }
        else {
            order.ordstate = ORDERSTATE.RUNNING;
        }

        order.isupd = true;

        let ct = {
            market: order.market,
            symbol: order.symbol,
            side: order.side,
            timems: timems,
            ordervolume: order.volume,
            // orderprice: order.price,
            price: price,
            volume: cv,
            exectype: TRADEEXECTYPE.TRADE,
            ordertype: order.ordtype,
            ordermainid: order.mainid,
            orderindex: order.indexid
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

        addTrade2Order(order, ct);

        return ct;
    }
};

exports.singleton = new TradeMgr();