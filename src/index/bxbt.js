"use strict";

const bitstamp = require('../market/bitstamp/index');
const gdax = require('../market/gdax/index');
const { IndexDataStream } = require('../indexdatastream');

class BXBTDataStream extends IndexDataStream {
    constructor(cfg) {
        var ds0 = new bitstamp.DataStream({});
        var ds1 = new gdax.DataStream({});

        super(cfg, [ds0, ds1]);
    }
};

exports.BXBTDataStream = BXBTDataStream;