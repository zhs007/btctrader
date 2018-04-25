"use strict";

const { ORDERSIDE, ORDERTYPE, ORDERSTATE } = require('./basedef');

// order
// order.market
// order.symbol
// order.side           - ORDERSIDE
// order.openms
// order.closems
// order.ordtype        - ORDERTYPE
// order.price
// order.volume
// order.avgprice
// order.lastvolume
// order.lstchild
// order.parent
// order.clordid        - mainid-indexid
// order.clordlinkid    - linkid
// order.ordstate       - ORDERSTATE
// order.mainid         - main id
// order.indexid        - index id
// order.ordid          - serv id
// order.parentindexid  - parent indexid
// order.simid
// order.lsttrade       - [trade0, trade1, ...]
// order.alreadyvolume  - sim mode
// order.thisturnvolume - sim mode
// order.thisturnprice  - sim mode
// order.lastturnvolume - sim mode
// order.lastturnprice  - sim mode
// order.stopprice      - stop price

function countOrderList(lst) {
    let v = 0;
    let p = 0;
    let win = 0;
    let opennums = 0;

    for (let i = 0; i < lst.length; ++i) {
        let co = lst[i];

        if (co.lastvolume > 0) {
            opennums++;
        }

        let cv = co.volume - co.lastvolume;
        if (cv == 0) {
            continue ;
        }

        let ov = co.side * cv;
        if (v == 0) {
            p = co.avgprice;
            v = ov;
        }
        else if (v / ov > 0) {
            p = (p * Math.abs(v) + co.avgprice * cv) / (Math.abs(v) + cv);
            v += ov;
        }
        else {
            let lm = (co.avgprice - p) * Math.abs(ov) * (v < 0 ? -1 : 1);
            win += lm;
            v += ov;
        }
    }

    if (v == 0) {
        p = 0;
    }

    return {
        lastvolume: v,
        avgprice: p,
        win: win,
        opennums: opennums
    };
}

// sort asc
function insertOrder2SortList_Buy(lst, order) {
    if (lst.length == 0) {
        lst.push(order);

        return ;
    }

    for (let i = 0; i < lst.length; ++i) {
        if (order.price < lst[i].price) {
            lst.splice(i, 0, order);

            return ;
        }
    }

    lst.push(order);
}

// sort desc
function insertOrder2SortList_Sell(lst, order) {
    if (lst.length == 0) {
        lst.push(order);

        return ;
    }

    for (let i = 0; i < lst.length; ++i) {
        if (order.price > lst[i].price) {
            lst.splice(i, 0, order);

            return ;
        }
    }

    lst.push(order);
}

// sort asc
function insertOrder2SortList_StopBuy(lst, order) {
    if (lst.length == 0) {
        lst.push(order);

        return ;
    }

    for (let i = 0; i < lst.length; ++i) {
        if (order.stopprice < lst[i].stopprice) {
            lst.splice(i, 0, order);

            return ;
        }
    }

    lst.push(order);
}

// sort desc
function insertOrder2SortList_StopSell(lst, order) {
    if (lst.length == 0) {
        lst.push(order);

        return ;
    }

    for (let i = 0; i < lst.length; ++i) {
        if (order.stopprice > lst[i].stopprice) {
            lst.splice(i, 0, order);

            return ;
        }
    }

    lst.push(order);
}

function removeOrder(lst, order) {
    for (let i = 0; i < lst.length; ++i) {
        if (lst[i].mainid == order.mainid && lst[i].indexid == order.indexid) {
            lst.splice(i, 1);
            break;
        }
    }
}

function addTrade2Order(order, trade) {
    if (!order.hasOwnProperty('lsttrade')) {
        order.lsttrade = [];
    }

    order.lsttrade.push(trade);

    order.thisturnvolume = trade.volume;
    order.thisturnprice = trade.price;
}

exports.countOrderList = countOrderList;
exports.insertOrder2SortList_Buy = insertOrder2SortList_Buy;
exports.insertOrder2SortList_Sell = insertOrder2SortList_Sell;
exports.insertOrder2SortList_StopBuy = insertOrder2SortList_StopBuy;
exports.insertOrder2SortList_StopSell = insertOrder2SortList_StopSell;
exports.removeOrder = removeOrder;
exports.addTrade2Order = addTrade2Order;