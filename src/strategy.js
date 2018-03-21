"use strict";

class Strategy {
    constructor() {
        this.trader = undefined;
        this.simid = 0;
    }

    onDepth(market) {

    }

    onDeals(market, newnums) {

    }

    onSimDepth(market) {

    }

    onSimDeals(market, newnums) {

    }

    onUnsoldTrade(trade) {

    }

    onOpenTrade(trade) {

    }
};

exports.Strategy = Strategy;