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
    }

    // 这里有点复杂
    // 算法上是按小区间统计，但有可能发生这个小区间内，某一个完全没有成交记录的情况，这时会用上一个区间内的最后一笔交易
    // 只要有一笔交易产生，上一次的就不重复计算
    _newTimeOffNode(btms) {
        return {
            btms: btms,
            p: [0, 0],
            v: [0, 0],

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
            cn.v[mi] = 0;
            cn.ltms[mi] = cn.btms;
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
        for (let i = 0; i < this.lstTimeOffNode.length; ++i) {
            let cn = this.lstTimeOffNode[this.lstTimeOffNode.length - i - 1];

            if (tms - cn.btms <= this.amountDepthTime) {
                for (let j = 0; j < 2; ++j) {
                    let tv = v[j] + cn.v[j];
                    let ap = cn.p[j] * cn.v[j] / tv + p[j] * v[j] / tv;
                    v[j] = tv;
                    p[j] = ap;
                }
            }
            else {
                this.linkPriceOffPer = (p[1] - p[0]) / p[0];
                this.linkVolume = v[0];

                break;
            }
        }
    }

    onDepth(market) {

    }

    onDeals(market) {

    }

    // _trade(dsarr, acki, bidi) {
    //     // let arrack = matchmakingAsk_depth2(dsarr[acki].asks, dsarr[bidi].bids);
    //     // this.trader.buyDepthArr(acki, arrack, new Date().getTime());
    //     //
    //     // let arrbid = matchmakingBid_depth2(dsarr[acki].asks, dsarr[bidi].bids);
    //     // this.trader.buyDepthArr(bidi, arrbid, new Date().getTime());
    //     // tradeBid(bidi, arrbid);
    //
    //     // console.log(' market0 ' + trader.lstMarket[0].price + ' ' + trader.lstMarket[0].volume + ' ' + trader.lstMarket[0].money);
    //     // console.log(' market1 ' + trader.lstMarket[1].price + ' ' + trader.lstMarket[1].volume + ' ' + trader.lstMarket[1].money);
    // }

    // onSimDepth(market) {
    //     if (this.trader.hasAllDepth()) {
    //         let off0 = this.trader.lstMarket[0].ds.bids[0][DEPTHINDEX.PRICE] * 107 - this.trader.lstMarket[1].ds.asks[0][DEPTHINDEX.PRICE];
    //         let off1 = this.trader.lstMarket[1].ds.bids[0][DEPTHINDEX.PRICE] - this.trader.lstMarket[0].ds.asks[0][DEPTHINDEX.PRICE] * 107;
    //
    //         // console.log('market0 ' + this.trader.lstMarket[0].ds.asks[0][DEPTHINDEX.PRICE] + ' ' + this.trader.lstMarket[0].ds.bids[0][DEPTHINDEX.PRICE]);
    //         // console.log('market1 ' + this.trader.lstMarket[1].ds.asks[0][DEPTHINDEX.PRICE] + ' ' + this.trader.lstMarket[1].ds.bids[0][DEPTHINDEX.PRICE]);
    //
    //         if (off0 > 0) {
    //             console.log('off0-' + off0 + 'offper-' + off0 / this.trader.lstMarket[0].ds.asks[0][DEPTHINDEX.PRICE] / 107);
    //         }
    //
    //         if (off1 > 0) {
    //             console.log('off1-' + off1 + 'offper-' + off1 / this.trader.lstMarket[1].ds.asks[0][DEPTHINDEX.PRICE]);
    //         }
    //     }
    //
    //     // let askret = countPriceWithDepth_asks_depth2(market.ds.asks, this.amountDepth);
    //     // let bidret = countPriceWithDepth_bids_depth2(market.ds.bids, this.amountDepth);
    //     //
    //     // let off = askret.avg - bidret.avg;
    //     // console.log(util.format('off %d offper', off, off / askret.avg));
    //     //
    //     // if (off / askret.avg > 0.004) {
    //     //     console.log(util.format('amountDepth %d', this.amountDepth));
    //     //
    //     //     console.log(util.format('proc asks %j bids %j', askret, bidret));
    //     // }
    // }

    onSimDeals(market) {
        let curdeal = market.ds.deals[market.ds.deals.length - 1];
        let cn = this._getCurTimeOffNode(curdeal[DEALSINDEX.TMS]);
        this._add2TimeOffNode(cn, market.marketindex, parseFloat(curdeal[DEALSINDEX.PRICE]), parseFloat(curdeal[DEALSINDEX.VOLUME]));

        if (this.lstTimeOffNode.length > this.amountDepthTime / this.minofftime && this.linkPriceOffPer > 0) {
            let deal = [this.trader.lstMarket[0].ds.deals[this.trader.lstMarket[0].ds.deals.length - 1], this.trader.lstMarket[1].ds.deals[this.trader.lstMarket[1].ds.deals.length - 1]];
            let p = [parseFloat(deal[0][DEALSINDEX.PRICE]), parseFloat(deal[1][DEALSINDEX.PRICE])];
            let per = (p[1] - p[0]) / p[0];
            if (per > this.linkPriceOffPer + 0.001) {
                console.log(per);
                // this.trader.lstMarket[1]
            }
        }
    }
};

exports.Strategy_MarketLink = Strategy_MarketLink;