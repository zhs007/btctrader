"use strict";

const { Mysql } = require('./mysql');
const util = require('util');

const TNAME_SIMINFO     = 'btctrader_siminfo';
const TNAME_TRADE       = 'btctrader_trade';

class BTCTraderMgr {

    constructor() {
        this.cfg = undefined;
        this.mysql = undefined;
    }

    async init(cfg) {
        this.cfg = cfg;
        this.mysql = new Mysql(cfg);
    }

    async newSim(name, strinfo, strparams) {
        if (this.mysql == undefined) {
            return ;
        }

        let str0 = 'simname';
        let str1 = util.format("'%s'", name);

        if (strinfo) {
            str0 += ', siminfo';
            str1 += util.format(", '%s'", strinfo);
        }

        if (strparams) {
            str0 += ', simparams';
            str1 += util.format(", '%s'", strparams);
        }

        let sql = util.format('insert into %s(%s) values(%s)', TNAME_SIMINFO, str0, str1);

        try {
            let [err, results, fields] = await this.mysql.run(sql);
            if (err) {
                console.log('BTCTraderMgr.newSim(' + sql + ') err ' + err);

                return -1;
            }

            return results.insertId;
        }
        catch (err) {
            console.log('BTCTraderMgr.newSim(' + sql + ') err ' + err);
        }

        return -1;
    }

    async insertTrade(simid, trade) {
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

    async updTrade(simid, trade) {

    }
};

exports.singleton = new BTCTraderMgr();