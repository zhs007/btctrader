"use strict";

const BTCTraderMgr = require('../src/btctradermgr');
const { DEALSINDEX, TRADETYPE, STRATEGYSTATE } = require('./basedef');
const { TradeSortList } = require('./tradelist');
const { StrategyStatistics } = require('./statistics');
const process = require('process');

class MarketInfo {
    constructor(strategy, market) {
        this.market = market;
        this.strategy = strategy;

        this.lstBuy = new TradeSortList(TRADETYPE.BUY);
        this.lstSell = new TradeSortList(TRADETYPE.SELL);

        this.lstDealBuy = new TradeSortList(TRADETYPE.BUY);
        this.lstDealSell = new TradeSortList(TRADETYPE.SELL);

        this.lastmsBuy = 0;
        this.lastmsSell = 0;

        this.strategyState = STRATEGYSTATE.NULL;
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

    closeTrade(trade, cp, cv, p, tsms) {
        let ct = this.market.closeTrade(trade, cp, cv, p, tsms);
        return ct;
    }

    cancelTrade(trade, cp, cv, p, tsms) {
        if (trade.childDeal != undefined) {
            this.market.closeTrade(trade, cp, cv, p, tsms);
        }

        if (trade.v > 0) {
            this.market.cancelTrade(trade);
        }
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

    cancelBuy() {
        let curdeal = this.market.ds.deals[this.market.ds.deals.length - 1];
        for (let i = 0; i < this.lstBuy.lst.length; ++i) {
            let cn = this.lstBuy.lst[i];

            this.cancelTrade(cn, curdeal[DEALSINDEX.PRICE], curdeal[DEALSINDEX.VOLUME], curdeal[DEALSINDEX.PRICE], cn.bv, curdeal[DEALSINDEX.TMS]);
        }
    }

    cancelSell() {
        let curdeal = this.market.ds.deals[this.market.ds.deals.length - 1];
        for (let i = 0; i < this.lstSell.lst.length; ++i) {
            let cn = this.lstSell.lst[i];

            this.cancelTrade(cn, curdeal[DEALSINDEX.PRICE], curdeal[DEALSINDEX.VOLUME], curdeal[DEALSINDEX.PRICE], cn.bv, curdeal[DEALSINDEX.TMS]);
        }
    }

    chgState(s) {
        if (this.strategyState != STRATEGYSTATE.NULL && this.strategyState != s) {
            if (this.strategyState == STRATEGYSTATE.LONG) {
                this.cancelBuy();
            }
            else {
                this.cancelSell();
            }
        }

        this.strategyState = s;
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

        this.statistics = new StrategyStatistics();

        this.msSimStart = 0;
        this.msSimEnd = 0;
        this.msSimTradeStart = 0;
        this.msSimTradeEnd = 0;

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

    setSimTime(start, end, tradestart, tradeend) {
        this.msSimStart = start;
        this.msSimEnd = end;
        this.msSimTradeStart = tradestart;
        this.msSimTradeEnd = tradeend;
    }

    isInSim(tsms) {
        return tsms >= this.msSimStart && tsms <= this.msSimTradeEnd;
    }

    chgState(mi, s) {
        this.lstMarketInfo[mi].chgState(s);
    }

    start(ticktimems) {
        this.lstMarketInfo = [];
        for (let i = 0; i < this.trader.lstMarket.length; ++i) {
            this.lstMarketInfo.push(new MarketInfo(this, this.trader.lstMarket[i]));
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
        if (!(tsms >= this.msSimTradeStart && tsms <= this.msSimTradeEnd)) {
            return undefined;
        }

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
        this.statistics.onOpen(p, v);

        if (this.save2db) {
            BTCTraderMgr.singleton.insertTrade(this.simid, trade);
        }

        return trade;
    }

    sell(mi, cp, cv, p, v, tsms) {
        if (!(tsms >= this.msSimTradeStart && tsms <= this.msSimTradeEnd)) {
            return undefined;
        }

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
        this.statistics.onOpen(p, v);

        if (this.save2db) {
            BTCTraderMgr.singleton.insertTrade(this.simid, trade);
        }

        return trade;
    }

    closeTrade(mi, trade, cp, cv, p, tsms) {
        let ct = this.lstMarketInfo[mi].closeTrade(trade, cp, cv, p, tsms);
        return ct;
    }

    cancelTrade(mi, trade, cp, cv, p, v, tsms) {
        if (trade.v > 0) {
            this.statistics.onCancel(trade.bp, trade.v);
        }

        this.lstMarketInfo[mi].cancelTrade(trade, cp, cv, p, v, tsms);
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
        if (trade.childDeal != undefined) {
            if (trade.v <= 0) {
                if (trade.parent != undefined) {
                    this.statistics.onDealClose(trade.parent.type, trade.parent.childDeal.p, trade.childDeal.p, trade.childDeal.v);
                }
                else if (trade.childClose != undefined) {
                    this.statistics.onDealOpen(trade.childDeal.p, trade.childDeal.v);
                }
            }
        }

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