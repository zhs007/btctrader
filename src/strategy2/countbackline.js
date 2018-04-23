"use strict";

const util = require('util');
const { Strategy2 } = require('../strategy2');
const { DEPTHINDEX, DEALSINDEX, DEALTYPE, STRATEGYSTATE, ORDERSTATE } = require('../basedef');
const { countPriceWithDepth_asks_depth2, countPriceWithDepth_bids_depth2 } = require('../util');
const { countOrderList } = require('../order');
const OrderMgr = require('../ordermgr');
const { ORDERSIDE } = require('../basedef');
const IndicatyorMgr = require('../indicator/indicatormgr');
const { INDICATOR_COUNTBACKLINE, INDICATOR_COUPLING, INDICATOR_RSI } = require('../indicator/indicatordef');

class Strategy2_CountBackLine extends Strategy2 {
    constructor() {
        super();

        this.cbl = [
            IndicatyorMgr.singleton.newIndicator(INDICATOR_COUNTBACKLINE, 60 * 1000, 3),
            IndicatyorMgr.singleton.newIndicator(INDICATOR_COUNTBACKLINE, 60 * 1000, 3)
        ];

        this.rsi = [
            IndicatyorMgr.singleton.newIndicator(INDICATOR_RSI, 60 * 1000, 14),
            IndicatyorMgr.singleton.newIndicator(INDICATOR_RSI, 60 * 1000, 14)
        ];

        this.lastcblu = [null, null];
        this.lastcbld = [null, null];
        this.lastprice = [null, null];

        this.coupling = IndicatyorMgr.singleton.newIndicator(INDICATOR_COUPLING, 60 * 1000, 1);

        this.order = undefined;
    }

    newOrder(side, price) {
        if (this.order != undefined) {
            return ;
        }

        this.order = this.lstMarket2[1].newLimitOrder(side, price, 100);
    }

    _onDeal(dsindex, lstdeal) {
        this.rsi[dsindex].onDeal_indicator(lstdeal[dsindex]);

        this.cbl[dsindex].onDeal_indicator(lstdeal[dsindex]);
        let lcbl = this.cbl[dsindex].getLastVal();
        if (lcbl != undefined) {
            if (lcbl[1] != null) {
                this.lastcblu[dsindex] = lcbl[1];

                if (dsindex == 1) {
                    this.newOrder(ORDERSIDE.BUY, lcbl[1]);
                }
                // console.log(dsindex + ' cblu ' + lcbl[1] + ' tms ' + lcbl[0]);
            }

            if (lcbl[2] != null) {
                this.lastcbld[dsindex] = lcbl[2];
                // console.log(dsindex + ' cbld ' + lcbl[2] + ' tms ' + lcbl[0]);
            }
        }

        // if (dsindex == 1 && this.lastprice[dsindex] != null && this.lastcblu[dsindex] != null) {
        //     if (this.lastprice[dsindex] <= this.lastcblu[dsindex] && lstdeal[dsindex][DEALSINDEX.PRICE] >= this.lastcblu[dsindex]) {
        //         // console.log('openu ' + lstdeal[dsindex][DEALSINDEX.PRICE]);
        //     }
        // }
        //
        // if (dsindex == 1 && this.lastprice[dsindex] != null && this.lastcbld[dsindex] != null) {
        //     if (this.lastprice[dsindex] <= this.lastcbld[dsindex] && lstdeal[dsindex][DEALSINDEX.PRICE] >= this.lastcbld[dsindex]) {
        //         // console.log('opend ' + lstdeal[dsindex][DEALSINDEX.PRICE]);
        //     }
        // }

        this.lastprice[dsindex] = lstdeal[dsindex][DEALSINDEX.PRICE];

        if (lstdeal[0] && lstdeal[1]) {
            this.coupling.onDeal2_indicator(lstdeal[0], lstdeal[1]);

            let lcoupling = this.coupling.getLastVal();
            if (lcoupling != undefined) {
                // console.log('coupling ' + lcoupling[1]);
            }
        }
    }

    onDeals(dsindex, newnums) {
        super.onDeals(dsindex, newnums);

        let curds = [this.lstMarket2[0].ds, this.lstMarket2[1].ds];
        let curdeal = [curds[0].deals[curds[0].deals.length - 1], curds[1].deals[curds[1].deals.length - 1]];

        for (let i = 0; i < newnums; ++i) {
            curdeal[dsindex] = curds[dsindex].deals[curds[dsindex].deals.length - newnums + i];
            this._onDeal(dsindex, curdeal);
        }
    }

    onOrder(market, order) {
        if (this.order != undefined) {
            if (order.lastvolume == 0 && this.order.mainid == order.mainid && this.order.indexid == order.indexid) {
                this.order.isfinished = true;

                this.order == undefined;
            }
        }
    }

    onTick() {
    }
};

exports.Strategy2_CountBackLine = Strategy2_CountBackLine;