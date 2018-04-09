"use strict";

const { Trader2 } = require('trader2');
const OrderMgr = require('ordermgr');

class SimTrader2 extends Trader2 {
    constructor(typename, ver, instanceid) {
        super(typename, ver, instanceid);

        this.typename = typename;
        this.ver = ver;
        this.instanceid = 0;

        this.lstDataStream = [];
        this.strategy2 = undefined;
    }

    onDeals(ds, newnums) {
        super.onDeals(ds, newnums);
    }
};

exports.SimTrader2 = SimTrader2;