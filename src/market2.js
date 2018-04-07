"use strict";

const { ORDERSIDE, ORDERTYPE, ORDERSTATE } = require('./basedef');

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

    newLimitOrder() {

    }

    newMarketOrder() {

    }


};

exports.Market2 = Market2;