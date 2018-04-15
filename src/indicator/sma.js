"use strict";

const { DEALSINDEX } = require('../basedef');
const { Indicator_avg, INDICATORAVGCACHEINDEX, INDICATORDEALVALTYPE } = require('./indicator');
const { INDICATOR_SMA } = require('./indicatordef');
const IndicatyorMgr = require('./indicatormgr');

const INDICATORCACHEINDEX_SMA = {
    PRICE:  1,
    SMA:    2
};

//!! https://en.wikipedia.org/wiki/Moving_average

function onDeal_indicator_sma(ftms, curdeal, lstcache, avgtimes, valtype) {
    let cci = lstcache.length - 1;
    let curcache = lstcache[cci];

    if (curcache.length == 1) {
        curcache.push(curdeal[DEALSINDEX.PRICE]);
        curcache.push(null);
    }
    else {
        curcache[INDICATORCACHEINDEX_SMA.PRICE] = curdeal[DEALSINDEX.PRICE];
    }

    if (lstcache.length < avgtimes) {
        return undefined;
    }

    if (avgtimes == 1) {
        return curcache[INDICATORCACHEINDEX_SMA.PRICE];
    }

    let lastcache = lstcache[lstcache.length - 2];
    if (lastcache[INDICATORCACHEINDEX_SMA.SMA] == null) {
        let tp = 0;
        for (let i = 0; i < avgtimes; ++i) {
            tp += lstcache[lstcache.length - 1 - i][INDICATORCACHEINDEX_SMA.PRICE];
        }

        curcache[INDICATORCACHEINDEX_SMA.SMA] = tp / avgtimes;
        return curcache[INDICATORCACHEINDEX_SMA.SMA];
    }

    curcache[INDICATORCACHEINDEX_SMA.SMA] = lastcache[INDICATORCACHEINDEX_SMA.SMA] + curdeal[DEALSINDEX.PRICE] / avgtimes - lstcache[lstcache.length - 1 - avgtimes][INDICATORCACHEINDEX_SMA.PRICE] / avgtimes;
    return curcache[INDICATORCACHEINDEX_SMA.SMA];
}

// function newIndicator_sma(offtms, avgtimes) {
//     return new Indicator_avg(offtms, avgtimes, onDeals_indicator_sma);
// }

exports.onDeal_indicator_sma = onDeal_indicator_sma;
exports.INDICATORCACHEINDEX_SMA = INDICATORCACHEINDEX_SMA;

// exports.newIndicator_sma = newIndicator_sma;

IndicatyorMgr.singleton.regIndicator(INDICATOR_SMA, (offtms, avgtimes) => {
    return new Indicator_avg(offtms, avgtimes, onDeal_indicator_sma);
});