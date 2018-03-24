"use strict";

const util = require('util');
const { Strategy } = require('../strategy');
// const { DEPTHINDEX, DEALSINDEX, DEALTYPE } = require('../datastream');
const { DEPTHINDEX, DEALSINDEX, DEALTYPE, STRATEGYSTATE } = require('../basedef');
const { countPriceWithDepth_asks_depth2, countPriceWithDepth_bids_depth2 } = require('../util');

class Strategy_MarketLink extends Strategy {
    constructor() {
        super();

        this.amountDepthTime = 1 * 60 * 1000;
        this.amountDepth = 0;

        this.linkPriceOffPer = -1;
        this.linkVolume = 0;

        this.minofftime = 5 * 1000;

        this.lstTimeOffNode = [];

        this.curHigh = [0, 0];
        this.curLow = [0, 0];

        this.lstBuy = [];
        this.lstSell = [];

        this.lstDealBuy = [];
        this.lstDealSell = [];
    }

    _newTradeData(dp) {
        return {
            dp: dp
        };
    }

    // 这里有点复杂
    // 算法上是按小区间统计，但有可能发生这个小区间内，某一个完全没有成交记录的情况，这时会用上一个区间内的最后一笔交易
    // 只要有一笔交易产生，上一次的就不重复计算
    _newTimeOffNode(btms) {
        return {
            btms: btms,
            p: [0, 0],
            v: [0, 0],
            h: [0, 0],
            l: [0, 0],

            lp: [0, 0],
            lv: [0, 0],
            ltms: [0, 0],
        };
    }

    _getCurTimeOffNode(tms) {
        if (this.lstTimeOffNode.length <= 0) {
            let cn = this._newTimeOffNode(tms);
            this.lstTimeOffNode.push(cn);
            return cn;
        }

        let ln = this.lstTimeOffNode[this.lstTimeOffNode.length - 1];
        if (tms - ln.btms > this.minofftime) {

            this._countNewOff(tms);

            let cn = this._newTimeOffNode(tms);
            this.lstTimeOffNode.push(cn);

            cn.p[0] = ln.lp[0];
            cn.p[1] = ln.lp[1];
            cn.v[0] = ln.lv[0];
            cn.v[1] = ln.lv[1];

            cn.h[0] = ln.lp[0];
            cn.h[1] = ln.lp[1];
            cn.l[0] = ln.lp[0];
            cn.l[1] = ln.lp[1];

            cn.lp[0] = ln.lp[0];
            cn.lp[1] = ln.lp[1];
            cn.lv[0] = ln.lv[0];
            cn.lv[1] = ln.lv[1];
            cn.ltms[0] = ln.btms;
            cn.ltms[1] = ln.btms;

            return cn;
        }

        return ln;
    }

    _add2TimeOffNode(cn, mi, p, v) {
        if (cn.ltms[mi] != cn.btms) {
            cn.p[mi] = 0;
            cn.h[mi] = 0;
            cn.l[mi] = 0;
            cn.v[mi] = 0;
            cn.ltms[mi] = cn.btms;
        }

        if (cn.h[mi] < p) {
            cn.h[mi] = p;
        }

        if (cn.l[mi] > p) {
            cn.l[mi] = p;
        }

        cn.lp[mi] = p;
        cn.lv[mi] = v;

        let tv = cn.v[mi] + v;
        let ap = cn.p[mi] * cn.v[mi] / tv + p * v / tv;
        cn.p[mi] = ap;
        cn.v[mi] = tv;
    }

    _countNewOff(tms) {
        let p = [0, 0];
        let v = [0, 0];
        let h = [0, 0];
        let l = [0, 0];

        for (let i = 0; i < this.lstTimeOffNode.length; ++i) {
            let cn = this.lstTimeOffNode[this.lstTimeOffNode.length - i - 1];

            if (tms - cn.btms <= this.amountDepthTime) {
                for (let j = 0; j < 2; ++j) {
                    let tv = v[j] + cn.v[j];
                    let ap = cn.p[j] * cn.v[j] / tv + p[j] * v[j] / tv;
                    v[j] = tv;
                    p[j] = ap;

                    if (h[j] == 0) {
                        h[j] = cn.p[j];
                    }

                    if (h[j] < cn.p[j]) {
                        h[j] = cn.p[j];
                    }

                    if (l[j] == 0) {
                        l[j] = cn.p[j];
                    }

                    if (l[j] > cn.p[j]) {
                        l[j] = cn.p[j];
                    }
                }
            }
            else {
                this.linkPriceOffPer = (p[1] - p[0]) / p[0];
                this.linkVolume = v[0];

                this.curHigh = h;
                this.curLow = l;

                break;
            }
        }
    }

    _buy(cp, cv, p, v, destp, tsms) {
        this.chgState(1, STRATEGYSTATE.LONG);

        let ct = this.buy(1, cp, cv, p, v, tsms);
        if (ct == undefined) {
            return undefined;
        }

        ct.data = this._newTradeData(destp);
        return ct;
        // if (this.lstBuy.length == 0) {
        //     // this.buyPrice = p;
        //     // this.buyDestPrice = destp;
        //
        //     let ct = this.buy(this.trader.lstMarket[1], cp, cv, p, v, tsms);
        //     ct.data = this._newTradeData(destp);
        //     this._insertBuy(ct);
        // }
        // else {
        //     if (p <= this.lstBuy[0].bp) {
        //         return ;
        //     }
        //
        //     if (p > this.lstBuy[0].bp * (1 - 0.002)) {
        //         // this.buyPrice = p;
        //
        //         let ct = this.buy(this.trader.lstMarket[1], cp, cv, p, v, tsms);
        //         ct.data = this._newTradeData(destp);
        //         this._insertBuy(ct);
        //     }
        // }
    }

    _sell(cp, cv, p, v, destp, tsms) {
        this.chgState(1, STRATEGYSTATE.SHORT);

        let ct = this.sell(1, cp, cv, p, v, tsms);
        if (ct == undefined) {
            return undefined;
        }

        ct.data = this._newTradeData(destp);
        return ct;
        // if (this.lstSell.length == 0) {
        //     // this.sellPrice = p;
        //     // this.sellDestPrice = destp;
        //
        //     let ct = this.sell(this.trader.lstMarket[1], cp, cv, p, v, tsms);
        //     ct.data = this._newTradeData(destp);
        //     this._insertSell(ct);
        // }
        // else {
        //     if (p >= this.lstSell[0].bp) {
        //         return ;
        //     }
        //
        //     if (p < this.lstSell[0].bp * (1 - 0.002)) {
        //         // this.sellPrice = p;
        //
        //         let ct = this.sell(this.trader.lstMarket[1], cp, cv, p, v, tsms);
        //         ct.data = this._newTradeData(destp);
        //         this._insertSell(ct);
        //     }
        // }
    }

    // _close(trade, cp, cv, p, v, tsms) {
    //     this.close(this.trader.lstMarket[1], trade, cp, cv, p, v, tsms);
    // }

    // _insertBuy(trade) {
    //     this.lstBuy.push(trade);
    //
    //     this.lstBuy.sort((a, b) => {
    //         return b.bp - a.bp;
    //     });
    // }
    //
    // _insertSell(trade) {
    //     this.lstSell.push(trade);
    //
    //     this.lstSell.sort((a, b) => {
    //         return a.bp - b.bp;
    //     });
    // }
    //
    // _removeBuy(trade) {
    //     for (let i = 0; i < this.lstBuy.length; ++i) {
    //         if (this.lstBuy[i].tid == trade.tid) {
    //             this.lstBuy.splice(i, 1);
    //
    //             return true;
    //         }
    //     }
    //
    //     return false;
    // }
    //
    // _removeSell(trade) {
    //     for (let i = 0; i < this.lstSell.length; ++i) {
    //         if (this.lstSell[i].tid == trade.tid) {
    //             this.lstSell.splice(i, 1);
    //
    //             return true;
    //         }
    //     }
    //
    //     return false;
    // }
    //
    // _insertDealBuy(trade) {
    //     this.lstDealBuy.push(trade);
    //
    //     this.lstDealBuy.sort((a, b) => {
    //         return b.bp - a.bp;
    //     });
    // }
    //
    // _insertDealSell(trade) {
    //     this.lstDealSell.push(trade);
    //
    //     this.lstDealSell.sort((a, b) => {
    //         return a.bp - b.bp;
    //     });
    // }
    //
    // _removeDealBuy(trade) {
    //     for (let i = 0; i < this.lstDealBuy.length; ++i) {
    //         if (this.lstDealBuy[i].tid == trade.tid) {
    //             this.lstDealBuy.splice(i, 1);
    //
    //             return true;
    //         }
    //     }
    //
    //     return false;
    // }
    //
    // _removeDealSell(trade) {
    //     for (let i = 0; i < this.lstDealSell.length; ++i) {
    //         if (this.lstDealSell[i].tid == trade.tid) {
    //             this.lstDealSell.splice(i, 1);
    //
    //             return true;
    //         }
    //     }
    //
    //     return false;
    // }

    onDepth(market) {

    }

    onDeals(market) {

    }

    onSimDeals(market, newnums) {
        let curdeal = market.ds.deals[market.ds.deals.length - 1];
        let cn = this._getCurTimeOffNode(curdeal[DEALSINDEX.TMS]);
        this._add2TimeOffNode(cn, market.marketindex, parseFloat(curdeal[DEALSINDEX.PRICE]), parseFloat(curdeal[DEALSINDEX.VOLUME]));

        if (this.lstTimeOffNode.length > this.amountDepthTime / this.minofftime && this.linkPriceOffPer > 0) {
            let deal = [this.trader.lstMarket[0].ds.deals[this.trader.lstMarket[0].ds.deals.length - 1], this.trader.lstMarket[1].ds.deals[this.trader.lstMarket[1].ds.deals.length - 1]];
            let p = [parseFloat(deal[0][DEALSINDEX.PRICE]), parseFloat(deal[1][DEALSINDEX.PRICE])];
            let per = (p[1] - p[0]) / p[0];
            if (per > this.linkPriceOffPer + 0.004) {
                console.log(util.format('sell %f %f %j %j', per, this.linkPriceOffPer, this.curHigh, this.curLow));

                // let ct = this._sell(deal[1][DEALSINDEX.PRICE], deal[1][DEALSINDEX.VOLUME], deal[1][DEALSINDEX.PRICE], 0.1, p[0] + p[0] * this.linkPriceOffPer, curdeal[DEALSINDEX.TMS]);
                let ct = this._sell(deal[1][DEALSINDEX.PRICE], deal[1][DEALSINDEX.VOLUME], deal[1][DEALSINDEX.PRICE], 0.1, p[1] * 0.998, curdeal[DEALSINDEX.TMS]);
                if (ct == undefined) {
                    console.log('cancel sell.');
                }
            }
            else if (per < this.linkPriceOffPer - 0.004) {
                console.log(util.format('buy %f %f %j %j', per, this.linkPriceOffPer, this.curHigh, this.curLow));

                // let ct = this._buy(deal[1][DEALSINDEX.PRICE], deal[1][DEALSINDEX.VOLUME], deal[1][DEALSINDEX.PRICE], 0.1, p[0] + p[0] * this.linkPriceOffPer, curdeal[DEALSINDEX.TMS]);
                let ct = this._buy(deal[1][DEALSINDEX.PRICE], deal[1][DEALSINDEX.VOLUME], deal[1][DEALSINDEX.PRICE], 0.1, p[1] * 1.002, curdeal[DEALSINDEX.TMS]);
                if (ct == undefined) {
                    console.log('cancel buy.');
                }
            }
        }

        this._onTick();

        if (market.marketindex == 1) {
            this.statistics.onDealPrice(curdeal[DEALSINDEX.PRICE]);
        }
    }

    // onTradeChg(marketindex, trade) {
    //     super.onTradeChg(trade);
    //
    //     if (trade.v <= 0) {
    //         if (trade.parent == undefined) {
    //             if (this._removeBuy(trade)) {
    //                 this._insertDealBuy(trade);
    //
    //                 return ;
    //             }
    //
    //             if (this._removeSell(trade)) {
    //                 this._insertDealSell(trade);
    //
    //                 return ;
    //             }
    //         }
    //         else {
    //             if (this._removeDealBuy(trade)) {
    //
    //                 return ;
    //             }
    //
    //             if (this._removeDealSell(trade)) {
    //
    //                 return ;
    //             }
    //         }
    //     }
    // }

    _onTick() {
        let curmi = this.lstMarketInfo[1];
        let curdeal = curmi.market.ds.deals[curmi.market.ds.deals.length - 1];
        curmi.foreachDealTrade((cn) => {
            if (cn.childClose == undefined && (cn.data.dp <= curdeal[DEALSINDEX.PRICE] || cn.tsms <= curdeal[DEALSINDEX.TMS] + 3 * 60 * 1000)) {
                // this.closeTrade(1, cn, curdeal[DEALSINDEX.PRICE], curdeal[DEALSINDEX.VOLUME], cn.data.dp, cn.bv, curdeal[DEALSINDEX.TMS]);
                this.closeTrade(1, cn, curdeal[DEALSINDEX.PRICE], curdeal[DEALSINDEX.VOLUME], -1, curdeal[DEALSINDEX.TMS]);
            }

            return false;
        }, (cn) => {
            if (cn.childClose == undefined && (cn.data.dp >= curdeal[DEALSINDEX.PRICE] || cn.tsms <= curdeal[DEALSINDEX.TMS] + 3 * 60 * 1000)) {
                // this.closeTrade(1, cn, curdeal[DEALSINDEX.PRICE], curdeal[DEALSINDEX.VOLUME], cn.data.dp, cn.bv, curdeal[DEALSINDEX.TMS]);
                this.closeTrade(1, cn, curdeal[DEALSINDEX.PRICE], curdeal[DEALSINDEX.VOLUME], -1, curdeal[DEALSINDEX.TMS]);
            }

            return false;
        });

        // let curdeal = this.trader.lstMarket[1].ds.deals[this.trader.lstMarket[1].ds.deals.length - 1];
        // for (let i = 0; i < this.lstDealBuy.length; ++i) {
        //     let cn = this.lstDealBuy[i];
        //
        //     if (cn.data.dp <= curdeal[DEALSINDEX.PRICE]) {
        //         this.closeTrade(1, cn, curdeal[DEALSINDEX.PRICE], curdeal[DEALSINDEX.VOLUME], cn.data.dp, cn.bv, curdeal[DEALSINDEX.TMS]);
        //     }
        // }
        //
        // for (let i = 0; i < this.lstDealSell.length; ++i) {
        //     let cn = this.lstDealSell[i];
        //
        //     if (cn.data.dp >= curdeal[DEALSINDEX.PRICE]) {
        //         this.closeTrade(1, cn, curdeal[DEALSINDEX.PRICE], curdeal[DEALSINDEX.VOLUME], cn.data.dp, cn.bv, curdeal[DEALSINDEX.TMS]);
        //     }
        // }
    }
};

exports.Strategy_MarketLink = Strategy_MarketLink;