"use strict";

const { Candles } = require('./data/candles');
const { DEPTHINDEX, DEALSINDEX, DEALTYPE } = require('./basedef');
const OrderMgr = require('./ordermgr');

// asks sort asc
// bids sort desc

// const DEPTHINDEX = {
//     PRICE:      0,
//     VOLUME:     1,
//     ID:         2,  // only simtrade use
//     LASTVOLUME: 3   // only simtrade use
// };
//
// const DEALSINDEX = {
//     ID:         0,
//     PRICE:      1,
//     VOLUME:     2,
//     TMS:        3,
//     TYPE:       4
// };
//
// const DEALTYPE = {
//     NULL:       0,
//     BUY:        1,
//     SELL:       2
// };

class DataStream {
    // cfg.output_message
    // cfg.maxdeals
    // cfg.simtrade
    // cfg.tickdatatname
    // cfg.candledatatname
    // cfg.onlycandleinfo
    // cfg.buildcandle
    // cfg.tickdataex
    constructor(cfg) {
        this.cfg = cfg;

        this.asks = [];
        this.bids = [];

        this.deals = [];

        this.lastPrice = 0;

        this.strategy = undefined;
        this.market = undefined;

        this.currencyExchg = 1;

        this.mgrData = undefined;
        this.dataCandles = undefined;

        this.funcOnDepth = undefined;
        this.funcOnDeals = undefined;
        this.funcOnAuth = undefined;

        this.orders = [];

        this._procConfig();
    }

    _procConfig() {
        if (!this.cfg.simtrade) {
            this.cfg.simtrade = false;
        }

        if (!this.cfg.maxdeals) {
            this.cfg.maxdeals = 500;
        }

        if (!this.cfg.output_message) {
            this.cfg.output_message = false;
        }

        if (!this.cfg.buildcandle) {
            this.cfg.buildcandle = false;
        }

        if (this.cfg.candledatatname) {
            this.cfg.buildcandle = true;
        }
    }

    hasDepth() {
        return this.asks.length > 0 && this.bids.length;
    }

    hasDeals() {
        return this.deals.length > 0;
    }

    formatOrder() {
        for (let i = 0; i < this.orders.length; ) {
            if (this.orders[i].lastvolume == 0) {
                this.orders.splice(i, 1);
            }
            else {
                ++i;
            }
        }
    }

    findOrder(orderid) {
        for (let i = 0; i < this.orders.length; ++i) {
            if (this.orders[i].id == orderid) {
                return this.orders[i];
            }
        }

        return undefined;
    }

    removeOrder(orderid) {
        for (let i = 0; i < this.orders.length; ++i) {
            if (this.orders[i].id == orderid) {
                this.orders.splice(i, 1);

                return ;
            }
        }
    }

    //------------------------------------------------------------------------------
    // 需要重载的接口

    _onDepth() {
        if (this.funcOnDepth) {
            this.funcOnDepth();
        }

        if (this.strategy != undefined) {
            if (this.cfg.simtrade) {
                this.strategy.onSimDepth(this.market);
            }
            else {
                this.strategy.onDepth(this.market);
            }
        }
    }

    _onOrder(order) {
        if (order.isupd) {
            OrderMgr.singleton.updOrder(order);
        }

        if (this.strategy != undefined) {
            if (this.cfg.simtrade) {
                this.strategy.onSimOrder(this.market, order);
            }
            else {
                this.strategy.onOrder(this.market, order);
            }
        }
    }

    _onDeals(newnums) {
        if (this.deals.length > this.cfg.maxdeals) {
            this.deals.splice(0, Math.floor(this.cfg.maxdeals / 2));
        }

        if (this.deals.length > 0) {
            this.lastPrice = this.deals[this.deals.length - 1][DEALSINDEX.PRICE];
        }

        if (this.funcOnDeals) {
            this.funcOnDeals(newnums);
        }

        if (this.strategy != undefined) {
            if (this.cfg.simtrade) {
                this.market.onMarketSimDeals(newnums, this.strategy.cfg.sim_newdealdelayms);

                this.strategy.onSimDeals(this.market, newnums);
            }
            else {
                this.strategy.onDeals(this.market, newnums);
            }
        }

        if (this.cfg.tickdatatname && this.mgrData) {
            if (this.cfg.tickdataex) {
                for (let i = this.deals.length - newnums; i < this.deals.length; ++i) {
                    let cn = this.deals[i];
                    let cask = this.asks[0];
                    let cbid = this.bids[0];

                    this.mgrData.insertTickEx(this.cfg.tickdatatname, cn[DEALSINDEX.TYPE], cn[DEALSINDEX.PRICE], cn[DEALSINDEX.VOLUME],
                        cn[DEALSINDEX.TMS]);
                }
            }
            else if (this.asks.length > 0 && this.bids.length > 0) {
                for (let i = this.deals.length - newnums; i < this.deals.length; ++i) {
                    let cn = this.deals[i];
                    let cask = this.asks[0];
                    let cbid = this.bids[0];

                    this.mgrData.insertTick(this.cfg.tickdatatname, cn[DEALSINDEX.TYPE], cn[DEALSINDEX.PRICE], cn[DEALSINDEX.VOLUME],
                        cask[DEPTHINDEX.PRICE], cask[DEPTHINDEX.VOLUME], cbid[DEPTHINDEX.PRICE], cbid[DEPTHINDEX.VOLUME],
                        cn[DEALSINDEX.TMS]);
                }
            }
        }

        if (this.cfg.buildcandle) {
            if (this.cfg.onlycandleinfo) {
                if (this.dataCandles == undefined) {
                    this.dataCandles = new Candles();
                }

                for (let i = this.deals.length - newnums; i < this.deals.length; ++i) {
                    let cn = this.deals[i];

                    this.dataCandles.onDeals_simple(this.mgrData, this.cfg.candledatatname, cn);
                }
            }
            else if (this.asks.length > 0 && this.bids.length > 0) {
                if (this.dataCandles == undefined) {
                    this.dataCandles = new Candles();
                }

                for (let i = this.deals.length - newnums; i < this.deals.length; ++i) {
                    let cn = this.deals[i];
                    let cask = this.asks[0];
                    let cbid = this.bids[0];

                    this.dataCandles.onDeals(this.mgrData, this.cfg.candledatatname, cn, cask, cbid);
                }
            }
        }
    }
};

exports.DataStream = DataStream;

// exports.DEPTHINDEX      = DEPTHINDEX;
// exports.DEALSINDEX      = DEALSINDEX;
// exports.DEALTYPE        = DEALTYPE;