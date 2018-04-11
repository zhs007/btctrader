"use strict";

const OrderMgr = require('./ordermgr');
const TradeMgr = require('./trademgr');

class Trader2Mgr {
    constructor() {
        this.isSimMode = false;
    }

    async init(mysqlcfg, ordername, tradename, isSimMode) {
        this.isSimMode = isSimMode;

        await OrderMgr.singleton.init(mysqlcfg, ordername);
        await TradeMgr.singleton.init(mysqlcfg, tradename);
    }
};

exports.singleton = new Trader2Mgr();