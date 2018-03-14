"use strict";

const util = require('util');
const { Strategy } = require('../strategy');
const { DEPTHINDEX, DEALSINDEX, DEALTYPE } = require('../datastream');
const { countPriceWithDepth_asks_depth2, countPriceWithDepth_bids_depth2 } = require('../util');

class Strategy_MulMarket extends Strategy {
    constructor() {
        super();

        this.amountDepthTime = 5 * 60 * 1000;
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
        if (this.trader.hasAllDepth()) {
            let off0 = this.trader.lstMarket[0].ds.bids[0][DEPTHINDEX.PRICE] * 106.85 - this.trader.lstMarket[1].ds.asks[0][DEPTHINDEX.PRICE];
            let off1 = this.trader.lstMarket[1].ds.bids[0][DEPTHINDEX.PRICE] - this.trader.lstMarket[0].ds.asks[0][DEPTHINDEX.PRICE] * 106.85;

            // console.log('market0 ' + this.trader.lstMarket[0].ds.asks[0][DEPTHINDEX.PRICE] + ' ' + this.trader.lstMarket[0].ds.bids[0][DEPTHINDEX.PRICE]);
            // console.log('market1 ' + this.trader.lstMarket[1].ds.asks[0][DEPTHINDEX.PRICE] + ' ' + this.trader.lstMarket[1].ds.bids[0][DEPTHINDEX.PRICE]);

            if (off0 > 0) {
                console.log('off0-' + off0 + 'offper-' + off0 / this.trader.lstMarket[0].ds.asks[0][DEPTHINDEX.PRICE] / 106.85);
            }

            if (off1 > 0) {
                console.log('off1-' + off1 + 'offper-' + off1 / this.trader.lstMarket[1].ds.asks[0][DEPTHINDEX.PRICE]);
            }
        }

        // let askret = countPriceWithDepth_asks_depth2(market.ds.asks, this.amountDepth);
        // let bidret = countPriceWithDepth_bids_depth2(market.ds.bids, this.amountDepth);
        //
        // let off = askret.avg - bidret.avg;
        // console.log(util.format('off %d offper', off, off / askret.avg));
        //
        // if (off / askret.avg > 0.004) {
        //     console.log(util.format('amountDepth %d', this.amountDepth));
        //
        //     console.log(util.format('proc asks %j bids %j', askret, bidret));
        // }
    }

    onSimDeals(market) {
    }
};

exports.Strategy_MulMarket = Strategy_MulMarket;