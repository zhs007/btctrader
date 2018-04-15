"use strict";

const { DEALSINDEX } = require('../basedef');
const { Indicator_avg, INDICATORAVGCACHEINDEX, INDICATORDEALVALTYPE } = require('./indicator');

const INDICATORCACHEINDEX_EMA = {
    PRICE:          1,
    EMA:            2,
};

//!! https://en.wikipedia.org/wiki/Moving_average

function onDeals_indicator_ema(ftms, curdeal, lstcache, avgtimes, valtype) {
    let cci = lstcache.length - 1;
    let curcache = lstcache[cci];

    if (curcache.length == 1) {
        curcache.push(curdeal[DEALSINDEX.PRICE]);
        curcache.push(null);
        curcache.push(null);
    }
    else {
        curcache[INDICATORCACHEINDEX_EMA.PRICE] = curdeal[DEALSINDEX.PRICE];
    }

    if (lstcache.length < avgtimes) {
        return undefined;
    }

    if (avgtimes == 1) {
        return curcache[INDICATORCACHEINDEX_EMA.PRICE];
    }

    let lastcache = lstcache[lstcache.length - 2];
    if (lastcache[INDICATORCACHEINDEX_EMA.EMA] == null) {
        let tp = 0;
        for (let i = 0; i < avgtimes; ++i) {
            tp += lstcache[lstcache.length - 1 - i][INDICATORCACHEINDEX_EMA.PRICE];
        }

        curcache[INDICATORCACHEINDEX_EMA.EMA] = tp / avgtimes;
        return curcache[INDICATORCACHEINDEX_EMA.EMA];
        // let a1 = 1 - 2 / (avgtimes + 1);
        // let tp = 0;
        // let tn = 0;
        // for (let i = 0; i < avgtimes; ++i) {
        //     tp += lstcache[lstcache.length - 1 - i][INDICATORCACHEINDEX_EMA.PRICE] * Math.pow(a1, i);
        //     tn += Math.pow(a1, i);
        // }
        //
        // curcache[INDICATORCACHEINDEX_EMA.EMA] = tp / tn;
        //
        // return curcache[INDICATORCACHEINDEX_EMA.EMA];
    }

    curcache[INDICATORCACHEINDEX_EMA.EMA] = lastcache[INDICATORCACHEINDEX_EMA.EMA] + (curcache[INDICATORCACHEINDEX_EMA.PRICE] - lastcache[INDICATORCACHEINDEX_EMA.EMA]) * 2 / (avgtimes + 1);

    return curcache[INDICATORCACHEINDEX_EMA.EMA];
}

function newIndicator_ema(offtms, avgtimes) {
    return new Indicator_avg(offtms, avgtimes, onDeals_indicator_ema);
}

exports.onDeals_indicator_ema = onDeals_indicator_ema;
exports.INDICATORCACHEINDEX_EMA = INDICATORCACHEINDEX_EMA;

exports.newIndicator_ema = newIndicator_ema;