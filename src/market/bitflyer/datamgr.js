"use strict";

const { DataMgr } = require('../../datamgr');
const { Mysql } = require('../../mysql');
const { insertList, removeList, makeInsertSql } = require('../../util');
const util = require('util');

const BATCH_MUL_LINE = 1024;

class BitflyerDataMgr extends DataMgr {
    constructor() {
        super();
    }
};

exports.singleton = new BitflyerDataMgr();