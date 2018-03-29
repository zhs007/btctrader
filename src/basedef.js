"use strict";

const DEPTHINDEX = {
    PRICE:      0,
    VOLUME:     1,
    ID:         2,  // only simtrade use
    LASTVOLUME: 3   // only simtrade use
};

const DEALSINDEX = {
    ID:         0,
    PRICE:      1,
    VOLUME:     2,
    TMS:        3,
    TYPE:       4
};

const DEALTYPE = {
    NULL:       0,
    BUY:        1,
    SELL:       2
};

const TRADETYPE = {
    BUY:    1,
    NORMAL: 0,
    SELL:   -1
};

const STRATEGYSTATE = {
    LONG:   1,
    NULL:   0,
    SHORT:  -1
};

const ORDERSIDE = {
    BUY:        1,
    SELL:       -1,
};

const ORDERTYPE = {
    LIMIT:   0,
    MARKET:  1,
};

const ORDERSTATE = {
    OPEN:       0,
    RUNNING:    1,
    CLOSE:      2,
};

exports.DEPTHINDEX      = DEPTHINDEX;
exports.DEALSINDEX      = DEALSINDEX;
exports.DEALTYPE        = DEALTYPE;
exports.TRADETYPE       = TRADETYPE;
exports.STRATEGYSTATE   = STRATEGYSTATE;

exports.ORDERSIDE       = ORDERSIDE;
exports.ORDERTYPE       = ORDERTYPE;
exports.ORDERSTATE      = ORDERSTATE;