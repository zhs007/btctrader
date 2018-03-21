"use strict";

const BTCTraderMgr = require('../src/btctradermgr');

class Strategy {
    constructor() {
        this.trader = undefined;
        this.simid = 0;
        this.save2db = false;
    }

    buy(market, cp, cv, p, v, tsms) {
        let trade = market.buy(cp, cv, p, v, tsms);

        if (this.save2db) {
            BTCTraderMgr.singleton.insertTrade(this.simid, trade);
        }
    }

    sell(market, cp, cv, p, v, tsms) {
        let trade = market.sell(cp, cv, p, v, tsms);

        if (this.save2db) {
            BTCTraderMgr.singleton.insertTrade(this.simid, trade);
        }
    }

    onDepth(market) {

    }

    onDeals(market, newnums) {

    }

    onSimDepth(market) {

    }

    onSimDeals(market, newnums) {

    }

    onUnsoldTrade(trade) {

    }

    onOpenTrade(trade) {

    }
};

exports.Strategy = Strategy;