"use strict";

const { DEALSINDEX } = require('../basedef');
const { Indicator_avg, INDICATORAVGCACHEINDEX, INDICATORDEALVALTYPE } = require('./indicator');
const { INDICATOR_COUPLING } = require('./indicatordef');
const IndicatyorMgr = require('./indicatormgr');

const INDICATORCACHEINDEX_COUPLING = {
    PRICE:  1,
    SMA:    2
};

function onDeals_indicator_coupling(ftms, curdeal, lstcache, avgtimes, valtype) {
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

// function newIndicator_coupling(offtms, avgtimes) {
//     return new Indicator_avg(offtms, avgtimes, onDeals_indicator_coupling);
// }

exports.onDeals_indicator_coupling = onDeals_indicator_coupling;
exports.INDICATORCACHEINDEX_COUPLING = INDICATORCACHEINDEX_COUPLING;

// exports.newIndicator_coupling = newIndicator_coupling;

IndicatyorMgr.singleton.regIndicator(INDICATOR_COUPLING, (offtms, avgtimes) => {
    return new Indicator_avg(offtms, avgtimes, onDeals_indicator_coupling);
});