"use strict";

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

    }

    onOrder(dsindex, order) {

    }
};

exports.Strategy2 = Strategy2;