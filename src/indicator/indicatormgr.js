"use strict";

class IndicatyorMgr {
    constructor() {
        this.lstFuncNew = {};
    }

    regIndicator(type, funcnew) {
        this.lstFuncNew[type] = funcnew;
    }

};

exports.singleton = new IndicatyorMgr();