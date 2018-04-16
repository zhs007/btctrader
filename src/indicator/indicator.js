"use strict";

const { DEALSINDEX } = require('../basedef');

const INDICATORINDEX = {
    FORMAT_TMS: 0,
    VAL:        1,
    VAL0:       1,
    VAL1:       2,
    VAL2:       3,
    VAL3:       4,
    VAL4:       5,
    VAL5:       6,
    VAL6:       7,
    VAL7:       8,
    VAL8:       9,
    VAL9:       10,
    VAL10:      11,
    VAL11:      12,
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
    constructor(offtms, valnums) {
        this.lstData = [];
        this.offtms = offtms;
        this.valnums = valnums;

        this.valType = INDICATORDEALVALTYPE.CLOSE;
        this.limitNums = 60 * 24;

        this.lastdeal = undefined;

        this.lastdeal0 = undefined;
        this.lastdeal1 = undefined;
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

    onDeal2_indicator(deal0, deal1) {
        let tms0 = deal0[DEALSINDEX.TMS];
        let tms1 = deal1[DEALSINDEX.TMS];
        let tms = tms0 > tms1 ? tms0 : tms1;
        let ftms = tms / this.offtms;

        if (this.lstData.length > 0) {
            if (this.lastdeal0 == undefined) {
                //!! ERROR
                this.resetIndicator();
            }
            else {
                let cd = this.lstData[this.lstData.length - 1];
                if (cd[INDICATORINDEX.FORMAT_TMS] < ftms) {
                    for (let i = cd[INDICATORINDEX.FORMAT_TMS] + 1; i < ftms; ++i) {
                        this._onDeal2_indicator(i, this.lastdeal0, this.lastdeal1);
                    }
                }
            }
        }

        this._onDeal2_indicator(ftms, deal0, deal1);
        this.lastdeal0 = deal0;
        this.lastdeal1 = deal1;

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

    // serialization
    _onDeal2_indicator(ftms, deal0, deal1) {

    }

    resetIndicator() {
        this.lstData = [];
        this.lastdeal = undefined;

        this.lastdeal0 = undefined;
        this.lastdeal1 = undefined;
    }

    _getData(ftms) {
        if (this.lstData.length <= 0) {
            let cd = [ftms];
            for (let i = 0; i < this.valnums; ++i) {
                cd.push(null);
            }
            this.lstData.push(cd);

            return this.lstData[0];
        }

        let cd = this.lstData[this.lstData.length - 1];
        if (cd[INDICATORINDEX.FORMAT_TMS] == ftms) {
            return cd;
        }

        if (cd[INDICATORINDEX.FORMAT_TMS] < ftms) {
            for (let i = cd[INDICATORINDEX.FORMAT_TMS] + 1; i <= ftms; ++i) {
                let lcd = [ftms];
                for (let i = 0; i < this.valnums; ++i) {
                    lcd.push(cd[INDICATORINDEX.VAL0 + i]);
                }

                this.lstData.push(lcd);
            }

            return this.lstData[this.lstData.length - 1];
        }

        let ci = this.lstData.length - (cd[INDICATORINDEX.FORMAT_TMS] - ftms);
        if (ci < 0) {
            return undefined;
        }

        return this.lstData[ci];
    }

    getLastVal() {
        if (this.lstData.length > 0) {
            return this.lstData[this.lstData.length - 1];
        }

        return undefined;
    }
};

const INDICATORAVGCACHEINDEX = {
    FORMAT_TMS: 0,
};

class Indicator_avg extends Indicator {
    constructor(offtms, valnums, avgtimes, funcOnDeal, funcOnDeal2) {
        super(offtms, valnums);

        this.avgtimes = avgtimes;
        this.lstCache = [];

        this.funcOnDeal = funcOnDeal;
        this.funcOnDeal2 = funcOnDeal2;
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

        let retv = this.funcOnDeal(ftms, deal, this.lstCache, this.avgtimes, this.valType);
        if (retv != undefined) {
            if (this.valnums > 1) {
                for (let i = 0; i < this.valnums; ++i) {
                    let cd = this._getData(ftms);
                    cd[INDICATORINDEX.VAL0 + i] = retv[i];
                }
            }
            else {
                let cd = this._getData(ftms);
                cd[INDICATORINDEX.VAL] = retv;
            }
        }
    }

    // serialization
    _onDeal2_indicator(ftms, deal0, deal1) {
        if (this.lstCache.length <= 0) {
            this.lstCache.push([ftms]);
        }
        else {
            let curcache = this.lstCache[this.lstCache.length - 1];
            if (curcache[INDICATORAVGCACHEINDEX.FORMAT_TMS] != ftms) {
                this.lstCache.push([ftms]);
            }
        }

        let retv = this.funcOnDeal2(ftms, deal0, deal1, this.lstCache, this.avgtimes, this.valType);
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