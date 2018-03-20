"use strict";

const { Mysql } = require('../mysql');
const { DataStream } = require('../datastream');
const { DEPTHINDEX, DEALSINDEX, DEALTYPE } = require('../basedef');
const util = require('util');

class SIMDBDataStream_DND extends DataStream {
    // cfg.mysqlcfg
    // cfg.tablename
    // cfg.begintime
    // cfg.endtime
    // cfg.offtimems
    constructor(cfg) {
        super(cfg);

        this.mysql = new Mysql(cfg.mysqlcfg);
    }

    _procConfig() {
        super._procConfig();

        if (!this.cfg.hasOwnProperty('offtimems')) {
            this.cfg.offtimems = 60 * 60 * 1000;
        }
    }

    init() {
    }

    async _getDND(tname, btms, etms) {
        let sql = util.format('select * from %s where tsms >= %d and tsms < %d order by tsms', tname, btms, etms);
        let [err, rows, fields] = await this.mysql.run(sql);
        if (err) {
            return undefined;
        }

        return rows;
    }

    async run() {
        let bt = new Date(this.cfg.begintime);
        let et = new Date(this.cfg.endtime);
        let btms = bt.getTime();
        let etms = et.getTime();

        while (btms <= etms) {
            let lst = await this._getDND(this.cfg.tablename, btms, btms + this.cfg.offtimems);
            if (lst && lst.length > 0) {
                for (let i = 0; i < lst.length; ++i) {
                    let cn = lst[i];

                    this.deals.push([cn.id, cn.price, cn.volume, cn.tsms, cn.type]);

                    this.asks = [[cn.askprice, cn.askvolume, cn.id, cn.askvolume]];
                    this.bids = [[cn.bidprice, cn.bidvolume, cn.id, cn.bidvolume]];

                    this._onDeals(1);
                    this._onDepth();
                }
            }

            btms += this.cfg.offtimems;
        }
    }
};

exports.SIMDBDataStream_DND = SIMDBDataStream_DND;
