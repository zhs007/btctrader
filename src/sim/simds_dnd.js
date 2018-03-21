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

    async _getDND(btms, etms) {
        let sql = util.format('select * from %s where tsms >= %d and tsms < %d order by tsms', this.cfg.tablename, btms, etms);
        let [err, rows, fields] = await this.mysql.run(sql);
        if (err) {
            return undefined;
        }

        for (let i = 0; i < rows.length; ++i) {
            this._formatDND(rows[i]);
        }

        return rows;
    }

    _formatDND(cn) {
        cn.price = parseFloat(cn.price);
        cn.volume = parseFloat(cn.volume);
        cn.askprice = parseFloat(cn.askprice);
        cn.askvolume = parseFloat(cn.askvolume);
        cn.bidprice = parseFloat(cn.bidprice);
        cn.bidvolume = parseFloat(cn.bidvolume);
    }

    // async run() {
    //     let bt = new Date(this.cfg.begintime);
    //     let et = new Date(this.cfg.endtime);
    //     let btms = bt.getTime();
    //     let etms = et.getTime();
    //
    //     while (btms <= etms) {
    //         let lst = await this._getDND(this.cfg.tablename, btms, btms + this.cfg.offtimems);
    //         if (lst && lst.length > 0) {
    //             for (let i = 0; i < lst.length; ++i) {
    //                 let cn = lst[i];
    //
    //                 this.deals.push([cn.id, cn.price, cn.volume, cn.tsms, cn.type]);
    //
    //                 this.asks = [[cn.askprice, cn.askvolume, cn.id, cn.askvolume]];
    //                 this.bids = [[cn.bidprice, cn.bidvolume, cn.id, cn.bidvolume]];
    //
    //                 this._onDeals(1);
    //                 this._onDepth();
    //             }
    //         }
    //
    //         btms += this.cfg.offtimems;
    //     }
    // }
};

exports.SIMDBDataStream_DND = SIMDBDataStream_DND;
