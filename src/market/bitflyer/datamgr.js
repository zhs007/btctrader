"use strict";

const { Mysql } = require('../../mysql');
const util = require('util');

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
                "%d, %f, %f, %f, %f, %f, %f, '%s', %d)", tname, type, p, v, askp, askv, bidp, bidv, new Date(ts).toISOString(), ts);
            await this.mysql.run(sql);
        }
        catch (err) {
            console.log('BitflyerDataMgr.insertTick(' + sql + ') err ' + err);
        }
    }
};

exports.singleton = new BitflyerDataMgr();