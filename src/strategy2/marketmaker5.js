"use strict";

const util = require('util');
const { Strategy2 } = require('../strategy2');
// const { DEPTHINDEX, DEALSINDEX, DEALTYPE } = require('../datastream');
const { DEPTHINDEX, DEALSINDEX, DEALTYPE, STRATEGYSTATE, ORDERSTATE, ORDERSIDE } = require('../basedef');
const { countPriceWithDepth_asks_depth2, countPriceWithDepth_bids_depth2 } = require('../util');
const { countOrderList, isCancelOrder } = require('../order');
const { initPosition, onOrder_position } = require('../position');
const OrderMgr = require('../ordermgr');
const { INDICATOR_RSI, INDICATOR_COUPLING } = require('../indicator/indicatordef');
const IndicatyorMgr = require('../indicator/indicatormgr');
const { INDICATORINDEX } = require('../indicator/indicator');

const MARKETMAKER5_PARAM = {
    RSI_TIMEOFF:        0,
    RSI_TIMELEN:        1,
    BASE_VOLUME_UINT:   2,
    MAX_VOLUME_UNIT:    3,
    TRADE_RSI:          4,  // 50 +- rsi can trade
    CLOSE_RSI:          5,  // rsi +- rsi need close
    START_VOLUME:       6,
    STOPLOSS_PER:       7,
};

class Strategy2_MarketMaker5 extends Strategy2 {
    constructor(params) {
        super('marketmaker5', params);

        this.rsi = [
            IndicatyorMgr.singleton.newIndicator(INDICATOR_RSI, this.params[MARKETMAKER5_PARAM.RSI_TIMEOFF], this.params[MARKETMAKER5_PARAM.RSI_TIMELEN]),
            IndicatyorMgr.singleton.newIndicator(INDICATOR_RSI, this.params[MARKETMAKER5_PARAM.RSI_TIMEOFF], this.params[MARKETMAKER5_PARAM.RSI_TIMELEN])
        ];

        this.lastprice = [null, null];

        this.coupling = IndicatyorMgr.singleton.newIndicator(INDICATOR_COUPLING, 60 * 1000, 1);

        this.marketPrice = [0, 0];

        this.position = initPosition(0, 0, 0, 0);
        // this.volume = 0;
        // this.avgprice = 0;
        // this.money = 0;

        this.stoplossprice = 0;

        // this.price = 0;

        // this.destPrice = 0;
        // this.side = 0;
        // this.failPrice = 0;

        // this.fee = 0.000675 - 0.000225;
        // this.minwin = 0.0001;
        this.unitvolume = this.params[MARKETMAKER5_PARAM.BASE_VOLUME_UINT];
        // this.minoff = 0.0003;

        // this.orderstate = 0;

        // this.timepriceNums = 3;
        // this.timepriceTimeOff = 60 * 1000;

        // this.curOrder = undefined;
        // this.curOCOOrder = undefined;

        // this.tprice = [new TimePrice(this.timepriceNums, this.timepriceTimeOff), new TimePrice(this.timepriceNums, this.timepriceTimeOff)];

        // this.lastOff = 0;

        // this.lstOrder = undefined;

        this.orderBuy = undefined;
        this.orderSell = undefined;

        this.orderStopLoss = undefined;
        this.orderAutoStopLoss = undefined;
    }

    stoploss() {
        let lstcancel = [];

        if (this.orderBuy != undefined) {
            this.lstMarket2[1].cancelOrder([this.orderBuy]);
            lstcancel.push(this.orderBuy);
        }

        if (this.orderSell != undefined) {
            this.lstMarket2[1].cancelOrder([this.orderSell]);
            lstcancel.push(this.orderSell);
        }

        if (this.orderAutoStopLoss != undefined) {
            this.lstMarket2[1].cancelOrder([this.orderAutoStopLoss]);
            lstcancel.push(this.orderAutoStopLoss);
        }

        if (lstcancel.length > 0) {
            this.lstMarket2[1].cancelOrder2Market(lstcancel);
        }

        if (this.position.volume > 0) {
            this.orderStopLoss = this.lstMarket2[1].newMarketOrder(ORDERSIDE.SELL, this.position.volume);
            this.lstMarket2[1].newOrder2Market([this.orderStopLoss]);
        }

        if (this.position.volume < 0) {
            this.orderStopLoss = this.lstMarket2[1].newMarketOrder(ORDERSIDE.BUY, -this.position.volume);
            this.lstMarket2[1].newOrder2Market([this.orderStopLoss]);
        }
    }

    newOrder(price0, volume0, price1, volume1, stopprice) {
        console.log(`neworder ${price0} ${price1}`);

        let lstcancel = [];

        if (this.orderBuy != undefined) {
            this.lstMarket2[1].cancelOrder([this.orderBuy]);
            lstcancel.push(this.orderBuy);
        }

        if (this.orderSell != undefined) {
            this.lstMarket2[1].cancelOrder([this.orderSell]);
            lstcancel.push(this.orderSell);
        }

        if (this.orderAutoStopLoss != undefined) {
            this.lstMarket2[1].cancelOrder([this.orderAutoStopLoss]);
            lstcancel.push(this.orderAutoStopLoss);
        }

        if (lstcancel.length > 0) {
            this.lstMarket2[1].cancelOrder2Market(lstcancel);
        }

        let lst = this.lstMarket2[1].newMakeMarketOrder(price0, volume0, price1, volume1);
        this.orderBuy = lst[0];
        this.orderSell = lst[1];

        if (this.position.volume > 0) {
            this.orderAutoStopLoss = this.lstMarket2[1].newStopLossOrder(ORDERSIDE.SELL, this.position.avgprice * 0.99, this.position.volume);
            lst.push(this.orderAutoStopLoss);
        }
        else if (this.position.volume < 0) {
            this.orderAutoStopLoss = this.lstMarket2[1].newStopLossOrder(ORDERSIDE.BUY, this.position.avgprice * 1.01, -this.position.volume);
            lst.push(this.orderAutoStopLoss);
        }

        if (lst.length > 0) {
            this.lstMarket2[1].newOrder2Market(lst);
        }
    }

    _onAutoStopLoss() {
        let lstcancel = [];

        if (this.orderBuy != undefined) {
            this.lstMarket2[1].cancelOrder([this.orderBuy]);
            lstcancel.push(this.orderBuy);
        }

        if (this.orderSell != undefined) {
            this.lstMarket2[1].cancelOrder([this.orderSell]);
            lstcancel.push(this.orderSell);
        }

        if (this.orderAutoStopLoss != undefined) {
            this.lstMarket2[1].cancelOrder([this.orderAutoStopLoss]);
            lstcancel.push(this.orderAutoStopLoss);
        }

        if (lstcancel.length > 0) {
            this.lstMarket2[1].cancelOrder2Market(lstcancel);
        }
    }

    _onDeal(dsindex, lstdeal) {
        this.rsi[dsindex].onDeal_indicator(lstdeal[dsindex]);

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

        if (this.orderBuy != undefined && this.orderSell != undefined) {
            return ;
        }

        if (this.orderStopLoss != undefined) {
            return ;
        }

        if (dsindex == 1) {
            // if (this.position.volume > 0 && curdeal[1][DEALSINDEX.PRICE] < this.stoplossprice) {
            //     this.stoploss();
            // }
            // else if (this.position.volume < 0 && curdeal[1][DEALSINDEX.PRICE] > this.stoplossprice) {
            //     this.stoploss();
            // }

            let rsi0 = this.rsi[0].getLastVal();
            let rsi1 = this.rsi[1].getLastVal();
            if (rsi0 != undefined && rsi1 != undefined) {
                if (rsi0[INDICATORINDEX.VAL] <= 50 + this.params[MARKETMAKER5_PARAM.TRADE_RSI] &&
                    rsi0[INDICATORINDEX.VAL] >= 50 - this.params[MARKETMAKER5_PARAM.TRADE_RSI] &&
                    rsi1[INDICATORINDEX.VAL] <= 50 + this.params[MARKETMAKER5_PARAM.TRADE_RSI] &&
                    rsi1[INDICATORINDEX.VAL] >= 50 - this.params[MARKETMAKER5_PARAM.TRADE_RSI]) {

                    let curask = curds[1].asks[0];
                    let curbid = curds[1].bids[0];

                    if (curask != undefined && curbid != undefined) {
                        if (this.position.volume == 0) {
                            if (curask[DEPTHINDEX.VOLUME] >= this.params[MARKETMAKER5_PARAM.START_VOLUME] && curbid[DEPTHINDEX.VOLUME] >= this.params[MARKETMAKER5_PARAM.START_VOLUME]) {
                                if (this.orderBuy == undefined && this.orderSell == undefined) {
                                    this.newOrder(curbid[DEPTHINDEX.PRICE], this.unitvolume, curask[DEPTHINDEX.PRICE], this.unitvolume);
                                }
                            }
                        }
                        else if (this.position.volume > 0) {
                            if (curask[DEPTHINDEX.VOLUME] >= this.params[MARKETMAKER5_PARAM.START_VOLUME] && curbid[DEPTHINDEX.VOLUME] > curask[DEPTHINDEX.VOLUME] * 2) {
                                let np = curbid[DEPTHINDEX.PRICE] - Math.floor(this.position.volume / this.unitvolume) * 2;
                                let ap = (this.position.avgprice * this.position.volume + np * this.unitvolume) / (this.position.volume + this.unitvolume);
                                let sp = ap + 1;

                                if (sp <= curask[DEPTHINDEX.PRICE]) {
                                    sp = curask[DEPTHINDEX.PRICE];
                                }

                                this.newOrder(np, this.unitvolume, sp, this.unitvolume + this.position.volume);
                            }
                        }
                        else {
                            if (curbid[DEPTHINDEX.VOLUME] >= this.params[MARKETMAKER5_PARAM.START_VOLUME] && curask[DEPTHINDEX.VOLUME] > curbid[DEPTHINDEX.VOLUME] * 2) {
                                let np = curask[DEPTHINDEX.PRICE] + Math.floor(-this.position.volume / this.unitvolume) * 2;
                                let ap = (this.position.avgprice * -this.position.volume + np * this.unitvolume) / (-this.position.volume + this.unitvolume);
                                let bp = ap - 1;

                                if (bp >= curbid[DEPTHINDEX.PRICE]) {
                                    bp = curbid[DEPTHINDEX.PRICE];
                                }

                                this.newOrder(bp, this.unitvolume  - this.position.volume, np, this.unitvolume);
                            }
                        }
                    }

                }

                // if (rsi0[INDICATORINDEX.VAL] >= 50 + this.params[MARKETMAKER5_PARAM.CLOSE_RSI] ||
                //     rsi0[INDICATORINDEX.VAL] <= 50 - this.params[MARKETMAKER5_PARAM.CLOSE_RSI] ||
                //     rsi1[INDICATORINDEX.VAL] >= 50 + this.params[MARKETMAKER5_PARAM.CLOSE_RSI] ||
                //     rsi1[INDICATORINDEX.VAL] <= 50 - this.params[MARKETMAKER5_PARAM.CLOSE_RSI]) {
                //
                //     this.stoploss();
                // }
            }
        }
    }

    onTrade(dsindex, trade) {
        let order = trade.order;

        if (this.orderBuy != undefined) {
            if (this.orderBuy.mainid == order.mainid && this.orderBuy.indexid == order.indexid) {
                // let avgprice = this.position.avgprice;
                this.lstMarket2[1].traderctrl.countPositionWithTrade(this.position, trade);
                // onOrder_position(this.lstMarket2[1].traderctrl, this.position, order);

                // this.stoplossprice = this.position.avgprice * 0.99;
                // if (!isCancelOrder(order)) {
                //     console.log(`buy money ${this.position.money} ${this.position.volume} ${avgprice} ${trade.price} ${trade.volume}`);
                // }
                //
                // if (order.lastvolume == 0) {
                //     this.orderBuy = undefined;
                // }
            }
        }

        if (this.orderSell != undefined) {
            if (this.orderSell.mainid == order.mainid && this.orderSell.indexid == order.indexid) {
                // let avgprice = this.position.avgprice;
                this.lstMarket2[1].traderctrl.countPositionWithTrade(this.position, trade);
                // let avgprice = this.position.avgprice;
                // onOrder_position(this.lstMarket2[1].traderctrl, this.position, order);

                // this.stoplossprice = this.position.avgprice * 1.01;
                // if (!isCancelOrder(order)) {
                //     console.log(`sell money ${this.position.money} ${this.position.volume} ${avgprice} ${order.avgprice} ${trade.volume}`);
                // }
                //
                // if (order.lastvolume == 0) {
                //     this.orderSell = undefined;
                // }

                // if (order.ordstate == ORDERSTATE.CLOSE) {
                //     let avgprice = order.avgprice;
                //
                //     if (this.volume < 0) {
                //         avgprice = (order.avgprice * order.volume + -this.volume * this.avgprice) / (-this.volume + order.volume);
                //     }
                //     else if (this.volume > 0 && order.volume < this.volume) {
                //         avgprice = this.avgprice;
                //     }
                //
                //     this.avgprice = avgprice;
                //     this.volume -= order.volume;
                //
                //     this.money += order.volume * order.avgprice;
                //
                //     console.log('sell money ' + this.money + ' ' + this.volume);
                //
                //     this.stoplossprice = this.avgprice * 1.01;
                // }
                //
                // this.orderSell = undefined;
            }
        }

        if (this.orderStopLoss != undefined) {
            if (this.orderStopLoss.mainid == order.mainid && this.orderStopLoss.indexid == order.indexid) {
                // let avgprice = this.position.avgprice;
                this.lstMarket2[1].traderctrl.countPositionWithTrade(this.position, trade);
                // let avgprice = this.position.avgprice;
                // onOrder_position(this.lstMarket2[1].traderctrl, this.position, order);

                // if (!isCancelOrder(order)) {
                //     console.log(`stoploss money ${this.position.money} ${this.position.volume} ${avgprice} ${order.avgprice} ${trade.volume}`);
                // }
                //
                // if (order.lastvolume == 0) {
                //     this.orderStopLoss = undefined;
                // }
            }
        }

        if (this.orderAutoStopLoss != undefined) {
            if (this.orderAutoStopLoss.mainid == order.mainid && this.orderAutoStopLoss.indexid == order.indexid) {
                // let avgprice = this.position.avgprice;
                this.lstMarket2[1].traderctrl.countPositionWithTrade(this.position, trade);
                // let avgprice = this.position.avgprice;
                // onOrder_position(this.lstMarket2[1].traderctrl, this.position, order);

                // if (!isCancelOrder(order)) {
                //     console.log(`autostoploss money ${this.position.money} ${this.position.volume} ${avgprice} ${order.avgprice} ${trade.volume}`);
                // }
                //
                // if (order.lastvolume == 0) {
                //     this.orderAutoStopLoss = undefined;
                //
                //     this._onAutoStopLoss();
                // }
            }
        }
    }

    onOrder(market, order) {
        if (this.orderBuy != undefined) {
            if (this.orderBuy.mainid == order.mainid && this.orderBuy.indexid == order.indexid) {
                let avgprice = this.position.avgprice;
                // onOrder_position(this.lstMarket2[1].traderctrl, this.position, order);

                this.stoplossprice = this.position.avgprice * 0.99;
                if (!isCancelOrder(order)) {
                    console.log(`buy money ${this.position.money} ${this.position.volume} ${avgprice} ${order.avgprice}`);
                }

                if (order.lastvolume == 0) {
                    this.orderBuy = undefined;
                }

                // if (order.ordstate == ORDERSTATE.CLOSE) {
                //     let avgprice = order.avgprice;
                //
                //     if (this.volume > 0) {
                //         avgprice = (order.avgprice * order.volume + this.volume * this.avgprice) / (this.volume + order.volume);
                //     }
                //     else if (this.volume < 0 && order.volume < -this.volume) {
                //         avgprice = this.avgprice;
                //     }
                //
                //     this.avgprice = avgprice;
                //     this.volume += order.volume;
                //
                //     this.money -= order.volume * order.avgprice;
                //
                //     this.stoplossprice = this.avgprice * 0.99;
                //
                //     console.log('buy money ' + this.money + ' ' + this.volume);
                // }
                //
                // this.orderBuy = undefined;
            }
        }

        if (this.orderSell != undefined) {
            if (this.orderSell.mainid == order.mainid && this.orderSell.indexid == order.indexid) {
                let avgprice = this.position.avgprice;
                // onOrder_position(this.lstMarket2[1].traderctrl, this.position, order);

                this.stoplossprice = this.position.avgprice * 1.01;
                if (!isCancelOrder(order)) {
                    console.log(`sell money ${this.position.money} ${this.position.volume} ${avgprice} ${order.avgprice}`);
                }

                if (order.lastvolume == 0) {
                    this.orderSell = undefined;
                }

                // if (order.ordstate == ORDERSTATE.CLOSE) {
                //     let avgprice = order.avgprice;
                //
                //     if (this.volume < 0) {
                //         avgprice = (order.avgprice * order.volume + -this.volume * this.avgprice) / (-this.volume + order.volume);
                //     }
                //     else if (this.volume > 0 && order.volume < this.volume) {
                //         avgprice = this.avgprice;
                //     }
                //
                //     this.avgprice = avgprice;
                //     this.volume -= order.volume;
                //
                //     this.money += order.volume * order.avgprice;
                //
                //     console.log('sell money ' + this.money + ' ' + this.volume);
                //
                //     this.stoplossprice = this.avgprice * 1.01;
                // }
                //
                // this.orderSell = undefined;
            }
        }

        if (this.orderStopLoss != undefined) {
            if (this.orderStopLoss.mainid == order.mainid && this.orderStopLoss.indexid == order.indexid) {
                let avgprice = this.position.avgprice;
                // onOrder_position(this.lstMarket2[1].traderctrl, this.position, order);

                if (!isCancelOrder(order)) {
                    console.log(`stoploss money ${this.position.money} ${this.position.volume} ${avgprice} ${order.avgprice}`);
                }

                if (order.lastvolume == 0) {
                    this.orderStopLoss = undefined;
                }
            }
        }

        if (this.orderAutoStopLoss != undefined) {
            if (this.orderAutoStopLoss.mainid == order.mainid && this.orderAutoStopLoss.indexid == order.indexid) {
                let avgprice = this.position.avgprice;
                // onOrder_position(this.lstMarket2[1].traderctrl, this.position, order);

                if (!isCancelOrder(order)) {
                    console.log(`autostoploss money ${this.position.money} ${this.position.volume} ${avgprice} ${order.avgprice}`);
                }

                if (order.lastvolume == 0) {
                    this.orderAutoStopLoss = undefined;

                    this._onAutoStopLoss();
                }
            }
        }
    }

    onTick() {
        // let curms = new Date().getTime();
        // if (this.curOrder != undefined && this.curOrder.lastvolume > 0 && (this.curOrder.ordstate == ORDERSTATE.OPEN || this.curOrder.ordstate == ORDERSTATE.RUNNING)) {
        //     let off = (this.curOrder.price - this.marketPrice[1]) / this.curOrder.price;
        //     if (Math.abs(off) >= 0.05) {
        //         this.lstMarketInfo[1].market.ctrl.deleteOrder(this.curOrder);
        //     }
        //     // else if (curms - this.curOrder.openms >= 30 * 1000) {
        //     else if (curms - this.curOrder.openms >= 3 * 60 * 1000) {
        //         this.lstMarketInfo[1].market.ctrl.deleteOrder(this.curOrder);
        //     }
        // }
    }
};

exports.Strategy2_MarketMaker5 = Strategy2_MarketMaker5;