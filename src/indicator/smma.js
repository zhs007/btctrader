"use strict";

const { DEALSINDEX } = require('../basedef');
const { Indicator_avg, INDICATORAVGCACHEINDEX, INDICATORDEALVALTYPE } = require('./indicator');
const { INDICATOR_SMMA } = require('./indicatordef');
const IndicatyorMgr = require('./indicatormgr');

const INDICATORCACHEINDEX_SMMA = {
    PRICE:  1,
    SMMA:   2,
};

//!! https://en.wikipedia.org/wiki/Moving_average#Modified_moving_average

function onDeals_indicator_smma(ftms, curdeal, lstcache, avgtimes, valtype) {
    let cci = lstcache.length - 1;
    let curcache = lstcache[cci];

    if (curcache.length == 1) {
        curcache.push(curdeal[DEALSINDEX.PRICE]);
        curcache.push(null);
    }
    else {
        curcache[INDICATORCACHEINDEX_SMMA.PRICE] = curdeal[DEALSINDEX.PRICE];
    }

    if (lstcache.length < avgtimes) {
        return undefined;
    }

    if (avgtimes == 1) {
        return curcache[INDICATORCACHEINDEX_SMMA.PRICE];
    }

    let lastcache = lstcache[lstcache.length - 2];
    if (lastcache[INDICATORCACHEINDEX_SMMA.SMMA] == null) {
        let tp = 0;
        for (let i = 0; i < avgtimes; ++i) {
            tp += lstcache[lstcache.length - 1 - i][INDICATORCACHEINDEX_SMMA.PRICE];
        }

        curcache[INDICATORCACHEINDEX_SMMA.SMMA] = tp / avgtimes;
        return curcache[INDICATORCACHEINDEX_SMMA.SMMA];
    }

    curcache[INDICATORCACHEINDEX_SMMA.SMMA] = ((avgtimes - 1) * lastcache[INDICATORCACHEINDEX_SMMA.SMMA] + curcache[INDICATORCACHEINDEX_SMMA.PRICE]) / avgtimes;
    return curcache[INDICATORCACHEINDEX_SMMA.SMMA];
}

// function newIndicator_smma(offtms, avgtimes) {
//     return new Indicator_avg(offtms, avgtimes, onDeals_indicator_smma);
// }

exports.onDeals_indicator_smma = onDeals_indicator_smma;
exports.INDICATORCACHEINDEX_SMMA = INDICATORCACHEINDEX_SMMA;

// exports.newIndicator_smma = newIndicator_smma;

IndicatyorMgr.singleton.regIndicator(INDICATOR_SMMA, (offtms, avgtimes) => {
    return new Indicator_avg(offtms, avgtimes, onDeals_indicator_smma);
});