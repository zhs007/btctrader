"use strict";

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

exports.matchmakingAsk = matchmakingAsk;
exports.matchmakingBid = matchmakingBid;
exports.analyzeDepth = analyzeDepth;