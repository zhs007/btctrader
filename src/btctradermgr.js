"use strict";

const { Mysql } = require('./mysql');
const util = require('util');

class BTCTraderMgr {
    constructor() {
        this.cfg = undefined;
        this.mysql = undefined;
        this.curTID = 1;
    }

    async init(cfg) {
        this.cfg = cfg;
        this.mysql = new Mysql(cfg);

        this.curTID = await this._getMaxTID();
    }

    async _getMaxTID() {
        if (this.mysql == undefined) {
            return 1;
        }

        try {
            const [err, results, fields] = await this.mysql.run('select max(tid) as tid from btctrader_trade');
            if (results.length > 0) {
                return results.tid;
            }
        }
        catch (err) {
            console.log('BTCTraderMgr._getMaxTID() err ' + err);
        }

        return 1;
    }

    async insertTrade(type, cp, cv, p, v, m, bp, bv, bm) {
        if (this.mysql == undefined) {
            return ;
        }

        let sql = '';
        try {
            sql = util.format('insert into btctrader_trade(tid, type, curprice, curvolume, price, volume, money, bprice, bvolume, bmoney) values(' +
                '%d, %d, %f, %f, %f, %f, %f, %f, %f, %f)', this.curTID, type, cp, cv, p, v, m, bp, bv, bm);
            await this.mysql.run(sql);
        }
        catch (err) {
            console.log('BTCTraderMgr.insertTrade(' + sql + ') err ' + err);
        }
    }
};

exports.singleton = new BTCTraderMgr();