"use strict";

const { DEALSINDEX } = require('../basedef');
const { Indicator_avg, INDICATORAVGCACHEINDEX, INDICATORDEALVALTYPE } = require('./indicator');

const INDICATORCACHEINDEX_WMA = {
    PRICE:          1,
    TOTAL:          2,
    NUMERATOR:      3,
    DENOMINATOR:    4,
};

//!! https://en.wikipedia.org/wiki/Moving_average

function onDeals_indicator_wma(ftms, curdeal, lstcache, avgtimes, valtype) {
    let cci = lstcache.length - 1;
    let curcache = lstcache[cci];

    if (curcache.length == 1) {
        curcache.push(curdeal[DEALSINDEX.PRICE]);
        curcache.push(null);
        curcache.push(null);
        curcache.push(null);
    }
    else {
        curcache[INDICATORCACHEINDEX_WMA.PRICE] = curdeal[DEALSINDEX.PRICE];
    }

    if (lstcache.length < avgtimes) {
        return undefined;
    }

    if (avgtimes == 1) {
        return curcache[INDICATORCACHEINDEX_WMA.PRICE];
    }

    let lastcache = lstcache[lstcache.length - 2];
    if (lastcache[INDICATORCACHEINDEX_WMA.NUMERATOR] == null) {
        let tp = 0;
        let tn = 0;
        for (let i = 0; i < avgtimes; ++i) {
            tp += lstcache[lstcache.length - 1 - i][INDICATORCACHEINDEX_WMA.PRICE];
            tn += lstcache[lstcache.length - 1 - i][INDICATORCACHEINDEX_WMA.PRICE] * (avgtimes - i);
        }

        curcache[INDICATORCACHEINDEX_WMA.TOTAL] = tp;
        curcache[INDICATORCACHEINDEX_WMA.NUMERATOR] = tn;
        curcache[INDICATORCACHEINDEX_WMA.DENOMINATOR] = avgtimes * (avgtimes + 1) / 2;

        return curcache[INDICATORCACHEINDEX_WMA.NUMERATOR] / curcache[INDICATORCACHEINDEX_WMA.DENOMINATOR];
    }

    curcache[INDICATORCACHEINDEX_WMA.TOTAL] = lastcache[INDICATORCACHEINDEX_WMA.TOTAL] + curcache[INDICATORCACHEINDEX_WMA.PRICE] - lstcache[lstcache.length - 1 - avgtimes][INDICATORCACHEINDEX_WMA.PRICE];
    curcache[INDICATORCACHEINDEX_WMA.NUMERATOR] = lastcache[INDICATORCACHEINDEX_WMA.NUMERATOR] + avgtimes * curcache[INDICATORCACHEINDEX_WMA.PRICE] - lstcache[INDICATORCACHEINDEX_WMA.TOTAL];
    curcache[INDICATORCACHEINDEX_WMA.DENOMINATOR] = lastcache[INDICATORCACHEINDEX_WMA.DENOMINATOR];

    return curcache[INDICATORCACHEINDEX_WMA.NUMERATOR] / curcache[INDICATORCACHEINDEX_WMA.DENOMINATOR];
}

function newIndicator_wma(offtms, avgtimes) {
    return new Indicator_avg(offtms, avgtimes, onDeals_indicator_wma);
}

exports.onDeals_indicator_wma = onDeals_indicator_wma;
exports.INDICATORCACHEINDEX_WMA = INDICATORCACHEINDEX_WMA;

exports.newIndicator_wma = newIndicator_wma;