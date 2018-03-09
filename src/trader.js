"use strict";

const { DEPTHINDEX } = require('./wsdatastream');
const BTCTraderMgr = require('./btctradermgr');

const TRADETYPE_BUY     = 1;
const TRADETYPE_NORMAL  = 0;
const TRADETYPE_SELL    = -1;

class Trade {
    constructor() {
        this.ts = new Date().getTime();
        this.price = 0;
        this.volume = 0;
        this.type = TRADETYPE_NORMAL;
    }

    buy(p, v, ts) {
        this.ts = ts;
        this.price = p;
        this.volume = v;
        this.type = TRADETYPE_BUY;
    }

    sell(p, v, ts) {
        this.ts = ts;
        this.price = p;
        this.volume = v;
        this.type = TRADETYPE_SELL;
    }
};

class Market {
    constructor(name, p, v, m, ds) {
        this.name = name;

        this.lstTrade = [];

        this.volume = v;
        this.price = p;
        this.money = m;

        this.bv = v;
        this.bp = p;
        this.bm = m;

        this.ds = ds;
    }

    setMoney(m) {
        this.money = m;
    }

    buy(p, v, ts) {
        if (this.money <= 0) {
            return false;
        }

        let cm = p * v;
        if (cm > this.money) {
            v = this.money / p;
        }

        cm = p * v;

        let ct = new Trade();
        ct.buy(p, v, ts);
        this.lstTrade.push(ct);

        let lastv = this.volume;
        this.volume += v;
        this.price = (lastv * this.price + cm) / this.volume;

        this.money -= cm;

        // BTCTraderMgr.singleton.insertTrade(TRADETYPE_BUY, p, v, this.price, this.volume, this.money, this.bp, this.bv, this.bm);

        return true;
    }

    sell(p, v, ts) {
        if (this.volume <= 0) {
            return false;
        }

        if (v > this.volume) {
            v = this.volume;
        }

        let cm = p * v;
        let ct = new Trade();
        ct.sell(p, v, ts);
        this.lstTrade.push(ct);

        this.volume -= v;
        this.money += cm;

        // BTCTraderMgr.singleton.insertTrade(TRADETYPE_SELL, p, v, this.price, this.volume, this.money, this.bp, this.bv, this.bm);

        return true;
    }
};

class Trader {
    constructor() {
        this.strategy = undefined;
        this.lstMarket = [];
    }

    addMarket(name, p, v, m, ds) {
        let cm = new Market(name, p, v, m, ds);
        if (this.strategy != undefined) {
            ds.strategy = this.strategy;
        }

        this.lstMarket.push(cm);
    }

    setStrategy(strategy) {
        this.strategy = strategy;
        this.strategy.trader = this;

        for (let i = 0; i < this.lstMarket.length; ++i) {
            this.lstMarket.ds.strategy = strategy;
        }
    }

    buy(marketindex, p, v, ts) {
        return this.lstMarket[marketindex].buy(p, v, ts);
    }

    sell(marketindex, p, v, ts) {
        return this.lstMarket[marketindex].sell(p, v, ts);
    }

    buyDepthArr(marketindex, arr, ts) {
        for (let i = 0; i < arr.length; ++i) {
            this.buy(marketindex, arr[i][DEPTHINDEX.PRICE], arr[i][DEPTHINDEX.VOLUME], ts);
        }
    }

    sellDepthArr(marketindex, arr, ts) {
        for (let i = 0; i < arr.length; ++i) {
            this.sell(marketindex, arr[i][DEPTHINDEX.PRICE], arr[i][DEPTHINDEX.VOLUME], ts);
        }
    }

    hasAllDepth() {
        for (let i = 0; i < this.lstMarket.length; ++i) {
            if (!this.lstMarket[i].ds.hasDepth()) {
                return false;
            }
        }

        return true;
    }
};

exports.Trade = Trade;
exports.Market = Market;
exports.Trader = Trader;