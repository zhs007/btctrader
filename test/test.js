"use strict";

const huobi = require('../src/market/huobi/index');
const okcoinex = require('../src/market/okcoinex/index');

const { matchmakingBid, matchmakingAsk, matchmakingSell, matchmakingBuy, matchmakingAsk_depth2, matchmakingBid_depth2 } = require('../src/util');
const { Trader } = require('../src/trader');
const { Strategy } = require('../src/strategy');

const ISSIMTRADE = true;

class TestStrategy extends Strategy {
    constructor() {
        super();
    }

    onDepth() {

    }

    onDeals() {

    }

    _trade(dsarr, acki, bidi) {
        let arrack = matchmakingAsk_depth2(dsarr[acki].asks, dsarr[bidi].bids);
        this.trader.buyDepthArr(acki, arrack, new Date().getTime());

        let arrbid = matchmakingBid_depth2(dsarr[acki].asks, dsarr[bidi].bids);
        this.trader.buyDepthArr(bidi, arrbid, new Date().getTime());
        // tradeBid(bidi, arrbid);

        console.log(' market0 ' + trader.lstMarket[0].price + ' ' + trader.lstMarket[0].volume + ' ' + trader.lstMarket[0].money);
        console.log(' market1 ' + trader.lstMarket[1].price + ' ' + trader.lstMarket[1].volume + ' ' + trader.lstMarket[1].money);
    }

    onSimDepth() {
        if (this.trader.hasAllDepth()) {
            let dsarr = [this.trader.lstMarket[0].ds, this.trader.lstMarket[1].ds];

            if (dsarr[1].asks[0][0] < dsarr[0].bids[0][0]) {
                this._trade(dsarr, 1, 0);
            }

            if (dsarr[0].asks[0][0] < dsarr[1].bids[0][0]) {
                this._trade(dsarr, 0, 1);
            }
        }
    }

    onSimDeals() {

    }
};

// var dsarr = [];
// var usermoney = [
//     {btc: 0, usdt: 100000},
//     {btc: 0, usdt: 100000},
// ];
//
// const FEE = [
//     [0.002, 0.002],
//     [0.002, 0.002]
// ];

var ds0 = new okcoinex.DataStream({
    addr: 'wss://real.okex.com:10441/websocket',
    symbol: 'btc_usdt',
    simtrade: ISSIMTRADE
});

var ds1 = new huobi.DataStream({
    addr: 'wss://api.huobi.pro/ws',
    symbol: 'btcusdt',
    simtrade: ISSIMTRADE
});

// dsarr.push(ds0);
// dsarr.push(ds1);

var trader = new Trader();
trader.setStrategy(new TestStrategy());
trader.addMarket('okcoinex', 0, 0, 10000, ds0);
trader.addMarket('huobi', 0, 0, 10000, ds1);

ds0.init();
ds1.init();

// var historyAsk = [];
// var historyBid = [];
//
// function checkHistory(history, arr) {
//     if (history.length > 0) {
//         if (history[0][0] == arr[0][0] && history[0][1] == arr[0][1]) {
//             return true;
//         }
//     }
//
//     return false;
// }
//
// function tradeAsk(mi, arr) {
//     historyAsk = [];
//
//     for (let ii = 0; ii < arr.length; ++ii) {
//         historyAsk.push([arr[ii][0], arr[ii][1]]);
//
//         if (trader.lstMarket[mi].volume > 0 && trader.lstMarket[mi].price < arr[ii][0]) {
//             return ;
//         }
//
//         if (trader.buy(mi, arr[ii][0], arr[ii][1], 0)) {
//             console.log(mi + 'buy ' + arr[ii][0] + ' ' + arr[ii][1]);
//             console.log(mi + 'market ' + trader.lstMarket[mi].price + ' ' + trader.lstMarket[mi].volume + ' ' + trader.lstMarket[mi].money);
//         }
//         else {
//             return ;
//         }
//
//         // let cp = arr[ii][0] * arr[ii][1];
//         // if (usermoney[mi].usdt >= cp) {
//         //     usermoney[mi].usdt -= cp;
//         //     usermoney[mi].btc += arr[ii][1];
//         //
//         //     console.log(mi + 'buy ' + arr[ii][0] + ' ' + arr[ii][1]);
//         // }
//         // else {
//         //     let v = usermoney[mi].usdt / arr[ii][0];
//         //
//         //     usermoney[mi].usdt = 0;
//         //     usermoney[mi].btc += v;
//         //
//         //     console.log(mi + 'buy ' + arr[ii][0] + ' ' + v);
//         //
//         //     return ;
//         // }
//     }
// }
//
// function tradeBid(mi, arr) {
//     historyBid = [];
//
//     for (let ii = 0; ii < arr.length; ++ii) {
//         historyBid.push([arr[ii][0], arr[ii][1]]);
//
//         if (trader.sell(mi, arr[ii][0], arr[ii][1], 0)) {
//             console.log(mi + 'sell ' + arr[ii][0] + ' ' + arr[ii][1]);
//             console.log(mi + 'market ' + trader.lstMarket[mi].price + ' ' + trader.lstMarket[mi].volume + ' ' + trader.lstMarket[mi].money);
//         }
//         else {
//             return ;
//         }
//
//         // let cp = arr[ii][0] * arr[ii][1];
//         // if (usermoney[mi].btc >= arr[ii][1]) {
//         //     usermoney[mi].btc -= arr[ii][1];
//         //     usermoney[mi].usdt += cp;
//         //
//         //     console.log(mi + 'sell ' + arr[ii][0] + ' ' + arr[ii][1]);
//         // }
//         // else {
//         //     let p = arr[ii][0] * usermoney[mi].btc;
//         //     let v = usermoney[mi].btc;
//         //
//         //     usermoney[mi].btc = 0;
//         //     usermoney[mi].usdt += p;
//         //
//         //     console.log(mi + 'sell ' + arr[ii][0] + ' ' + v);
//         //
//         //     return ;
//         // }
//     }
// }
//
// function trade(acki, bidi) {
//     //if (usermoney[acki].usdt > 0) {
//         let arrack = matchmakingAsk(dsarr[acki].asks, dsarr[bidi].bids);
//
//         if (checkHistory(historyAsk, arrack)) {
//             return ;
//         }
//
//         // if (trader.lstMarket[acki].volume > 0 && trader.lstMarket[acki].price < dsarr[acki].asks[0][0]) {
//         //     historyAsk = [];
//         //     return ;
//         // }
//
//         tradeAsk(acki, arrack);
//
//         let arrbid = matchmakingBid(dsarr[acki].asks, dsarr[bidi].bids);
//         tradeBid(bidi, arrbid);
//     //}
//     //else {
//
// //    }
//
//     // console.log(usermoney);
//     console.log(' market0 ' + trader.lstMarket[0].price + ' ' + trader.lstMarket[0].volume + ' ' + trader.lstMarket[0].money);
//     console.log(' market1 ' + trader.lstMarket[1].price + ' ' + trader.lstMarket[1].volume + ' ' + trader.lstMarket[1].money);
// }
//
// function trade2(buyi, selli) {
//     // //if (usermoney[acki].usdt > 0) {
//     // let arrack = matchmakingAsk_pv(trader.lstMarket[acki].price, trader.lstMarket[acki].volume, dsarr[bidi].bids);
//     //
//     // if (checkHistory(historyAsk, arrack)) {
//     //     return ;
//     // }
//     //
//     // // if (trader.lstMarket[acki].volume > 0 && trader.lstMarket[acki].price < dsarr[acki].asks[0][0]) {
//     // //     historyAsk = [];
//     // //     return ;
//     // // }
//     //
//     // tradeAsk(acki, arrack);
//
//     let arrbid = matchmakingSell(trader.lstMarket[selli].price, trader.lstMarket[selli].volume, dsarr[selli].asks);
//     if (checkHistory(historyBid, arrbid)) {
//         return ;
//     }
//
//     tradeBid(selli, arrbid);
//
//     let arrack = matchmakingBuy(trader.lstMarket[selli].price, trader.lstMarket[selli].volume, dsarr[buyi].bids);
//
//     tradeAsk(buyi, arrack);
//
//     //}
//     //else {
//
// //    }
//
//     // console.log(usermoney);
//     console.log('Omarket0 ' + trader.lstMarket[0].price + ' ' + trader.lstMarket[0].volume + ' ' + trader.lstMarket[0].money);
//     console.log('Omarket1 ' + trader.lstMarket[1].price + ' ' + trader.lstMarket[1].volume + ' ' + trader.lstMarket[1].money);
// }
//
// function onDepth() {
//     if (dsarr[0].asks.length > 0 && dsarr[0].bids.length > 0 && dsarr[1].asks.length > 0 && dsarr[1].bids.length > 0) {
//         // console.log(dsarr[0].asks[0]);
//         // console.log(dsarr[0].bids[0]);
//         // console.log(dsarr[1].asks[0]);
//         // console.log(dsarr[1].bids[0]);
//
//         if (dsarr[1].asks[0][0] < dsarr[0].bids[0][0]) {
//             // console.log(dsarr[1].asks);
//             // console.log(dsarr[0].bids);
//
//             // let off = dsarr[0].bids[0][0] - dsarr[1].asks[0][0];
//             // console.log('off0 ' + off / dsarr[0].bids[0][0]);
//
//             trade(1, 0);
//             // let arr = matchmaking(dsarr[1].asks, dsarr[0].bids);
//         }
//
//         if (dsarr[0].asks[0][0] < dsarr[1].bids[0][0]) {
//             // console.log(dsarr[0].asks);
//             // console.log(dsarr[1].bids);
//
//             // let off = dsarr[1].bids[0][0] - dsarr[0].asks[0][0];
//             // console.log('off1 ' + off / dsarr[1].bids[0][0]);
//
//             trade(0, 1);
//         }
//
//         // if (trader.lstMarket[0].volume > 0 && dsarr[1].bids[0][0] < trader.lstMarket[0].price) {
//         //     trade2(1, 0);
//         // }
//         //
//         // if (trader.lstMarket[1].volume > 0 && dsarr[0].bids[0][0] < trader.lstMarket[1].price) {
//         //     trade2(0, 1);
//         // }
//     }
// }