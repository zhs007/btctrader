"use strict";

const util = require('util');
const { Strategy } = require('../strategy');
// const { DEPTHINDEX, DEALSINDEX, DEALTYPE } = require('../datastream');
const { DEPTHINDEX, DEALSINDEX, DEALTYPE } = require('../basedef');
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

    onDepth(market) {

    }

    onDeals(market) {

    }

    onSimDeals(market) {
        let curdeal = market.ds.deals[market.ds.deals.length - 1];
        let cn = this._getCurTimeOffNode(curdeal[DEALSINDEX.TMS]);
        this._add2TimeOffNode(cn, market.marketindex, parseFloat(curdeal[DEALSINDEX.PRICE]), parseFloat(curdeal[DEALSINDEX.VOLUME]));

        if (this.lstTimeOffNode.length > this.amountDepthTime / this.minofftime && this.linkPriceOffPer > 0) {
            let deal = [this.trader.lstMarket[0].ds.deals[this.trader.lstMarket[0].ds.deals.length - 1], this.trader.lstMarket[1].ds.deals[this.trader.lstMarket[1].ds.deals.length - 1]];
            let p = [parseFloat(deal[0][DEALSINDEX.PRICE]), parseFloat(deal[1][DEALSINDEX.PRICE])];
            let per = (p[1] - p[0]) / p[0];
            if (per > this.linkPriceOffPer + 0.004) {
                console.log(util.format('sell %f %f %j %j', per, this.linkPriceOffPer, this.curHigh, this.curLow));

                let ct = this.sell(this.trader.lstMarket[1], deal[1][DEALSINDEX.PRICE], deal[1][DEALSINDEX.VOLUME], deal[1][DEALSINDEX.PRICE], 0.1, curdeal[DEALSINDEX.TMS]);
            }
            else if (per < this.linkPriceOffPer - 0.004) {
                console.log(util.format('buy %f %f %j %j', per, this.linkPriceOffPer, this.curHigh, this.curLow));

                let ct = this.buy(this.trader.lstMarket[1], deal[1][DEALSINDEX.PRICE], deal[1][DEALSINDEX.VOLUME], deal[1][DEALSINDEX.PRICE], 0.1, curdeal[DEALSINDEX.TMS]);
            }
        }
    }
};

exports.Strategy_MarketLink = Strategy_MarketLink;