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

        this.ctrlTrader = undefined;
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

    // cancelTrade(trade, cp, cv, tsms) {
    //     if (trade.childDeal != undefined) {
    //         this.market.closeTrade(trade, cp, cv, -1, tsms);
    //     }
    //
    //     if (trade.v > 0) {
    //         this.market.cancelTrade(trade);
    //     }
    // }

    onTradeChg(trade) {
        if (trade.v <= 0) {
            if (trade.parent == undefined) {
                if (this.lstBuy.remove(trade)) {
                    if (trade.childDeal != undefined) {
                        this.lstDealBuy.insert(trade);
                    }

                    return true;
                }

                if (this.lstSell.remove(trade)) {
                    if (trade.childDeal != undefined) {
                        this.lstDealSell.insert(trade);
                    }

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

            this.closeTrade(cn, curdeal[DEALSINDEX.PRICE], curdeal[DEALSINDEX.VOLUME], -1, curdeal[DEALSINDEX.TMS]);
        }
    }

    cancelSell() {
        let curdeal = this.market.ds.deals[this.market.ds.deals.length - 1];
        for (let i = 0; i < this.lstSell.lst.length; ++i) {
            let cn = this.lstSell.lst[i];

            this.closeTrade(cn, curdeal[DEALSINDEX.PRICE], curdeal[DEALSINDEX.VOLUME], -1, curdeal[DEALSINDEX.TMS]);
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

        this.startMoney = 0;
        this.curMoney = 0;
        this.startValue = 0;
        this.curValue = 0;

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
        this.startMoney = 0;
        this.curMoney = 0;
        this.startValue = 0;
        this.curValue = 0;

        this.statistics.onStart();

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
        // let cm = p * v;
        // if (cm > this.curMoney) {
        //     return undefined;
        // }
        //
        // this.curMoney -= cm;

        if (!(tsms >= this.msSimTradeStart && tsms <= this.msSimTradeEnd)) {
            return undefined;
        }

        let curmi = this.lstMarketInfo[mi];
        if (curmi.lstBuy.lst.length > 0) {
            if (tsms <= curmi.lastmsBuy + this.cfg.newdealdelayms) {
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
        this.statistics.onOpen(TRADETYPE.BUY, p, v);

        if (this.save2db) {
            BTCTraderMgr.singleton.insertTrade(this.simid, trade);
        }

        return trade;
    }

    sell(mi, cp, cv, p, v, tsms) {
        // if (v > this.curValue) {
        //     return undefined;
        // }
        //
        // this.curValue -= v;

        if (!(tsms >= this.msSimTradeStart && tsms <= this.msSimTradeEnd)) {
            return undefined;
        }

        let curmi = this.lstMarketInfo[mi];
        if (curmi.lstSell.lst.length > 0) {
            if (tsms <= curmi.lastmsSell + this.cfg.newdealdelayms) {
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
        this.statistics.onOpen(TRADETYPE.SELL, p, v);

        if (this.save2db) {
            BTCTraderMgr.singleton.insertTrade(this.simid, trade);
        }

        return trade;
    }

    closeTrade(mi, trade, cp, cv, p, tsms) {
        let ct = this.lstMarketInfo[mi].closeTrade(trade, cp, cv, p, tsms);
        if (ct != undefined) {
            this.statistics.onClose(trade.type, ct.bp, ct.bv);
        }

        return ct;
    }

    // cancelTrade(mi, trade, cp, cv, tsms) {
    //     if (trade.v > 0) {
    //         this.statistics.onCancel(trade.bp, trade.v);
    //     }
    //
    //     this.lstMarketInfo[mi].cancelTrade(trade, cp, cv, tsms);
    // }

    onDepth(market) {

    }

    onDeals(market, newnums) {

    }

    onOrder(market) {

    }

    onSimDepth(market) {

    }

    onSimDeals(market, newnums) {

    }

    onSimOrder(market) {

    }

    onUnsoldTrade(trade) {

    }

    onOpenTrade(trade) {

    }

    onTradeClose(mi, trade, dp, dv) {
        // if (trade.type == TRADETYPE.BUY) {
        //     this.curValue -= dv;
        // }
        // else {
        //     this.curMoney -= dp * dv;
        // }
    }

    onTradeDeal(mi, trade, dp, dv) {
        if (trade.type == TRADETYPE.BUY) {
            this.curValue += dv;
            this.curMoney -= dp * dv;
        }
        else {
            this.curMoney += dp * dv;
            this.curValue -= dv;
        }

        if (trade.parent != undefined) {
            this.statistics.onDealClose(trade.parent.type, dp, dv);

            if (trade.v <= 0) {
                this.statistics.onCloseEnd(trade.parent.type, trade.parent.childDeal.p, trade.childDeal.p);
            }
        }
        else {
            this.statistics.onDealOpen(trade.type, dp, dv);
        }
    }

    onTradeCancel(mi, trade, bp, bv) {
        // if (trade.type == TRADETYPE.BUY) {
        //     this.curMoney += bp * bv;
        // }
        // else {
        //     this.curValue += bv;
        // }
    }

    onTradeChg(mi, trade) {
        // if (trade.childDeal != undefined) {
        //     if (trade.v <= 0) {
        //         if (trade.parent != undefined) {
        //             this.statistics.onCloseEnd(trade.parent.type, trade.parent.childDeal.p, trade.childDeal.p);
        //         }
        //     }
        // }

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