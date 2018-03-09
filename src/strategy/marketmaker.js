"use strict";

const { Strategy } = require('../strategy');

class Strategy_MarketMaker extends Strategy {
    constructor() {
        super();
    }

    onDepth() {

    }

    onDeals() {

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

    onSimDepth() {
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

    onSimDeals() {

    }
};

exports.Strategy_MarketMaker = Strategy_MarketMaker;