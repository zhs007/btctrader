"use strict";

const { DEPTHINDEX, DEALSINDEX, DEALTYPE, TRADETYPE } = require('./basedef');
const BTCTraderMgr = require('./btctradermgr');

const TRADESTATE_OPEN   = 0;
const TRADESTATE_DEAL   = 1;
const TRADESTATE_CLOSE  = 2;
const TRADESTATE_FAIL   = 3;

class Trade {
    constructor(tid, parent) {
        this.tid = tid;

        this.tsms = new Date().getTime();
        this.cp = 0;
        this.cv = 0;

        this.bp = 0;
        this.bv = 0;

        this.p = 0;
        this.v = 0;
        this.type = TRADETYPE.NORMAL;

        this.state = TRADESTATE_OPEN;

        this.childDeal = undefined;
        this.childClose = undefined;

        this.data = undefined;

        this.parent = parent;
    }

    buy(cp, cv, p, v, tsms) {
        this.cp = cp;
        this.cv = cv;

        this.tsms = tsms;
        this.bp = p;
        this.bv = v;
        this.p = p;
        this.v = v;
        this.type = TRADETYPE.BUY;
    }

    sell(cp, cv, p, v, tsms) {
        this.cp = cp;
        this.cv = cv;

        this.tsms = tsms;
        this.bp = p;
        this.bv = v;
        this.p = p;
        this.v = v;
        this.type = TRADETYPE.SELL;
    }

    cancel() {
        this.v = 0;

        if (this.state == TRADESTATE_OPEN) {
            this.state = TRADESTATE_FAIL;
        }
    }

    onDeal(newtid, p, v, tsms) {
        if (this.v <= 0) {
            return [undefined, 0];
        }

        if (v > this.v) {
            v = this.v;
        }

        if (this.childDeal == undefined) {
            this.childDeal = new Trade(newtid, this);
            this.childDeal.tsms = tsms;

            this.childDeal.v = v;
            this.childDeal.p = p;

            this.v -= v;

            this.state = TRADESTATE_DEAL;

            return [this.childDeal, v];
        }

        let tv = this.childDeal.v + v;
        let ap = this.childDeal.p * this.childDeal.v / tv + p * v / tv;

        this.childDeal.v = tv;
        this.childDeal.p = ap;

        this.v -= v;

        return [undefined, v];
    }

    // onDealClose(newtid, p, v, tsms) {
    //     if (this.v <= 0) {
    //         return [undefined, 0];
    //     }
    //
    //     if (v > this.v) {
    //         v = this.v;
    //     }
    //
    //     if (this.childDeal == undefined) {
    //         this.childDeal = new Trade(newtid, this);
    //         this.childDeal.tsms = tsms;
    //
    //         this.childDeal.v = v;
    //         this.childDeal.p = p;
    //
    //         this.v -= v;
    //
    //         this.state = TRADESTATE_DEAL;
    //
    //         return [this.childDeal, v];
    //     }
    //
    //     let tv = this.childDeal.v + v;
    //     let ap = this.childDeal.p * this.childDeal.v / tv + p * v / tv;
    //
    //     this.childDeal.v = tv;
    //     this.childDeal.p = ap;
    //
    //     this.v -= v;
    //
    //     return [undefined, v];
    // }

    close(newtid, cp, cv, p, v, tsms) {
        if (this.childClose == undefined) {
            this.childClose = new Trade(newtid, this);
            this.childClose.tsms = tsms;

            this.childClose.bv = v;
            this.childClose.bp = p;
            this.childClose.v = v;
            this.childClose.p = p;

            this.childClose.type = (this.type == TRADETYPE.BUY ? TRADETYPE.SELL : TRADETYPE.BUY);

            return this.childClose;
        }

        return undefined;
    }
};

class Market {
    constructor(marketindex, name, p, v, m, ds) {
        this.marketindex = marketindex;
        this.name = name;

        this.lstTrade = [];

        this.volume = v;
        this.price = p;
        this.money = m;

        this.bv = v;
        this.bp = p;
        this.bm = m;

        this.ds = ds;

        this.ds.market = this;

        this.feeBuy = 0;
        this.feeSell = 0;

        this.lstUnsold = [];
        this.lstOpen = [];
        this.lstClose = [];
    }

    setMoney(m) {
        this.money = m;
    }

    buy(cp, cv, p, v, ts) {
        // if (this.money <= 0) {
        //     return false;
        // }
        //
        // let cm = p * v;
        // if (cm > this.money) {
        //     v = this.money / p;
        // }
        //
        // cm = p * v;

        let ct = new Trade(this.lstTrade.length);
        ct.buy(cp, cv, p, v, ts);
        this.lstTrade.push(ct);
        this.lstUnsold.push(ct);

        // let lastv = this.volume;
        // this.volume += v;
        // this.price = (lastv * this.price + cm) / this.volume;

        // this.money -= cm;

        // BTCTraderMgr.singleton.insertTrade(TRADETYPE_BUY, p, v, this.price, this.volume, this.money, this.bp, this.bv, this.bm);

        return ct;
    }

    sell(cp, cv, p, v, ts) {
        // if (this.volume <= 0) {
        //     return false;
        // }
        //
        // if (v > this.volume) {
        //     v = this.volume;
        // }

        // let cm = p * v;
        let ct = new Trade(this.lstTrade.length);
        ct.sell(cp, cv, p, v, ts);
        this.lstTrade.push(ct);
        this.lstUnsold.push(ct);

        // this.volume -= v;
        // this.money += cm;

        // BTCTraderMgr.singleton.insertTrade(TRADETYPE_SELL, p, v, this.price, this.volume, this.money, this.bp, this.bv, this.bm);

        return ct;
    }

    closeTrade(trade, cp, cv, p, v, ts) {
        let ct = trade.close(this.lstTrade.length, cp, cv, p, v, ts);
    }

    foreachUnsoldTrade(strategy) {
        for (let i = 0; i < this.lstUnsold.length; ++i) {
            let cn = this.lstTrade[i];

            strategy.onUnsoldTrade(cn);
        }
    }

    foreachOpenTrade(strategy) {
        for (let i = 0; i < this.lstOpen.length; ++i) {
            let cn = this.lstOpen[i];

            strategy.onOpenTrade(cn);
        }
    }

    _onSimDeal(deal, timeoff) {
        let lv = deal[DEALSINDEX.VOLUME];
        for (let i = 0; i < this.lstUnsold.length; ++i) {
            let cn = this.lstUnsold[i];
            if (cn.type == TRADETYPE.BUY) {
                if (deal[DEALSINDEX.PRICE] <= cn.bp && deal[DEALSINDEX.TMS] >= cn.tsms + timeoff) {
                    let [dt, cv] = cn.onDeal(this.lstTrade.length, deal[DEALSINDEX.PRICE], lv, deal[DEALSINDEX.TMS]);
                    if (dt != undefined) {
                        this.lstTrade.push(dt);
                        this.lstOpen.push(cn);
                    }

                    if (this.ds.strategy) {
                        this.ds.strategy.onTradeChg(this.marketindex, cn);
                    }

                    if (cn.v <= 0) {
                        this.lstUnsold.splice(i, 1);
                        --i;
                    }

                    lv -= cv;

                    if (lv <= 0) {
                        return ;
                    }
                }
            }
            else if (cn.type == TRADETYPE.SELL) {
                if (deal[DEALSINDEX.PRICE] >= cn.bp && deal[DEALSINDEX.TMS] >= cn.tsms + timeoff) {
                    let [dt, cv] = cn.onDeal(this.lstTrade.length, deal[DEALSINDEX.PRICE], lv, deal[DEALSINDEX.TMS]);
                    if (dt != undefined) {
                        this.lstTrade.push(dt);
                        this.lstOpen.push(cn);
                    }

                    if (this.ds.strategy) {
                        this.ds.strategy.onTradeChg(this.marketindex, cn);
                    }

                    if (cn.v <= 0) {
                        this.lstUnsold.splice(i, 1);
                        --i;
                    }

                    lv -= cv;

                    if (lv <= 0) {
                        return ;
                    }
                }
            }
        }

        for (let i = 0; i < this.lstOpen.length; ++i) {
            let cn = this.lstOpen[i].childClose;
            if (cn == undefined) {
                continue ;
            }

            if (cn.type == TRADETYPE.BUY) {
                if (deal[DEALSINDEX.PRICE] <= cn.bp && deal[DEALSINDEX.TMS] >= cn.tsms + timeoff) {
                    let [dt, cv] = cn.onDeal(this.lstTrade.length, deal[DEALSINDEX.PRICE], lv, deal[DEALSINDEX.TMS]);
                    if (dt != undefined) {
                        this.lstTrade.push(dt);
                    }

                    if (this.ds.strategy) {
                        this.ds.strategy.onTradeChg(this.marketindex, cn);
                    }

                    if (cn.v <= 0) {
                        this.lstOpen.splice(i, 1);
                        this.lstClose.push(cn);
                        --i;
                    }

                    lv -= cv;

                    if (lv <= 0) {
                        return ;
                    }
                }
            }
            else if (cn.type == TRADETYPE.SELL) {
                if (deal[DEALSINDEX.PRICE] >= cn.bp && deal[DEALSINDEX.TMS] >= cn.tsms + timeoff) {
                    let [dt, cv] = cn.onDeal(this.lstTrade.length, deal[DEALSINDEX.PRICE], lv, deal[DEALSINDEX.TMS]);
                    if (dt != undefined) {
                        this.lstTrade.push(dt);
                    }

                    if (this.ds.strategy) {
                        this.ds.strategy.onTradeChg(this.marketindex, cn);
                    }

                    if (cn.v <= 0) {
                        this.lstOpen.splice(i, 1);
                        this.lstClose.push(cn);
                        --i;
                    }

                    lv -= cv;

                    if (lv <= 0) {
                        return ;
                    }
                }
            }
        }
    }

    onMarketSimDeals(newnums, timeoff) {
        for (let i = 0; i < newnums; ++i) {
            let deal = this.ds.deals[this.ds.deals.length - newnums + i];
            this._onSimDeal(deal, timeoff);
        }
    }
};

class Trader {
    constructor() {
        this.strategy = undefined;
        this.lstMarket = [];
    }

    addMarket(name, p, v, m, ds) {
        let cm = new Market(this.lstMarket.length, name, p, v, m, ds);
        if (this.strategy != undefined) {
            ds.strategy = this.strategy;
        }

        this.lstMarket.push(cm);
    }

    setStrategy(strategy) {
        this.strategy = strategy;
        this.strategy.trader = this;

        for (let i = 0; i < this.lstMarket.length; ++i) {
            this.lstMarket.ds.strategy = strategy;
        }
    }

    buy(marketindex, p, v, ts) {
        return this.lstMarket[marketindex].buy(p, v, ts);
    }

    sell(marketindex, p, v, ts) {
        return this.lstMarket[marketindex].sell(p, v, ts);
    }

    buyDepthArr(marketindex, arr, ts) {
        for (let i = 0; i < arr.length; ++i) {
            this.buy(marketindex, arr[i][DEPTHINDEX.PRICE], arr[i][DEPTHINDEX.VOLUME], ts);
        }
    }

    sellDepthArr(marketindex, arr, ts) {
        for (let i = 0; i < arr.length; ++i) {
            this.sell(marketindex, arr[i][DEPTHINDEX.PRICE], arr[i][DEPTHINDEX.VOLUME], ts);
        }
    }

    hasAllDepth() {
        for (let i = 0; i < this.lstMarket.length; ++i) {
            if (!this.lstMarket[i].ds.hasDepth()) {
                return false;
            }
        }

        return true;
    }

    init() {
        for (let i = 0; i < this.lstMarket.length; ++i) {
            this.lstMarket[i].ds.init();
        }
    }
};

exports.Trade = Trade;
exports.Market = Market;
exports.Trader = Trader;