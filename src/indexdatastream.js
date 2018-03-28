"use strict";

const { DataStream } = require('./datastream');
const { DEPTHINDEX, DEALSINDEX, DEALTYPE } = require('./basedef');
const rp = require('request-promise-native');

// 指数
class IndexDataStream extends DataStream {
    constructor(cfg, lstds) {
        cfg.onlycandleinfo = true;

        super(cfg);

        this.lstds = lstds;

        this.curDealsIndex = 0;
    }

    init() {
        for (let i = 0; i < this.lstds.length; ++i) {
            this.lstds[i].funcOnDeals = (newnums) => {
                this._onChildDeals(newnums);
            };

            this.lstds[i].funcOnDepth = () => {
                this._onChildDepth();
            };

            this.lstds[i].init();
        }
    }

    _onChildDepth() {

    }

    _onChildDeals(newnums) {
        let tp = 0;
        let tv = 0;
        let ctms = 0;
        let type = DEALTYPE.BUY;

        for (let i = 0; i < this.lstds.length; ++i) {
            let ds = this.lstds[i];
            if (ds.deals.length <= 0) {
                return ;
            }

            let p = ds.deals[ds.deals.length - 1][DEALSINDEX.PRICE];
            let v = ds.deals[ds.deals.length - 1][DEALSINDEX.VOLUME];

            if (ds.deals[ds.deals.length - 1][DEALSINDEX.TMS] > ctms) {
                ctms = ds.deals[ds.deals.length - 1][DEALSINDEX.TMS];
                type = ds.deals[ds.deals.length - 1][DEALSINDEX.TYPE];
            }

            tp += p;
            tv += v;
        }

        this.deals.push([
            ++this.curDealsIndex,
            tp / this.lstds.length,
            tv / this.lstds.length,
            ctms,
            type
        ]);

        this._onDeals(1);
    }
};

exports.IndexDataStream = IndexDataStream;