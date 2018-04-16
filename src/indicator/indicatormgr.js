"use strict";

class IndicatyorMgr {
    constructor() {
        this.lstFuncNew = {};
    }

    regIndicator(type, funcnew) {
        this.lstFuncNew[type] = funcnew;
    }

    newIndicator(type, offtms, avgtimes) {
        if (this.lstFuncNew.hasOwnProperty(type)) {
            return this.lstFuncNew[type](offtms, avgtimes);
        }

        return undefined;
    }
};

exports.singleton = new IndicatyorMgr();