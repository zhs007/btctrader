"use strict";

const { ORDERSIDE, ORDERTYPE, ORDERSTATE } = require('./basedef');

// order
// order.id
// order.side
// order.openms
// order.closems
// order.type
// order.price
// order.volume
// order.avgprice
// order.lastvolume

function countOrderList(lst) {
    let v = 0;
    let p = 0;
    let win = 0;

    for (let i = 0; i < lst.length; ++i) {
        let co = lst[i];

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
        win: win
    };
}

exports.countOrderList = countOrderList;