"use strict";

const { DEALSINDEX } = require('../basedef');
const { Indicator_avg, INDICATORAVGCACHEINDEX, INDICATORDEALVALTYPE } = require('./indicator');
const { INDICATOR_COUPLING } = require('./indicatordef');
const IndicatyorMgr = require('./indicatormgr');

const INDICATORCACHEINDEX_COUPLING = {
    PRICE0: 1,
    PRICE1: 2,
    MAX_U:  3,
    MAX_D:  4,
    SMMA_O: 5
};

function onDeal2_indicator_coupling(ftms, curdeal0, curdeal1, lstcache, avgtimes, valtype) {
    let cci = lstcache.length - 1;
    let curcache = lstcache[cci];

    if (curcache.length == 1) {
        curcache.push(curdeal0[DEALSINDEX.PRICE]);
        curcache.push(curdeal1[DEALSINDEX.PRICE]);
        curcache.push(0);
        curcache.push(0);
        curcache.push(null);
    }
    else {
        curcache[INDICATORCACHEINDEX_COUPLING.PRICE0] = curdeal0[DEALSINDEX.PRICE];
        curcache[INDICATORCACHEINDEX_COUPLING.PRICE1] = curdeal1[DEALSINDEX.PRICE];
    }

    let co = curcache[INDICATORCACHEINDEX_COUPLING.PRICE1] - curcache[INDICATORCACHEINDEX_COUPLING.PRICE0];
    if (co > curcache[INDICATORCACHEINDEX_COUPLING.MAX_U]) {
        curcache[INDICATORCACHEINDEX_COUPLING.MAX_U] = co;
    }
    if (co < curcache[INDICATORCACHEINDEX_COUPLING.MAX_D]) {
        curcache[INDICATORCACHEINDEX_COUPLING.MAX_D] = co;
    }

    if (lstcache.length < avgtimes) {
        return undefined;
    }

    if (avgtimes == 1) {
        return curcache[INDICATORCACHEINDEX_COUPLING.MAX_U] - curcache[INDICATORCACHEINDEX_COUPLING.MAX_D];
    }

    let lastcache = lstcache[lstcache.length - 2];
    if (lastcache[INDICATORCACHEINDEX_COUPLING.SMMA_O] == null) {
        let tp = 0;
        for (let i = 0; i < avgtimes; ++i) {
            tp += lstcache[lstcache.length - 1 - i][INDICATORCACHEINDEX_COUPLING.MAX_U] - lstcache[lstcache.length - 1 - i][INDICATORCACHEINDEX_COUPLING.MAX_D]
        }

        curcache[INDICATORCACHEINDEX_COUPLING.SMMA_O] = tp / avgtimes;
        return curcache[INDICATORCACHEINDEX_COUPLING.SMMA_O];
    }

    curcache[INDICATORCACHEINDEX_COUPLING.SMMA_O] = lastcache[INDICATORCACHEINDEX_COUPLING.SMMA_O] +
        (curcache[INDICATORCACHEINDEX_COUPLING.MAX_U] - curcache[INDICATORCACHEINDEX_COUPLING.MAX_D]) / avgtimes -
        (lstcache[lstcache.length - 1 - avgtimes][INDICATORCACHEINDEX_COUPLING.MAX_U] - lstcache[lstcache.length - 1 - avgtimes][INDICATORCACHEINDEX_COUPLING.MAX_D]) / avgtimes;
    return curcache[INDICATORCACHEINDEX_COUPLING.SMMA_O];
}

// function newIndicator_coupling(offtms, avgtimes) {
//     return new Indicator_avg(offtms, avgtimes, onDeals_indicator_coupling);
// }

exports.onDeal2_indicator_coupling = onDeal2_indicator_coupling;
exports.INDICATORCACHEINDEX_COUPLING = INDICATORCACHEINDEX_COUPLING;

// exports.newIndicator_coupling = newIndicator_coupling;

IndicatyorMgr.singleton.regIndicator(INDICATOR_COUPLING, (offtms, avgtimes) => {
    return new Indicator_avg(offtms, avgtimes, undefined, onDeal2_indicator_coupling);
});