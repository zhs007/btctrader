"use strict";

const { Market2 } = require('./market2');
const OrderMgr = require('./ordermgr');

class Trader2 {
    constructor(typename, ver, instanceid) {
        this.typename = typename;
        this.ver = ver;
        this.instanceid = 0;

        this.lstDataStream = [];
        this.strategy2 = undefined;
    }

    addDataStream(marketname, symbol, ds, traderctrl) {
        ds.trader2 = this;

        ds.marketname = marketname;
        ds.symbol = symbol;

        ds.dsindex = this.lstDataStream.length;

        this.lstDataStream.push(ds);

        if (this.strategy2) {
            let market2 = new Market2(ds.marketname, ds.symbol, ds, traderctrl);
            this.strategy2.addMarket2(market2);
        }
    }

    setStrategy2(strategy2) {
        this.strategy2 = strategy2;
    }

    onDepth(ds) {
        if (this.strategy2) {
            this.strategy2.onDepth(ds.dsindex);
        }
    }

    onDeals(ds, newnums) {
        if (this.strategy2) {
            this.strategy2.onDeals(ds.dsindex, newnums);
        }
    }

    onOrder(ds, order) {
        if (this.strategy2) {
            this.strategy2.onOrder(ds.dsindex, order);
        }
    }

    onTrade(ds, trade) {
        if (this.strategy2) {
            this.strategy2.onTrade(ds.dsindex, trade);
        }
    }

    start() {
        for (let i = 0; i < this.lstDataStream.length; ++i) {
            let ds = this.lstDataStream[i];
            ds.init();
        }
    }
};

exports.Trader2 = Trader2;