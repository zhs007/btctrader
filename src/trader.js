"use strict";

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
    constructor(name, p, v, m) {
        this.name = name;

        this.lstTrade = [];

        this.volume = v;
        this.price = p;

        this.money = m;
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

        return true;
    }
};

class Trader {
    constructor() {
        this.lstMarket = [];
    }

    addMarket(name, p, v, m) {
        let cm = new Market(name, p, v, m);
        this.lstMarket.push(cm);
    }

    buy(marketindex, p, v, ts) {
        return this.lstMarket[marketindex].buy(p, v, ts);
    }

    sell(marketindex, p, v, ts) {
        return this.lstMarket[marketindex].sell(p, v, ts);
    }
};

exports.Trade = Trade;
exports.Market = Market;
exports.Trader = Trader;