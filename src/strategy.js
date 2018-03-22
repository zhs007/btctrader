"use strict";

const BTCTraderMgr = require('../src/btctradermgr');
const { TRADETYPE } = require('./basedef');
const { TradeSortList } = require('./tradelist');
const process = require('process');

class MarketInfo {
    constructor(market) {
        this.market = market;

        this.lstBuy = new TradeSortList(TRADETYPE.BUY);
        this.lstSell = new TradeSortList(TRADETYPE.SELL);

        this.lstDealBuy = new TradeSortList(TRADETYPE.BUY);
        this.lstDealSell = new TradeSortList(TRADETYPE.SELL);

        this.lastmsBuy = 0;
        this.lastmsSell = 0;
    }

    buy(cp, cv, p, v, tsms) {
        this.lastmsBuy = tsms;

        let trade = this.market.buy(cp, cv, p, v, tsms);
        this.lstBuy.insert(trade);
        return trade;
    }

    sell(cp, cv, p, v, tsms) {
        this.lastmsSell = tsms;

        let trade = this.market.sell(cp, cv, p, v, tsms);
        this.lstSell.insert(trade);
        return trade;
    }

    closeTrade(trade, cp, cv, p, v, tsms) {
        let ct = this.market.closeTrade(trade, cp, cv, p, v, tsms);
        return ct;
    }

    onTradeChg(trade) {
        if (trade.v <= 0) {
            if (trade.parent == undefined) {
                if (this.lstBuy.remove(trade)) {
                    this.lstDealBuy.insert(trade);

                    return true;
                }

                if (this.lstSell.remove(trade)) {
                    this.lstDealSell.insert(trade);

                    return true;
                }
            }
            else {
                if (this.lstDealBuy.remove(trade)) {
                    return true;
                }

                if (this.lstDealSell.remove(trade)) {
                    return true;
                }
            }
        }

        return false;
    }

    foreachDealTrade(funcBuy, funcSell) {
        let curdeal = this.market.ds.deals[this.market.ds.deals.length - 1];
        for (let i = 0; i < this.lstDealBuy.lst.length; ++i) {
            let cn = this.lstDealBuy.lst[i];

            if (funcBuy(cn)) {
                break;
                // this.closeTrade(cn, curdeal[DEALSINDEX.PRICE], curdeal[DEALSINDEX.VOLUME], cn.data.dp, cn.bv, curdeal[DEALSINDEX.TMS]);
            }
        }

        for (let i = 0; i < this.lstDealSell.lst.length; ++i) {
            let cn = this.lstDealSell.lst[i];

            if (funcSell(cn)) {
                break;
                // this.closeTrade(1, cn, curdeal[DEALSINDEX.PRICE], curdeal[DEALSINDEX.VOLUME], cn.data.dp, cn.bv, curdeal[DEALSINDEX.TMS]);
            }
        }
    }
};

class Strategy {
    constructor(cfg) {
        this.cfg = cfg;

        this.trader = undefined;
        this.simid = 0;
        this.save2db = false;

        this.timerTick = undefined;

        this.lstMarketInfo = [];

        this._procConfig();
    }

    _procConfig() {
        if (!this.cfg) {
            this.cfg = {};
        }

        // 模拟状态下，一个交易最少成交间隔
        if (!this.cfg.hasOwnProperty('sim_dealprocdelayms')) {
            this.cfg.sim_newdealdelayms = 200;
        }

        // 新交易间隔
        if (!this.cfg.hasOwnProperty('newdealdelayms')) {
            this.cfg.newdealdelayms = 300;
        }

        // 新交易价差
        if (!this.cfg.hasOwnProperty('newdealpriceoff')) {
            this.cfg.newdealpriceoff = 0.002;
        }
    }

    start(ticktimems) {
        this.lstMarketInfo = [];
        for (let i = 0; i < this.trader.lstMarket.length; ++i) {
            this.lstMarketInfo.push(new MarketInfo(this.trader.lstMarket[i]));
        }

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

    buy(mi, cp, cv, p, v, tsms) {
        let curmi = this.lstMarketInfo[mi];
        if (curmi.lstBuy.lst.length > 0) {
            if (curmi.lastmsBuy <= tsms + this.cfg.newdealdelayms) {
                return undefined;
            }

            if (p <= curmi.lstBuy.lst[0].bp) {
                return undefined;
            }

            if (p <= curmi.lstBuy.lst[0].bp * (1 - this.cfg.newdealpriceoff)) {
                return undefined;
            }
        }

        let trade = this.lstMarketInfo[mi].buy(cp, cv, p, v, tsms);

        if (this.save2db) {
            BTCTraderMgr.singleton.insertTrade(this.simid, trade);
        }

        return trade;
    }

    sell(mi, cp, cv, p, v, tsms) {
        let curmi = this.lstMarketInfo[mi];
        if (curmi.lstSell.lst.length > 0) {
            if (curmi.lastmsSell <= tsms + this.cfg.newdealdelayms) {
                return undefined;
            }

            if (p >= curmi.lstSell.lst[0].bp) {
                return undefined;
            }

            if (p >= curmi.lstSell.lst[0].bp * (1 - this.cfg.newdealpriceoff)) {
                return undefined;
            }
        }

        let trade = this.lstMarketInfo[mi].sell(cp, cv, p, v, tsms);

        if (this.save2db) {
            BTCTraderMgr.singleton.insertTrade(this.simid, trade);
        }

        return trade;
    }

    closeTrade(mi, trade, cp, cv, p, v, tsms) {
        let ct = this.lstMarketInfo[mi].closeTrade(trade, cp, cv, p, v, tsms);
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

    onTradeChg(mi, trade) {
        this.lstMarketInfo[mi].onTradeChg(trade);

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

    onTackProfit(mi, trade) {

    }
};

exports.Strategy = Strategy;