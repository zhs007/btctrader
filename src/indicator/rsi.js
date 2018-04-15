"use strict";

const { DEALSINDEX } = require('../basedef');
const { Indicator_avg, INDICATORAVGCACHEINDEX, INDICATORDEALVALTYPE } = require('./indicator');

const INDICATORCACHEINDEX_RSI = {
    PRICE:  1,
    CUR_U:  2,
    CUR_D:  3,
    SMMA_U: 4,
    SMMA_D: 5,
};

//!! https://en.wikipedia.org/wiki/Relative_strength_index

function onDeals_indicator_rsi(ftms, curdeal, lstcache, avgtimes, valtype) {
    let cci = lstcache.length - 1;
    let curcache = lstcache[cci];

    if (curcache.length == 1) {
        curcache.push(curdeal[DEALSINDEX.PRICE]);
        curcache.push(0);
        curcache.push(0);
        curcache.push(null);
        curcache.push(null);
    }
    else {
        curcache[INDICATORCACHEINDEX_RSI.PRICE] = curdeal[DEALSINDEX.PRICE];
    }

    if (lstcache.length < 2) {
        return undefined;
    }

    let lastcache = lstcache[lstcache.length - 2];
    if (curcache[INDICATORCACHEINDEX_RSI.PRICE] > lastcache[INDICATORCACHEINDEX_RSI.PRICE]) {
        curcache[INDICATORCACHEINDEX_RSI.CUR_U] = curcache[INDICATORCACHEINDEX_RSI.PRICE] - lastcache[INDICATORCACHEINDEX_RSI.PRICE];
        curcache[INDICATORCACHEINDEX_RSI.CUR_D] = 0;
    }
    else {
        curcache[INDICATORCACHEINDEX_RSI.CUR_D] = curcache[INDICATORCACHEINDEX_RSI.PRICE] - lastcache[INDICATORCACHEINDEX_RSI.PRICE];
        curcache[INDICATORCACHEINDEX_RSI.CUR_U] = 0;
    }

    if (lstcache.length < avgtimes) {
        return undefined;
    }

    if (avgtimes == 1) {
        curcache[INDICATORCACHEINDEX_RSI.SMMA_U] = curcache[INDICATORCACHEINDEX_RSI.CUR_U];
        curcache[INDICATORCACHEINDEX_RSI.SMMA_D] = curcache[INDICATORCACHEINDEX_RSI.CUR_D];

        if (curcache[INDICATORCACHEINDEX_RSI.SMMA_D] == 0) {
            return 100;
        }

        return 100 - 100 / (1 + curcache[INDICATORCACHEINDEX_RSI.SMMA_U] / curcache[INDICATORCACHEINDEX_RSI.SMMA_D]);
    }

    if (lastcache[INDICATORCACHEINDEX_RSI.SMMA_U] == null || lastcache[INDICATORCACHEINDEX_RSI.SMMA_D] == null) {
        let tu = 0, td = 0;
        for (let i = 0; i < avgtimes; ++i) {
            tu += lstcache[lstcache.length - 1 - i][INDICATORCACHEINDEX_RSI.CUR_U];
            td += lstcache[lstcache.length - 1 - i][INDICATORCACHEINDEX_RSI.CUR_D];
        }

        curcache[INDICATORCACHEINDEX_RSI.SMMA_U] = tu / avgtimes;
        curcache[INDICATORCACHEINDEX_RSI.SMMA_D] = td / avgtimes;

        if (curcache[INDICATORCACHEINDEX_RSI.SMMA_D] == 0) {
            return 100;
        }

        return 100 - 100 / (1 + curcache[INDICATORCACHEINDEX_RSI.SMMA_U] / curcache[INDICATORCACHEINDEX_RSI.SMMA_D]);
    }

    curcache[INDICATORCACHEINDEX_RSI.SMMA_U] = ((avgtimes - 1) * lastcache[INDICATORCACHEINDEX_RSI.SMMA_U] + curcache[INDICATORCACHEINDEX_RSI.CUR_U]) / avgtimes;
    curcache[INDICATORCACHEINDEX_RSI.SMMA_D] = ((avgtimes - 1) * lastcache[INDICATORCACHEINDEX_RSI.SMMA_D] + curcache[INDICATORCACHEINDEX_RSI.CUR_D]) / avgtimes;

    if (curcache[INDICATORCACHEINDEX_RSI.SMMA_D] == 0) {
        return 100;
    }

    return 100 - 100 / (1 + curcache[INDICATORCACHEINDEX_RSI.SMMA_U] / curcache[INDICATORCACHEINDEX_RSI.SMMA_D]);
}

function newIndicator_rsi(offtms, avgtimes) {
    return new Indicator_avg(offtms, avgtimes, onDeals_indicator_rsi);
}

exports.onDeals_indicator_rsi = onDeals_indicator_rsi;
exports.INDICATORCACHEINDEX_RSI = INDICATORCACHEINDEX_RSI;

exports.newIndicator_rsi = newIndicator_rsi;