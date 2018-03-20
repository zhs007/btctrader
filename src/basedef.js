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

exports.DEPTHINDEX      = DEPTHINDEX;
exports.DEALSINDEX      = DEALSINDEX;
exports.DEALTYPE        = DEALTYPE;
