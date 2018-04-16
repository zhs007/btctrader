"use strict";

const { DEALSINDEX } = require('../basedef');
const { Indicator_avg, INDICATORAVGCACHEINDEX, INDICATORDEALVALTYPE } = require('./indicator');
const { INDICATOR_AROON } = require('./indicatordef');
const IndicatyorMgr = require('./indicatormgr');

const INDICATORCACHEINDEX_AROON = {
    PRICE:      1,
    AROON_D:    2,
    AROON_U:    3,
};

function onDeal_indicator_aroon(ftms, curdeal, lstcache, avgtimes, valtype) {
    let cci = lstcache.length - 1;
    let curcache = lstcache[cci];

    if (curcache.length == 1) {
        curcache.push(curdeal[DEALSINDEX.PRICE]);
        curcache.push(curdeal[DEALSINDEX.PRICE]);
        curcache.push(null);
        curcache.push(null);
    }
    else {
        curcache[INDICATORCACHEINDEX_AROON.PRICE] = curdeal[DEALSINDEX.PRICE];
    }

    if (lstcache.length < avgtimes) {
        return undefined;
    }

    if (avgtimes == 1) {
        return [0, 0, 0];
    }

    let soff = lstcache.length - avgtimes;
    let maxc = undefined;
    let minc = undefined;
    for (let i = 0; i < avgtimes; ++i) {
        let cc = lstcache[soff + i];

        if (maxc == undefined) {
            maxc = cc;
        }
        else {
            if (cc[INDICATORCACHEINDEX_AROON.PRICE] > maxc[INDICATORCACHEINDEX_AROON.PRICE]) {
                maxc = cc;
            }
        }

        if (minc == undefined) {
            minc = cc;
        }
        else {
            if (cc[INDICATORCACHEINDEX_AROON.PRICE] < maxc[INDICATORCACHEINDEX_AROON.PRICE]) {
                minc = cc;
            }
        }
    }

    let maxi = maxc[INDICATORAVGCACHEINDEX.FORMAT_TMS] - lstcache[soff][INDICATORAVGCACHEINDEX.FORMAT_TMS];
    let mini = minc[INDICATORAVGCACHEINDEX.FORMAT_TMS] - lstcache[soff][INDICATORAVGCACHEINDEX.FORMAT_TMS];
    curcache[INDICATORCACHEINDEX_AROON.AROON_U] = maxi / avgtimes * 100;
    curcache[INDICATORCACHEINDEX_AROON.AROON_D] = mini / avgtimes * 100;

    return [curcache[INDICATORCACHEINDEX_AROON.AROON_U], curcache[INDICATORCACHEINDEX_AROON.AROON_D], curcache[INDICATORCACHEINDEX_AROON.AROON_U] - curcache[INDICATORCACHEINDEX_AROON.AROON_D]];
}

// function newIndicator_sma(offtms, avgtimes) {
//     return new Indicator_avg(offtms, avgtimes, onDeals_indicator_sma);
// }

exports.onDeal_indicator_aroon = onDeal_indicator_aroon;
exports.INDICATORCACHEINDEX_AROON = INDICATORCACHEINDEX_AROON;

// exports.newIndicator_sma = newIndicator_sma;

IndicatyorMgr.singleton.regIndicator(INDICATOR_AROON, (offtms, avgtimes) => {
    return new Indicator_avg(offtms, 3, avgtimes, onDeal_indicator_aroon);
});