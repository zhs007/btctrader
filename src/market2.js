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
        let order = OrderMgr.singleton.newLimitOrder(this.marketname, side, this.symbol, price, volume);
        if (this.traderctrl) {
            this.traderctrl.newLimitOrder(order, callback);
        }
        else {
            if (callback) {
                callback();
            }
        }
    }

    newMarketOrder(side, volume, callback) {
        let order = OrderMgr.singleton.newLimitOrder(this.marketname, side, this.symbol, price, volume);
        if (this.traderctrl) {
            this.traderctrl.newLimitOrder(order, callback);
        }
        else {
            if (callback) {
                callback();
            }
        }
    }

    newMakeMarketOrder(price0, price1, volume, callback) {
        if (price0 > price1) {
            let tp = price0;
            price0 = price1;
            price1 = tp;
        }

        let lst = OrderMgr.singleton.newMakeMarketOrder(this.marketname, ORDERSIDE.BUY, this.symbol, price0, price1, volume);
        if (this.traderctrl) {
            this.traderctrl.newMakeMarketOrder(lst, callback);
        }
        else {
            if (callback) {
                callback();
            }
        }

        return lst;
    }

    newStopProfitAndLossOrder(side, stopProfit, stopLoss, volume, callback) {
        let po = OrderMgr.singleton.newStopProfitAndLossOrder(this.marketname, side, this.symbol, stopProfit, stopLoss, volume);
        if (this.traderctrl) {
            this.traderctrl.newStopProfitAndLossOrder(po, callback);
        }
        else {
            if (callback) {
                callback();
            }
        }
    }
};

exports.Market2 = Market2;