"use strict";

const { Candles } = require('./data/candles');
const { DEPTHINDEX, DEALSINDEX, DEALTYPE } = require('./basedef');
const OrderMgr = require('./ordermgr');

// asks sort asc, sell
// bids sort desc, buy

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
        this.marketname = '';
        this.symbol = '';
        this.dsindex = 0;

        this.cfg = cfg;

        this.asks = [];
        this.bids = [];

        this.deals = [];

        this.lastPrice = 0;

        this.trader2 = undefined;
        // this.strategy = undefined;
        // this.market = undefined;

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

    getDepthVolume_ask(price) {
        for (let i = 0; i < this.asks.length; ++i) {
            if (price == this.asks[i][DEPTHINDEX.PRICE]) {
                return this.asks[i][DEPTHINDEX.VOLUME];
            }

            if (price > this.asks[i][DEPTHINDEX.PRICE]) {
                return 0;
            }
        }

        return 0;
    }

    getDepthVolume_bid(price) {
        for (let i = 0; i < this.bids.length; ++i) {
            if (price == this.bids[i][DEPTHINDEX.PRICE]) {
                return this.bids[i][DEPTHINDEX.VOLUME];
            }

            if (price < this.bids[i][DEPTHINDEX.PRICE]) {
                return 0;
            }
        }

        return 0;
    }

    //------------------------------------------------------------------------------
    // 需要重载的接口

    _onDepth() {
        if (this.trader2) {
            this.trader2.onDepth(this);
        }

        if (this.funcOnDepth) {
            this.funcOnDepth();
        }

        // if (this.strategy != undefined) {
        //     if (this.cfg.simtrade) {
        //         this.strategy.onSimDepth(this.market);
        //     }
        //     else {
        //         this.strategy.onDepth(this.market);
        //     }
        // }
    }

    _onTrade(trade) {
        if (this.trader2) {
            this.trader2.onTrade(this, trade);
        }
    }

    _onOrder(order) {
        if (order.isupd) {
            OrderMgr.singleton.updOrder(order);
        }

        if (this.trader2) {
            this.trader2.onOrder(this, order);
        }

        // if (this.strategy != undefined) {
        //     if (this.cfg.simtrade) {
        //         this.strategy.onSimOrder(this.market, order);
        //     }
        //     else {
        //         this.strategy.onOrder(this.market, order);
        //     }
        // }
    }

    _onDeals(newnums) {
        if (this.deals.length > this.cfg.maxdeals) {
            this.deals.splice(0, Math.floor(this.cfg.maxdeals / 2));
        }

        if (this.deals.length > 0) {
            this.lastPrice = this.deals[this.deals.length - 1][DEALSINDEX.PRICE];
        }

        if (this.trader2) {
            this.trader2.onDeals(this, newnums);
        }

        if (this.funcOnDeals) {
            this.funcOnDeals(newnums);
        }

        // if (this.strategy != undefined) {
        //     if (this.cfg.simtrade) {
        //         this.market.onMarketSimDeals(newnums, this.strategy.cfg.sim_newdealdelayms);
        //
        //         this.strategy.onSimDeals(this.market, newnums);
        //     }
        //     else {
        //         this.strategy.onDeals(this.market, newnums);
        //     }
        // }

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