"use strict";

const { ORDERSIDE, ORDERTYPE, ORDERSTATE } = require('./basedef');
const OrderMgr = require('./ordermgr');

class Market2 {
    constructor(marketname, symbol, ds, traderctrl) {
        this.marketname = marketname;
        this.symbol = symbol;
        this.ds = ds;
        this.traderctrl = traderctrl;

        this.mapOrder = {};
        this.lstOpenOrder = [];

        this.lstTrade = [];

        this.volume = 0;
        this.startvolume = 0;

        this.avgprice = 0;

        this.money = 0;
        this.startmoney = 0;
    }

    newLimitOrder(side, price, volume, callback) {
        let order = OrderMgr.singleton.newLimitOrder(side, this.symbol, price, volume);
        if (this.traderctrl) {
            this.traderctrl.newLimitOrder(order, callback);
        }
    }

    newMarketOrder(side, volume) {
        let order = OrderMgr.singleton.newLimitOrder(side, this.symbol, price, volume);
        if (this.traderctrl) {
            this.traderctrl.newLimitOrder(order, callback);
        }
    }

    newMakeMarketOrder(price0, price1, volume, callback) {
        if (price0 > price1) {
            let tp = price0;
            price0 = price1;
            price1 = tp;
        }

        let lst = OrderMgr.singleton.newMakeMarketOrder(ORDERSIDE.BUY, this.symbol, price0, price1, volume);
        if (this.traderctrl) {
            this.traderctrl.newMakeMarketOrder(lst, callback);
        }
    }
};

exports.Market2 = Market2;