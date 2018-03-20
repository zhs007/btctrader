"use strict";

const { DEPTHINDEX, DEALTYPE, DEALSINDEX } = require('../basedef');

const MAX_ONDEALS_NUMS = 512;

class DealAndDepth{
    constructor() {
        this.lstData = [];
    }

    onDeals(mgrData, tname, cdi, cask, cbid) {
        let cn = {
            type: cdi[DEALSINDEX.TYPE],
            price: cdi[DEALSINDEX.PRICE],
            volume: cdi[DEALSINDEX.VOLUME],
            askprice: cask[DEPTHINDEX.PRICE],
            askvolume: cask[DEPTHINDEX.VOLUME],
            bidprice: cbid[DEPTHINDEX.PRICE],
            bidvolume: cbid[DEPTHINDEX.VOLUME],
            ts: new Date(cdi[DEALSINDEX.TMS]).toISOString(),
            tsms: cdi[DEALSINDEX.TMS]
        };

        this.lstData.push(cn);

        if (this.lstData.length > MAX_ONDEALS_NUMS) {
            this.lstData.splice(0, Math.floor(MAX_ONDEALS_NUMS / 2));
        }
    }
};

exports.DealAndDepth = DealAndDepth;

