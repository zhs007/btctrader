"use strict";

const { Mysql } = require('./mysql');
const { randomInt, randomString, makeInsertSql, makeUpdateSql } = require('./util');
const { TRADESIDE, TRADEEXECTYPE, ORDERTYPE } = require('./basedef');
const util = require('util');

class TradeMgr {
    constructor() {
        this.cfg = undefined;
        this.mysql = undefined;

        this.tablename = '';

        this.lsttrade = [];
    }

    async init(cfg, tablename) {
        this.tablename = tablename;
        this.cfg = cfg;
        this.mysql = new Mysql(cfg);
    }

    newTrade(order, price, volume) {

    }
};

exports.singleton = new TradeMgr();