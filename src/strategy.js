"use strict";

const BTCTraderMgr = require('../src/btctradermgr');
const process = require('process');

class Strategy {
    constructor() {
        this.trader = undefined;
        this.simid = 0;
        this.save2db = false;

        this.timerTick = undefined;
    }

    start(ticktimems) {
        if (this.timerTick) {
            this.stop();
        }

        this.timerTick = setInterval(() => {
            this.onTick();
        }, ticktimems);

        this.trader.init();
    }

    stop() {
        if (this.timerTick) {
            clearInterval(this.timerTick);

            this.timerTick = undefined;
        }
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

        return trade;
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

        return trade;
    }

    close(market, trade, cp, cv, p, v, tsms) {
        let ct = market.close(trade, cp, cv, p, v, tsms);

        return ct;
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
            if (trade.parent != undefined) {
                BTCTraderMgr.singleton.updTrade(this.simid, trade.parent);
            }
            else {
                BTCTraderMgr.singleton.updTrade(this.simid, trade);
            }
        }
    }

    onTick() {

    }
};

exports.Strategy = Strategy;