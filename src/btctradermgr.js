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
        await this.mysql.connect();
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

    async updSim(simid, starttime, endtime, roi, startmoney, endmoney, startvalue, endvalue, maxdrawdown) {
        if (this.mysql == undefined) {
            return ;
        }

        let str = util.format("starttime = '%s', endtime = '%s', roi = %f, startmoney = %f, endmoney = %f, startvalue = %f, endvalue = %f, maxdrawdown = %f",
            new Date(starttime).toISOString(), new Date(endtime).toISOString(), roi, startmoney, endmoney, startvalue, endvalue, maxdrawdown);

        let sql = util.format('update %s set %s where id = %d', TNAME_SIMINFO, str, simid);

        try {
            await this.mysql.run(sql);
        }
        catch (err) {
            console.log('BTCTraderMgr.updSim(' + sql + ') err ' + err);
        }
    }

    async insertTrade(simid, trade) {
        if (this.mysql == undefined) {
            return ;
        }

        let str0 = 'simid, tid, type, state, curprice, curvolume, p, v, ts, tsms';
        let str1 = util.format("%d, %d, %d, %d, %f, %f, %f, %f, '%s', %d", simid, trade.tid, trade.type, trade.state, trade.cp, trade.cv, trade.bp, trade.bv, new Date(trade.tsms).toISOString(), trade.tsms);

        let sql = util.format('insert into %s(%s) values(%s)', TNAME_TRADE, str0, str1);

        try {
            let [err, results, fields] = await this.mysql.run(sql);
            if (err) {
                console.log('BTCTraderMgr.insertTrade(' + sql + ') err ' + err);

                return ;
            }

            return ;
        }
        catch (err) {
            console.log('BTCTraderMgr.insertTrade(' + sql + ') err ' + err);
        }
    }

    async updTrade(simid, trade) {
        if (this.mysql == undefined) {
            return ;
        }

        let str = util.format("state = %d", trade.state);

        if (trade.childDeal != undefined) {
            let strdeal = util.format(", dp = %f, dv = %f, dts = '%s', dtsms = %d", trade.childDeal.p, trade.childDeal.v, new Date(trade.childDeal.tsms).toISOString(), trade.childDeal.tsms);
            str += strdeal;
        }

        if (trade.childClose != undefined) {
            let strclose = util.format(", cp = %f, cv = %f, cts = '%s', ctsms = %d", trade.childClose.p, trade.childClose.bv - trade.childClose.v, new Date(trade.childClose.tsms).toISOString(), trade.childClose.tsms);

            if (trade.childClose.childDeal != undefined) {
                let strclosedeal = util.format(", cdp = %f, cdv = %f, cdts = '%s', cdtsms = %d", trade.childClose.childDeal.p, trade.childClose.childDeal.v, new Date(trade.childClose.childDeal.tsms).toISOString(), trade.childClose.childDeal.tsms);
                strclose += strclosedeal;
            }

            str += strclose;
        }

        let sql = util.format('update %s set %s where simid = %d and tid = %d', TNAME_TRADE, str, simid, trade.tid);

        // console.log(sql);

        try {
            await this.mysql.run(sql);
        }
        catch (err) {
            console.log('BTCTraderMgr.updTrade(' + sql + ') err ' + err);
        }
    }

    safeExit(callback) {
        if (this.mysql != undefined) {
            this.mysql.safeExit(callback);
        }
    }
};

exports.singleton = new BTCTraderMgr();