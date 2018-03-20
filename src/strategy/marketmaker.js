"use strict";

const util = require('util');
const { Strategy } = require('../strategy');
const { DEALSINDEX, DEALTYPE, DEPTHINDEX } = require('../datastream');
const { countPriceWithDepth_asks_depth2, countPriceWithDepth_bids_depth2 } = require('../util');

class Strategy_MarketMaker extends Strategy {
    constructor() {
        super();

        this.amountDepthTime = 60 * 1000;
        this.amountDepth = 0;
    }

    onDepth(market) {

    }

    onDeals(market) {

    }

    _trade(dsarr, acki, bidi) {
        // let arrack = matchmakingAsk_depth2(dsarr[acki].asks, dsarr[bidi].bids);
        // this.trader.buyDepthArr(acki, arrack, new Date().getTime());
        //
        // let arrbid = matchmakingBid_depth2(dsarr[acki].asks, dsarr[bidi].bids);
        // this.trader.buyDepthArr(bidi, arrbid, new Date().getTime());
        // tradeBid(bidi, arrbid);

        // console.log(' market0 ' + trader.lstMarket[0].price + ' ' + trader.lstMarket[0].volume + ' ' + trader.lstMarket[0].money);
        // console.log(' market1 ' + trader.lstMarket[1].price + ' ' + trader.lstMarket[1].volume + ' ' + trader.lstMarket[1].money);
    }

    onSimDepth(market) {
        // let askret = countPriceWithDepth_asks_depth2(market.ds.asks, this.amountDepth);
        // let bidret = countPriceWithDepth_bids_depth2(market.ds.bids, this.amountDepth);
        //
        // let off = askret.avg - bidret.avg;
        // console.log(util.format('off %d offper', off, off / askret.avg));
        //
        // if (off / askret.avg > 0.004) {
        // //     console.log(util.format('totalvolume %j maxprice %j minprice %j', totalvolume, maxprice, minprice));
        //     console.log(util.format('amountDepth %d', this.amountDepth));
        //
        //     console.log(util.format('proc asks %j bids %j', askret, bidret));
        // }

        // if (this.trader.hasAllDepth()) {
        //     let dsarr = [this.trader.lstMarket[0].ds, this.trader.lstMarket[1].ds];
        //
        //     if (dsarr[1].asks[0][0] < dsarr[0].bids[0][0]) {
        //         this._trade(dsarr, 1, 0);
        //     }
        //
        //     if (dsarr[0].asks[0][0] < dsarr[1].bids[0][0]) {
        //         this._trade(dsarr, 0, 1);
        //     }
        // }
    }

    onSimDeals(market) {
        if (!market.ds.hasDepth()) {
            return ;
        }

        let str0 = util.format('curexe: ' + market.ds.deals[market.ds.deals.length - 1][DEALSINDEX.PRICE] + ' ask: ' + market.ds.asks[0][DEPTHINDEX.PRICE] + ' bid: ' + market.ds.bids[0][DEPTHINDEX.PRICE]);
        let str1 = util.format(' mid: ' + (market.ds.asks[0][DEPTHINDEX.PRICE] + market.ds.bids[0][DEPTHINDEX.PRICE]) / 2 + ' off: ' + (market.ds.bids[0][DEPTHINDEX.PRICE] - market.ds.asks[0][DEPTHINDEX.PRICE]));
        let str2 = util.format(' asko: ' + (market.ds.deals[market.ds.deals.length - 1][DEALSINDEX.PRICE] - market.ds.asks[0][DEPTHINDEX.PRICE]) + ' bido: ' + (market.ds.bids[0][DEPTHINDEX.PRICE] - market.ds.deals[market.ds.deals.length - 1][DEALSINDEX.PRICE]));
        console.log(str0 + str1 + str2);

        let totalvolume = [0, 0];
        let maxprice = [0, 0];
        let minprice = [0, 0];

        let ct = new Date().getTime();
        for (let i = 0; i < market.ds.deals.length; ++i) {
            let cd = market.ds.deals[market.ds.deals.length - i - 1];
            if (ct == 0) {
                ct = cd[DEALSINDEX.TMS];
            }

            if (ct <= cd[DEALSINDEX.TMS] + this.amountDepthTime) {
                let ci = cd[DEALSINDEX.TYPE] - 1;

                totalvolume[ci] += cd[DEALSINDEX.VOLUME];

                if (maxprice[ci] < cd[DEALSINDEX.PRICE]) {
                    maxprice[ci] = cd[DEALSINDEX.PRICE];
                }

                if (minprice[ci] == 0 || minprice[ci] > cd[DEALSINDEX.PRICE]) {
                    minprice[ci] = cd[DEALSINDEX.PRICE];
                }
            }
            else {
                break;
            }
        }

        this.amountDepth = Math.min(totalvolume[0], totalvolume[1]);

        let askret = countPriceWithDepth_asks_depth2(market.ds.asks, this.amountDepth);
        let bidret = countPriceWithDepth_bids_depth2(market.ds.bids, this.amountDepth);
        //
        let off = askret.avg - bidret.avg;
        if (off < 0) {
            console.log(util.format('off %d offper', off, off / askret.avg));
            //
            // if (off / askret.avg > 0.004) {
            // console.log(util.format('totalvolume %j maxprice %j minprice %j', totalvolume, maxprice, minprice));
            // console.log(util.format('amountDepth %d', this.amountDepth));

            console.log(util.format('proc asks %j bids %j', askret, bidret));
            // }
        }

        console.log(util.format('totalvolume %j maxprice %j minprice %j', totalvolume, maxprice, minprice));
        console.log(util.format('amountDepth %d', this.amountDepth));
    }
};

exports.Strategy_MarketMaker = Strategy_MarketMaker;