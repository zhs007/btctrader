"use strict";

// asks sort asc
// bids sort desc

const DEPTHINDEX = {
    PRICE:      0,
    VOLUME:     1,
    ID:         2,  // only simtrade use
    LASTVOLUME: 3   // only simtrade use
};

const DEALSINDEX = {
    ID:         0,
    PRICE:      1,
    VOLUME:     2,
    TS:         3,
    TYPE:       4
};

const DEALTYPE = {
    NULL:       0,
    BUY:        1,
    SELL:       2
};

class DataStream {
    // cfg.output_message
    // cfg.maxdeals
    // cfg.simtrade
    constructor(cfg) {
        this.cfg = cfg;

        this.asks = [];
        this.bids = [];

        this.deals = [];

        this.lastPrice = 0;

        this.strategy = undefined;
        this.market = undefined;

        this._procConfig();
    }

    _procConfig() {
        if (!this.cfg.hasOwnProperty('simtrade')) {
            this.cfg.simtrade = false;
        }

        if (!this.cfg.hasOwnProperty('maxdeals')) {
            this.cfg.maxdeals = 500;
        }

        if (!this.cfg.hasOwnProperty('output_message')) {
            this.cfg.output_message = false;
        }
    }

    hasDepth() {
        return this.asks.length > 0 && this.bids.length;
    }

    hasDeals() {
        return this.deals.length > 0;
    }

    //------------------------------------------------------------------------------
    // 需要重载的接口

    _onDepth() {
        if (this.cfg.funcOnDepth) {
            this.cfg.funcOnDepth();
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

    _onDeals() {
        if (this.deals.length > this.cfg.maxdeals) {
            this.deals.splice(0, Math.floor(this.cfg.maxdeals / 2));
        }

        if (this.deals.length > 0) {
            this.lastPrice = this.deals[this.deals.length - 1][DEALSINDEX.PRICE];
        }

        if (this.cfg.funcOnDeals) {
            this.cfg.funcOnDeals();
        }

        if (this.strategy != undefined) {
            if (this.cfg.simtrade) {
                this.strategy.onSimDeals(this.market);
            }
            else {
                this.strategy.onDeals(this.market);
            }
        }
    }
};

exports.DataStream = DataStream;

exports.DEPTHINDEX      = DEPTHINDEX;
exports.DEALSINDEX      = DEALSINDEX;
exports.DEALTYPE        = DEALTYPE;