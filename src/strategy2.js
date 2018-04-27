"use strict";

const OrderMgr = require('./ordermgr');

class Strategy2 {
    constructor(name, params) {
        this.name = name;
        this.params = params;
        this.lstMarket2 = [];
    }

    addMarket2(market2) {
        this.lstMarket2.push(market2);
    }

    onDepth(dsindex) {

    }

    onDeals(dsindex, newnums) {
        OrderMgr.singleton._onDeals_OrderMgr(this.lstMarket2[dsindex], newnums);
    }

    onOrder(dsindex, order) {
    }

    onTrade(dsindex, trade) {
    }
};

exports.Strategy2 = Strategy2;