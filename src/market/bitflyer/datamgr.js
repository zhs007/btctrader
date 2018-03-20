"use strict";

const { Mysql } = require('../../mysql');
const { insertList, removeList, makeInsertSql } = require('../../util');
const util = require('util');

const BATCH_MUL_LINE = 1024;

class BitflyerDataMgr {
    constructor() {
        this.cfg = undefined;
        this.mysql = undefined;
    }

    async init(cfg) {
        this.cfg = cfg;
        this.mysql = new Mysql(cfg);
    }

    async insertTick(tname, type, p, v, askp, askv, bidp, bidv, ts) {
        if (this.mysql == undefined) {
            return ;
        }

        let sql = '';
        try {
            sql = util.format("insert into %s(type, price, volume, askprice, askvolume, bidprice, bidvolume, ts, tsms) values(" +
                "%d, %f, %f, %f, %f, %f, %f, '%s', %d);", tname, type, p, v, askp, askv, bidp, bidv, new Date(ts).toISOString(), ts);
            await this.mysql.run(sql);
        }
        catch (err) {
            console.log('BitflyerDataMgr.insertTick(' + sql + ') err ' + err);
        }
    }

    async getTick(tname, bt, et) {
        if (this.mysql == undefined) {
            return undefined;
        }

        let sql = '';
        try {
            sql = util.format("select * from %s where tsms >= %d and tsms <= %d order by tsms;", tname, new Date(bt).getTime(), new Date(et).getTime());
            let [err, results, fields] = await this.mysql.run(sql);

            return results;
        }
        catch (err) {
            console.log('BitflyerDataMgr.getTick(' + sql + ') err ' + err);
        }

        return undefined;
    }

    async removeCandles(tname, lst) {
        if (this.mysql == undefined) {
            return undefined;
        }

        return removeList(this.mysql, tname, lst, BATCH_MUL_LINE, (tablename, curnode) => {
            return util.format("delete from %s where UNIX_TIMESTAMP(ts) = %d;", tablename, Math.floor(new Date(curnode.ts).getTime() / 1000));
        });
    }

    async saveCandles(tname, lst) {
        if (this.mysql == undefined) {
            return ;
        }

        let err = await this.removeCandles(tname, lst);
        if (err != undefined) {
            return err;
        }

        return insertList(this.mysql, tname, lst, BATCH_MUL_LINE);
    }

    async getCandles(tname, bt, et) {
        if (this.mysql == undefined) {
            return ;
        }

        let sql = '';
        try {
            sql = util.format("select * from %s where UNIX_TIMESTAMP(ts) >= %d and UNIX_TIMESTAMP(ts) <= %d order by ts;", tname, Math.floor(new Date(bt).getTime() / 1000), Math.floor(new Date(et).getTime() / 1000));
            let [err, results, fields] = await this.mysql.run(sql);

            return results;
        }
        catch (err) {
            console.log('BitflyerDataMgr.getCandles(' + sql + ') err ' + err);
        }

        return undefined;
    }

    async insertCandle(tname, candle) {
        if (this.mysql == undefined) {
            return ;
        }

        let sql = makeInsertSql(tname, candle);
        try {
            await this.mysql.run(sql);
        }
        catch (err) {
            console.log('BitflyerDataMgr.insertCandle(' + sql + ') err ' + err);
        }
    }
};

exports.singleton = new BitflyerDataMgr();