"use strict";

const { DEALSINDEX } = require('../basedef');

const INDICATORINDEX = {
    FORMAT_TMS: 0,
    VAL:        1
};

const INDICATORDEALVALTYPE = {
    CLOSE:          0,
    OPEN:           1,
    LOW:            2,
    HIGH:           3,
    AVG_CLOSEOPEN:  4,
    AVG_HIGHLOW:    5,
    AVG_OCHL:       6
};

class Indicator {
    constructor(offtms) {
        this.lstData = [];
        this.offtms = offtms;

        this.valType = INDICATORDEALVALTYPE.CLOSE;
        this.limitNums = 60 * 24;

        this.lastdeal = undefined;
    }

    onDeal_indicator(deal) {
        let tms = deal[DEALSINDEX.TMS];
        let ftms = tms / this.offtms;

        if (this.lstData.length > 0) {
            if (this.lastdeal == undefined) {
                //!! ERROR
                this.resetIndicator();
            }
            else {
                let cd = this.lstData[this.lstData.length - 1];
                if (cd[INDICATORINDEX.FORMAT_TMS] < ftms) {
                    for (let i = cd[INDICATORINDEX.FORMAT_TMS] + 1; i < ftms; ++i) {
                        this._onDeal_indicator(i, this.lastdeal);
                    }
                }
            }
        }

        this._onDeal_indicator(ftms, deal);
        this.lastdeal = deal;

        if (this.lstData.length > this.limitNums * 2) {
            this.onGC();
        }
    }

    onGC() {
        this.lstData.splice(0, this.limitNums);
    }

    // serialization
    _onDeal_indicator(ftms, deal) {

    }

    resetIndicator() {
        this.lstData = [];
        this.lastdeal = undefined;
    }

    _getData(ftms) {
        if (this.lstData.length <= 0) {
            this.lstData.push([ftms, null]);
            return this.lstData[0];
        }

        let cd = this.lstData[this.lstData.length - 1];
        if (cd[INDICATORINDEX.FORMAT_TMS] == ftms) {
            return cd;
        }

        if (cd[INDICATORINDEX.FORMAT_TMS] < ftms) {
            for (let i = cd[INDICATORINDEX.FORMAT_TMS] + 1; i <= ftms; ++i) {
                this.lstData.push([i, cd[INDICATORINDEX.VAL]]);
            }

            return this.lstData[this.lstData.length - 1];
        }

        let ci = this.lstData.length - (cd[INDICATORINDEX.FORMAT_TMS] - ftms);
        if (ci < 0) {
            return undefined;
        }

        return this.lstData[ci];
    }
};

const INDICATORAVGCACHEINDEX = {
    FORMAT_TMS: 0,
};

class Indicator_avg extends Indicator {
    constructor(offtms, avgtimes, funcOnDeals) {
        super(offtms);

        this.avgtimes = avgtimes;
        this.lstCache = [];

        this.funcOnDeals = funcOnDeals;
    }

    resetIndicator() {
        super.resetIndicator();

        this.lstCache = [];
    }

    onGC() {
        super.onGC();

        // !!
        // this.avgtimes is need less then this.limitNums
        this.lstCache.splice(0, this.limitNums);
    }

    // serialization
    _onDeal_indicator(ftms, deal) {
        if (this.lstCache.length <= 0) {
            this.lstCache.push([ftms]);
        }
        else {
            let curcache = this.lstCache[this.lstCache.length - 1];
            if (curcache[INDICATORAVGCACHEINDEX.FORMAT_TMS] != ftms) {
                this.lstCache.push([ftms]);
            }
        }

        let retv = this.funcOnDeals(ftms, deal, this.lstCache, this.avgtimes, this.valType);
        if (retv != undefined) {
            let cd = this._getData(ftms);
            cd[INDICATORINDEX.VAL] = retv;
        }
    }
};

exports.Indicator = Indicator;
exports.INDICATORINDEX = INDICATORINDEX;
exports.INDICATORDEALVALTYPE = INDICATORDEALVALTYPE;
exports.Indicator_avg = Indicator_avg;
exports.INDICATORAVGCACHEINDEX = INDICATORAVGCACHEINDEX;