"use strict";

const { ORDERSIDE, ORDERTYPE, ORDERSTATE } = require('./basedef');
const OrderMgr = require('./ordermgr');

class Market2 {
    constructor(marketname, symbol, ds, traderctrl) {
        this.marketname = marketname;
        this.symbol = symbol;
        this.ds = ds;
        this.traderctrl = traderctrl;

        this.mapOrder = {};
        this.lstOpenOrder = [];

        this.lstTrade = [];

        this.volume = 0;
        this.startvolume = 0;

        this.avgprice = 0;

        this.money = 0;
        this.startmoney = 0;
    }

    newLimitOrder(side, price, volume) {
        if (this.traderctrl) {
            price = this.traderctrl.formatPrice(side, price);
        }

        return OrderMgr.singleton.newLimitOrder(this, side, this.symbol, price, volume);
    }

    newMarketOrder(side, volume) {
        return OrderMgr.singleton.newMarketOrder(this, side, this.symbol, volume);
    }

    newMakeMarketOrder(price0, volume0, price1, volume1) {
        if (price0 > price1) {
            let tp = price0;
            price0 = price1;
            price1 = tp;
        }

        if (this.traderctrl) {
            price0 = this.traderctrl.formatPrice(ORDERSIDE.BUY, price0);
            price1 = this.traderctrl.formatPrice(ORDERSIDE.SELL, price1);
        }

        return OrderMgr.singleton.newMakeMarketOrder(this, ORDERSIDE.BUY, this.symbol, price0, volume0, price1, volume1);
    }

    newStopLossOrder(side, stopLoss, volume) {
        if (this.traderctrl) {
            stopLoss = this.traderctrl.formatPrice(side, stopLoss);
        }

        return OrderMgr.singleton.newStopLossOrder(this, side, this.symbol, stopLoss, volume);
    }

    cancelOrder(lstorder, callback) {
        for (let i = 0; i < lstorder.length; ++i) {
            OrderMgr.singleton.cancelOrder(this, lstorder[i]);
        }
    }

    newOrder2Market(lstorder, callback) {
        if (this.traderctrl) {
            this.traderctrl.createOrders(lstorder, callback);
        }
        else {
            if (callback) {
                callback();
            }
        }
    }

    cancelOrder2Market(lstorder, callback) {
        if (this.traderctrl) {
            this.traderctrl.deleteOrders(lstorder, callback);
        }
        else {
            if (callback) {
                callback();
            }
        }
    }

    // newLimitOrder(side, price, volume, callback) {
    //     let order = OrderMgr.singleton.newLimitOrder(this, side, this.symbol, price, volume);
    //     if (this.traderctrl) {
    //         this.traderctrl.newLimitOrder(order, callback);
    //     }
    //     else {
    //         if (callback) {
    //             callback();
    //         }
    //     }
    // }

    // newMarketOrder(side, volume, callback) {
    //     let order = OrderMgr.singleton.newMarketOrder(this, side, this.symbol, volume);
    //     if (this.traderctrl) {
    //         this.traderctrl.newLimitOrder(order, callback);
    //     }
    //     else {
    //         if (callback) {
    //             callback();
    //         }
    //     }
    //
    //     return order;
    // }

    // newMakeMarketOrder(price0, volume0, price1, volume1, callback) {
    //     if (price0 > price1) {
    //         let tp = price0;
    //         price0 = price1;
    //         price1 = tp;
    //     }
    //
    //     let lst = OrderMgr.singleton.newMakeMarketOrder(this, ORDERSIDE.BUY, this.symbol, price0, volume0, price1, volume1);
    //     if (this.traderctrl) {
    //         this.traderctrl.newMakeMarketOrder(lst, callback);
    //     }
    //     else {
    //         if (callback) {
    //             callback();
    //         }
    //     }
    //
    //     return lst;
    // }

    // newStopProfitAndLossOrder(side, stopProfit, stopLoss, volume, callback) {
    //     let po = OrderMgr.singleton.newStopProfitAndLossOrder(this, side, this.symbol, stopProfit, stopLoss, volume);
    //     if (this.traderctrl) {
    //         this.traderctrl.newStopProfitAndLossOrder(po, callback);
    //     }
    //     else {
    //         if (callback) {
    //             callback();
    //         }
    //     }
    // }

    // newStopLossOrder(side, stopLoss, volume, callback) {
    //     let po = OrderMgr.singleton.newStopLossOrder(this, side, this.symbol, stopLoss, volume);
    //     if (this.traderctrl) {
    //         this.traderctrl.newStopLossOrder(po, callback);
    //     }
    //     else {
    //         if (callback) {
    //             callback();
    //         }
    //     }
    //
    //     return po;
    // }

    // cancelOrder(order, callback) {
    //     OrderMgr.singleton.cancelOrder(this, order);
    //     if (this.traderctrl) {
    //         this.traderctrl.deleteOrder(order, callback);
    //     }
    //     else {
    //         if (callback) {
    //             callback();
    //         }
    //     }
    // }
    //
    // cancelOrders(lstorder, callback) {
    //     for (let i = 0; i < lstorder.length; ++i) {
    //         OrderMgr.singleton.cancelOrder(this, lstorder[i]);
    //     }
    //
    //     if (this.traderctrl) {
    //         this.traderctrl.deleteOrderList(lstorder, callback);
    //     }
    //     else {
    //         if (callback) {
    //             callback();
    //         }
    //     }
    // }
};

exports.Market2 = Market2;