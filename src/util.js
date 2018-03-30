"use strict";

const { DEPTHINDEX } = require('./wsdatastream');
const util = require('util');

const STRING_ARR = 'abcdefghijklmnopqrstuvwxyz0123456789';

function randomInt(max) {
    return Math.floor(Math.random() * max);
}

function randomString(len) {
    let str = '';
    for (let i = 0; i < len; ++i) {
        str += STRING_ARR[randomInt(STRING_ARR.length)];
    }

    return str;
}

function _matchmaking_ask(ask_p, ask_v, bids) {
    let arr = [];
    for (let i = 0; i < bids.length; ) {
        if (ask_p > bids[i][0]) {
            break;
        }

        if (ask_v > bids[i][1]) {
            arr.push([bids[i][0], bids[i][1]]);

            ask_v -= bids[i][1];
            bids.splice(i, 1);
        }
        else {
            arr.push([bids[i][0], ask_v]);
            bids[i][1] -= ask_v;

            break;
        }
    }

    if (arr.length == 0) {
        return undefined;
    }

    return arr;
}

function _matchmaking_bid(bid_p, bid_v, asks) {
    let arr = [];
    for (let i = 0; i < asks.length; ) {
        if (bid_p < asks[i][0]) {
            break;
        }

        if (bid_v > asks[i][1]) {
            arr.push([asks[i][0], asks[i][1]]);

            bid_v -= asks[i][1];
            asks.splice(i, 1);
        }
        else {
            arr.push([asks[i][0], bid_v]);
            asks[i][1] -= bid_v;

            break;
        }
    }

    if (arr.length == 0) {
        return undefined;
    }

    return arr;
}

function matchmakingSell(p, v, asks) {
    let arr = [];
    for (let i = 0; i < asks.length; ) {
        if (p > asks[i][0]) {
            break;
        }

        if (v > asks[i][1]) {
            arr.push([asks[i][0], asks[i][1]]);

            v -= asks[i][1];
            asks.splice(i, 1);
        }
        else {
            arr.push([asks[i][0], v]);
            // asks[i][1] -= v;

            break;
        }
    }

    if (arr.length == 0) {
        return undefined;
    }

    return arr;
}

function matchmakingBuy(p, v, bids) {
    let arr = [];
    for (let i = 0; i < bids.length; ) {
        if (p < bids[i][0]) {
            break;
        }

        if (v > bids[i][1]) {
            arr.push([bids[i][0], bids[i][1]]);

            v -= bids[i][1];
            bids.splice(i, 1);
        }
        else {
            arr.push([bids[i][0], v]);
            // bids[i][1] -= v;

            break;
        }
    }

    if (arr.length == 0) {
        return undefined;
    }

    return arr;
}

function matchmakingAsk(asks, bids) {
    if (asks[0][0] < bids[0][0]) {
        let depth = analyzeDepth(asks, bids);
        let arr = [];
        let nbids = _cloneDepthArr(bids, depth[1]);

        for (let i = 0; i < depth[0]; ++i) {
            let carr = _matchmaking_ask(asks[i][0], asks[i][1], nbids);
            if (carr == undefined) {
                break;
            }

            for (let j = 0; j < carr.length; ++j) {
                arr.push(carr[j]);
            }
        }

        return arr;
    }

    return undefined;
}

function matchmakingBid(asks, bids) {
    if (asks[0][0] < bids[0][0]) {
        let depth = analyzeDepth(asks, bids);
        let arr = [];
        let nasks = _cloneDepthArr(asks, depth[0]);

        for (let i = 0; i < depth[1]; ++i) {
            let carr = _matchmaking_bid(bids[i][0], bids[i][1], nasks);
            if (carr == undefined) {
                break;
            }

            for (let j = 0; j < carr.length; ++j) {
                arr.push(carr[j]);
            }
        }

        return arr;
    }

    return undefined;
}

function _matchmaking_ask_depth2(ask_p, ask_v, bi, bids) {
    let arr = [];
    for (; bi < bids.length; ) {
        if (ask_p > bids[bi][DEPTHINDEX.PRICE]) {
            break;
        }

        if (ask_v > bids[bi][DEPTHINDEX.LASTVOLUME]) {
            arr.push([bids[bi][DEPTHINDEX.PRICE], bids[bi][DEPTHINDEX.LASTVOLUME]]);

            ask_v -= bids[bi][DEPTHINDEX.LASTVOLUME];
            bids[bi][DEPTHINDEX.LASTVOLUME] = 0;

            ++bi;
        }
        else {
            arr.push([bids[bi][DEPTHINDEX.PRICE], ask_v]);
            bids[bi][DEPTHINDEX.LASTVOLUME] -= ask_v;

            break;
        }
    }

    return {bi: bi, arr: arr};
}

function matchmakingAsk_depth2(asks, bids) {
    if (asks[0][0] < bids[0][0]) {
        let arr = [];
        let bi = 0;

        for (let i = 0; i < asks.length; ++i) {
            let cret = _matchmaking_ask_depth2(asks[i][0], asks[i][1], bi, bids);
            if (cret.arr.length == 0) {
                break;
            }

            bi = cret.bi;

            for (let j = 0; j < cret.arr.length; ++j) {
                arr.push(cret.arr[j]);
            }
        }

        return arr;
    }

    return undefined;
}

function _matchmaking_bid_depth2(bid_p, bid_v, bi, asks) {
    let arr = [];
    for (; bi < asks.length; ) {
        if (bid_p < asks[bi][DEPTHINDEX.PRICE]) {
            break;
        }

        if (bid_v > asks[bi][DEPTHINDEX.LASTVOLUME]) {
            arr.push([asks[bi][DEPTHINDEX.PRICE], asks[bi][DEPTHINDEX.LASTVOLUME]]);

            bid_v -= asks[bi][DEPTHINDEX.LASTVOLUME];
            asks[bi][DEPTHINDEX.LASTVOLUME] = 0;

            ++bi;
        }
        else {
            arr.push([asks[bi][DEPTHINDEX.PRICE], bid_v]);
            asks[bi][DEPTHINDEX.LASTVOLUME] -= bid_v;

            break;
        }
    }

    return {bi: bi, arr: arr};
}

function matchmakingBid_depth2(asks, bids) {
    if (asks[0][0] < bids[0][0]) {
        let arr = [];
        let bi = 0;

        for (let i = 0; i < bids.length; ++i) {
            let cret = _matchmaking_bid_depth2(bids[i][0], bids[i][1], bi, asks);
            if (cret.arr.length == 0) {
                break;
            }

            bi = cret.bi;

            for (let j = 0; j < cret.arr.length; ++j) {
                arr.push(cret.arr[j]);
            }
        }

        return arr;
    }

    return undefined;
}

function _cloneDepthArr(arr, len) {
    let narr = [];
    if (len == undefined || len < 0) {
        len = arr.length;
    }

    for (let i = 0; i < len; ++i) {
        narr.push([arr[i][0], arr[i][1]]);
    }

    return narr;
}

function analyzeDepth(asks, bids) {
    let depth = [0, 0];

    for (let ai = 0; ai < asks.length; ++ai) {
        let isproc = false;
        for (let bi = depth[1]; bi < bids.length; ++bi) {
            if (asks[ai][0] > bids[bi][0]) {
                depth[1] = bi;
                break;
            }

            isproc = true;
        }

        if (isproc) {
            depth[0] = ai + 1;
        }
    }

    return depth;
}

function countPriceWithDepth_asks_depth2(asks, volume) {
    let ret = {avg: 0, max: 0, nums: 0, vol: 0, cp: 0, arr: []};
    for (let i = 0; i < asks.length; ++i) {
        let nv = volume - ret.vol;
        if (nv <= 0) {
            break;
        }

        if (nv <= asks[i][DEPTHINDEX.LASTVOLUME]) {
            let tv = ret.vol + nv;

            ret.avg = ret.avg * ret.vol / tv + asks[i][DEPTHINDEX.PRICE] * nv / tv;
            ret.vol = ret.vol + nv;

            ret.max = asks[i][DEPTHINDEX.PRICE];

            ret.arr.push([asks[i][DEPTHINDEX.PRICE], nv]);

            break;
        }
        else {
            nv = asks[i][DEPTHINDEX.LASTVOLUME];

            let tv = ret.vol + nv;

            ret.avg = ret.avg * ret.vol / tv + asks[i][DEPTHINDEX.PRICE] * nv / tv;
            ret.vol = ret.vol + nv;

            ret.max = asks[i][DEPTHINDEX.PRICE];

            ret.arr.push([asks[i][DEPTHINDEX.PRICE], nv]);
        }
    }

    return ret;
}

function countPriceWithDepth_bids_depth2(bids, volume) {
    let ret = {avg: 0, min: 0, nums: 0, vol: 0, cp: 0, arr: []};
    for (let i = 0; i < bids.length; ++i) {
        let nv = volume - ret.vol;
        if (nv <= 0) {
            break;
        }

        if (nv <= bids[i][DEPTHINDEX.LASTVOLUME]) {
            let tv = ret.vol + nv;

            ret.avg = ret.avg * ret.vol / tv + bids[i][DEPTHINDEX.PRICE] * nv / tv;
            ret.vol = ret.vol + nv;

            ret.min = bids[i][DEPTHINDEX.PRICE];

            ret.arr.push([bids[i][DEPTHINDEX.PRICE], nv]);

            break;
        }
        else {
            nv = bids[i][DEPTHINDEX.LASTVOLUME];

            let tv = ret.vol + nv;

            ret.avg = ret.avg * ret.vol / tv + bids[i][DEPTHINDEX.PRICE] * nv / tv;
            ret.vol = ret.vol + nv;

            ret.min = bids[i][DEPTHINDEX.PRICE];

            ret.arr.push([bids[i][DEPTHINDEX.PRICE], nv]);
        }
    }

    return ret;
}

async function __runsql(mysql, fullsql) {
    try {
        await mysql.run(fullsql);
    }
    catch (err) {
        console.log('__runsql(' + fullsql + ') err ' + err);

        return err;
    }

    return undefined;
}

function makeInsertSql(tname, obj, funcOnFilter) {
    let str0 = '';
    let str1 = '';

    let j = 0;
    for (let key in obj) {
        if (funcOnFilter == undefined || funcOnFilter(key)) {
            if (j != 0) {
                str0 += ', ';
                str1 += ', ';
            }

            str0 += '`' + key + '`';
            str1 += "'" + obj[key] + "'";

            ++j;
        }
    }

    let sql = util.format("insert into %s(%s) values(%s);", tname, str0, str1);
    return sql;
}

function makeUpdateSql(tname, obj, wherestr, funcOnFilter) {
    let str = '';

    let j = 0;
    for (let key in obj) {
        if (funcOnFilter == undefined || funcOnFilter(key)) {
            if (j != 0) {
                str += ', ';
            }

            str += '`' + key + '` = ';
            str += "'" + obj[key] + "'";

            ++j;
        }
    }

    let sql = util.format("update %s set %s where %s;", tname, str, wherestr);
    return sql;
}

async function insertList(mysql, tablename, lst, batchnums, funcOnFilter) {
    let fullsql = '';
    let sqlnums = 0;

    for (let i = 0; i < lst.length; ++i) {
        let sql = makeInsertSql(tablename, lst[i], funcOnFilter);

        // let cf = lst[i];
        // let str0 = '';
        // let str1 = '';
        //
        // let j = 0;
        // for (let key in cf) {
        //     if (funcOnFilter == undefined || funcOnFilter(key)) {
        //         if (j != 0) {
        //             str0 += ', ';
        //             str1 += ', ';
        //         }
        //
        //         str0 += '`' + key + '`';
        //         str1 += "'" + cf[key] + "'";
        //
        //         ++j;
        //     }
        // }
        //
        // let sql = util.format("insert into %s(%s) values(%s);", tablename, str0, str1);
        fullsql += sql;
        ++sqlnums;

        if (sqlnums >= batchnums) {
            let err = await __runsql(mysql, fullsql);
            if (err != undefined) {
                return err;
            }

            fullsql = '';
            sqlnums = 0;
        }
    }

    if (sqlnums > 0) {
        let err = await __runsql(mysql, fullsql);
        if (err != undefined) {
            return err;
        }
    }
}

async function removeList(mysql, tablename, lst, batchnums, funcBuildSql) {
    let fullsql = '';
    let sqlnums = 0;

    for (let i = 0; i < lst.length; ++i) {
        let cf = lst[i];

        let sql = funcBuildSql(tablename, cf);
        fullsql += sql;
        ++sqlnums;

        if (sqlnums >= batchnums) {
            let err = await __runsql(mysql, fullsql);
            if (err != undefined) {
                return err;
            }

            fullsql = '';
            sqlnums = 0;
        }
    }

    if (sqlnums > 0) {
        let err = await __runsql(mysql, fullsql);
        if (err != undefined) {
            return err;
        }
    }
}

exports.randomInt = randomInt;
exports.randomString = randomString;

exports.matchmakingAsk = matchmakingAsk;
exports.matchmakingBid = matchmakingBid;
exports.matchmakingAsk_depth2 = matchmakingAsk_depth2;
exports.matchmakingBid_depth2 = matchmakingBid_depth2;
exports.analyzeDepth = analyzeDepth;
exports.matchmakingBuy = matchmakingBuy;
exports.matchmakingSell = matchmakingSell;

exports.countPriceWithDepth_asks_depth2 = countPriceWithDepth_asks_depth2;
exports.countPriceWithDepth_bids_depth2 = countPriceWithDepth_bids_depth2;

exports.insertList = insertList;
exports.removeList = removeList;
exports.makeInsertSql = makeInsertSql;
exports.makeUpdateSql = makeUpdateSql;