"use strict";

const { DEALSINDEX } = require('../basedef');
const { Indicator_avg, INDICATORAVGCACHEINDEX, INDICATORDEALVALTYPE } = require('./indicator');
const { INDICATOR_COUNTBACKLINE } = require('./indicatordef');
const IndicatyorMgr = require('./indicatormgr');

const INDICATORCACHEINDEX_COUNTBACKLINE = {
    PRICE_H:    1,
    PRICE_L:    2,
    POFF_H:     3,
    POFF_L:     4,
    CBL_D:      5,
    CBL_U:      6,
};

function onDeal_indicator_countbackline(ftms, curdeal, lstcache, avgtimes, valtype) {
    let cci = lstcache.length - 1;
    let curcache = lstcache[cci];

    if (curcache.length == 1) {
        curcache.push(curdeal[DEALSINDEX.PRICE]);
        curcache.push(curdeal[DEALSINDEX.PRICE]);
        curcache.push(0);
        curcache.push(0);
        curcache.push(null);
        curcache.push(null);
    }
    else {
        if (curdeal[DEALSINDEX.PRICE] > curcache[INDICATORCACHEINDEX_COUNTBACKLINE.PRICE_H]) {
            curcache[INDICATORCACHEINDEX_COUNTBACKLINE.PRICE_H] = curdeal[DEALSINDEX.PRICE];
        }

        if (curdeal[DEALSINDEX.PRICE] < curcache[INDICATORCACHEINDEX_COUNTBACKLINE.PRICE_L]) {
            curcache[INDICATORCACHEINDEX_COUNTBACKLINE.PRICE_L] = curdeal[DEALSINDEX.PRICE];
        }
    }

    if (lstcache.length <= 1) {
        return undefined;
    }

    let lastcache = lstcache[lstcache.length - 2];

    curcache[INDICATORCACHEINDEX_COUNTBACKLINE.POFF_H] = curcache[INDICATORCACHEINDEX_COUNTBACKLINE.PRICE_H] - lastcache[INDICATORCACHEINDEX_COUNTBACKLINE.PRICE_H];
    curcache[INDICATORCACHEINDEX_COUNTBACKLINE.POFF_L] = curcache[INDICATORCACHEINDEX_COUNTBACKLINE.PRICE_L] - lastcache[INDICATORCACHEINDEX_COUNTBACKLINE.PRICE_L];

    if (lstcache.length < avgtimes) {
        return undefined;
    }

    if (avgtimes == 1) {
        return undefined;
    }

    if (curcache[INDICATORCACHEINDEX_COUNTBACKLINE.POFF_H] > 0 && lastcache[INDICATORCACHEINDEX_COUNTBACKLINE.POFF_H] < 0) {
        let ccn = undefined;
        let ci = 1;
        for (let i = 0; i < lstcache.length - 2; ++i) {
            let cc = lstcache[lstcache.length - 3 - i];
            if (cc[INDICATORCACHEINDEX_COUNTBACKLINE.POFF_H] >= 0) {
                break;
            }

            if (ccn == undefined) {
                if (cc[INDICATORCACHEINDEX_COUNTBACKLINE.PRICE_H] > curcache[INDICATORCACHEINDEX_COUNTBACKLINE.PRICE_H]) {
                    ccn = cc;
                    ++ci;
                }
            }
            else {
                if (cc[INDICATORCACHEINDEX_COUNTBACKLINE.PRICE_H] > ccn[INDICATORCACHEINDEX_COUNTBACKLINE.PRICE_H]) {
                    ccn = cc;
                    ++ci;
                }
            }

            if (ci >= avgtimes) {
                break;
            }
        }

        if (ccn != undefined && ci >= avgtimes) {
            curcache[INDICATORCACHEINDEX_COUNTBACKLINE.CBL_U] = ccn[INDICATORCACHEINDEX_COUNTBACKLINE.PRICE_H];
        }
    }

    if (curcache[INDICATORCACHEINDEX_COUNTBACKLINE.POFF_L] < 0 && lastcache[INDICATORCACHEINDEX_COUNTBACKLINE.POFF_L] > 0) {
        let ccn = undefined;
        let ci = 1;
        for (let i = 0; i < lstcache.length - 2; ++i) {
            let cc = lstcache[lstcache.length - 3 - i];
            if (cc[INDICATORCACHEINDEX_COUNTBACKLINE.POFF_L] <= 0) {
                break;
            }

            if (ccn == undefined) {
                if (cc[INDICATORCACHEINDEX_COUNTBACKLINE.PRICE_L] < curcache[INDICATORCACHEINDEX_COUNTBACKLINE.PRICE_L]) {
                    ccn = cc;
                    ++ci;
                }
            }
            else {
                if (cc[INDICATORCACHEINDEX_COUNTBACKLINE.PRICE_L] < ccn[INDICATORCACHEINDEX_COUNTBACKLINE.PRICE_L]) {
                    ccn = cc;
                    ++ci;
                }
            }

            if (ci >= avgtimes) {
                break;
            }
        }

        if (ccn != undefined && ci >= avgtimes) {
            curcache[INDICATORCACHEINDEX_COUNTBACKLINE.CBL_D] = ccn[INDICATORCACHEINDEX_COUNTBACKLINE.PRICE_L];
        }
    }

    return [curcache[INDICATORCACHEINDEX_COUNTBACKLINE.CBL_U], curcache[INDICATORCACHEINDEX_COUNTBACKLINE.CBL_D]];
}

// function newIndicator_sma(offtms, avgtimes) {
//     return new Indicator_avg(offtms, avgtimes, onDeals_indicator_sma);
// }

exports.onDeal_indicator_countbackline = onDeal_indicator_countbackline;
exports.INDICATORCACHEINDEX_COUNTBACKLINE = INDICATORCACHEINDEX_COUNTBACKLINE;

// exports.newIndicator_sma = newIndicator_sma;

IndicatyorMgr.singleton.regIndicator(INDICATOR_COUNTBACKLINE, (offtms, avgtimes) => {
    return new Indicator_avg(offtms, 2, avgtimes, onDeal_indicator_countbackline);
});