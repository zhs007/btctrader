"use strict";

const BTCTraderMgr = require('../src/btctradermgr');
const process = require('process');

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
            // process.nextTick(async () => {
            //     await BTCTraderMgr.singleton.insertTrade(this.simid, trade);
            //     console.log('BTCTraderMgr.singleton.insertTrade ok.');
            // });
        }
    }

    sell(market, cp, cv, p, v, tsms) {
        let trade = market.sell(cp, cv, p, v, tsms);

        if (this.save2db) {
            BTCTraderMgr.singleton.insertTrade(this.simid, trade);
            // process.nextTick(async () => {
            //     await BTCTraderMgr.singleton.insertTrade(this.simid, trade);
            //     console.log('BTCTraderMgr.singleton.insertTrade ok.');
            // });
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

    onTradeChg(trade) {
        if (this.save2db) {
            BTCTraderMgr.singleton.updTrade(this.simid, trade);
        }
    }
};

exports.Strategy = Strategy;