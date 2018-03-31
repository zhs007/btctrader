"use strict";

const util = require('util');
const { Strategy } = require('../strategy');
// const { DEPTHINDEX, DEALSINDEX, DEALTYPE } = require('../datastream');
const { DEPTHINDEX, DEALSINDEX, DEALTYPE, STRATEGYSTATE, ORDERSTATE } = require('../basedef');
const { countPriceWithDepth_asks_depth2, countPriceWithDepth_bids_depth2 } = require('../util');
const { countOrderList } = require('../order');
const OrderMgr = require('../ordermgr');
const { ORDERSIDE } = require('../basedef');

class Strategy_AnchoredPrice extends Strategy {
    constructor() {
        super();

        this.marketPrice = [0, 0];

        this.volume = 0;
        this.price = 0;

        this.destPrice = 0;
        this.side = 0;
        this.failPrice = 0;

        this.fee = 0.00075;
        this.minwin = 0.0002;

        this.orderstate = 0;

        this.curOrder = undefined;
        this.curOCOOrder = undefined;
    }

    newOrder(side) {
        if (this.orderstate != 0) {
            return ;
        }

        this.orderstate++;
        this.lstMarketInfo[1].market.ctrl.newMarketOrder(side == 1, 1);
    }

    onDeals(market) {
        let curdeal = market.ds.deals[market.ds.deals.length - 1];
        // console.log(market.marketindex + ' ' + JSON.stringify(curdeal));

        this.marketPrice[market.marketindex] = curdeal[DEALSINDEX.PRICE];

        if (this.marketPrice[0] > 0 && this.marketPrice[1] > 0) {
            let off = (this.marketPrice[1] - this.marketPrice[0]) / this.marketPrice[1];
            // console.log(off + ' ' + (this.minwin + this.fee) * 2);

            if (this.curOrder == undefined) {
                if (Math.abs(off) > (this.minwin + this.fee) * 2) {
                    this.destPrice = this.marketPrice[1] - (off / 2 * this.marketPrice[1]);

                    let side = off > 0 ? ORDERSIDE.SELL : ORDERSIDE.BUY;
                    this.curOrder = OrderMgr.singleton.newLimitOrder(side, this.lstMarketInfo[1].market.ds.cfg.symbol, this.marketPrice[1], 1, () => {});
                    this.lstMarketInfo[1].market.ctrl.newLimitOrder(this.curOrder);
                }
            }
            else {

            }


            // if (this.volume != 0) {
            //     if (this.side > 0) {
            //         if (this.marketPrice[1] >= this.destPrice) {
            //             this.newOrder(-this.side);
            //         }
            //         else if (this.marketPrice[1] < this.failPrice) {
            //             this.newOrder(-this.side);
            //         }
            //     }
            //     else {
            //         if (this.marketPrice[1] <= this.destPrice) {
            //             this.newOrder(-this.side);
            //         }
            //         else if (this.marketPrice[1] > this.failPrice) {
            //             this.newOrder(-this.side);
            //         }
            //     }
            // }
            //
            // if (Math.abs(off) > (this.minwin + this.fee) * 2) {
            //
            //     if (this.volume == 0) {
            //         this.destPrice = this.marketPrice[1] - (off / 2 * this.marketPrice[1]);
            //
            //         if (off > 0) {
            //             this.side = -1;
            //
            //             console.log('sell ' + this.marketPrice[1]);
            //             console.log('buy ' + this.destPrice);
            //         }
            //         else {
            //             this.side = 1;
            //
            //             console.log('buy ' + this.marketPrice[1]);
            //             console.log('sell ' + this.destPrice);
            //         }
            //
            //         this.newOrder(this.side);
            //         // market.ctrl.newMarketOrder(this.side, 1);
            //     }
            //     else if (this.volume > 0) {
            //         if (off > 0) {
            //
            //         }
            //     }
            // }
        }
    }

    onOrder(market, order) {
        if (this.curOrder != undefined) {
            if (order.lastvolume == 0 && this.curOrder.mainid == order.mainid && this.curOrder.indexid == order.indexid) {
                if (order.ordstate == ORDERSTATE.CANCELED) {
                    this.curOrder = undefined;
                }
                else {
                    if (order.side == ORDERSIDE.BUY) {
                        this.curOCOOrder = OrderMgr.singleton.newOCOOrder(
                            ORDERSIDE.SELL,
                            this.lstMarketInfo[1].market.ds.cfg.symbol,
                            this.destPrice,
                            order.avgprice - this.marketPrice[1] * 0.003,
                            order.volume, () => {});
                    }
                    else {
                        this.curOCOOrder = OrderMgr.singleton.newOCOOrder(
                            ORDERSIDE.BUY,
                            this.lstMarketInfo[1].market.ds.cfg.symbol,
                            this.destPrice,
                            order.avgprice + this.marketPrice[1] * 0.003,
                            order.volume, () => {});
                    }

                    this.lstMarketInfo[1].market.ctrl.newOCOOrder(this.curOCOOrder);
                }
            }
        }

        if (this.curOCOOrder != undefined) {
            if (order.lastvolume == 0 && order.parent && order.parent.mainid == this.curOCOOrder.mainid && order.parent.indexid == this.curOCOOrder.indexid) {
                this.curOrder = undefined;
                this.curOCOOrder = undefined;
            }
        }

        // let ret = countOrderList(market.ds.orders);
        // if (ret.opennums == 0 && this.orderstate == 1) {
        //     if (this.volume == 0) {
        //         this.orderstate = 0;
        //
        //         this.volume = ret.lastvolume;
        //         this.price = ret.avgprice;
        //
        //         if (this.side > 0) {
        //             this.failPrice = this.price - this.marketPrice[1] * 0.003;
        //         }
        //         else {
        //             this.failPrice = this.price + this.marketPrice[1] * 0.003;
        //         }
        //
        //         console.log('ok ' + this.destPrice);
        //         console.log('fail ' + this.failPrice);
        //     }
        //     else {
        //         this.orderstate = 0;
        //
        //         this.volume = 0;
        //         this.price = 0;
        //         this.side = 0;
        //     }
        // }
    }

    onTick() {
        let curms = new Date().getTime();
        if (this.curOrder != undefined && this.curOrder.lastvolume > 0 && (this.curOrder.ordstate == ORDERSTATE.OPEN || this.curOrder.ordstate == ORDERSTATE.RUNNING)) {
            let off = (this.curOrder.price - this.marketPrice[1]) / this.curOrder.price;
            if (Math.abs(off) >= 0.05) {
                this.lstMarketInfo[1].market.ctrl.deleteOrder(this.curOrder);
            }
            // else if (curms - this.curOrder.openms >= 30 * 1000) {
            else if (curms - this.curOrder.openms >= 3 * 60 * 1000) {
                this.lstMarketInfo[1].market.ctrl.deleteOrder(this.curOrder);
            }
        }
    }
};

exports.Strategy_AnchoredPrice = Strategy_AnchoredPrice;