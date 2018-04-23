"use strict";

const { ORDERSIDE, ORDERTYPE, ORDERSTATE } = require('./basedef');

// position.money
// position.volume
// position.avgprice

function countAvgPrice(position, side, volume, price) {
    if (position.volume == 0) {
        return price;
    }

    if (position.volume > 0) {
        if (side == ORDERSIDE.BUY) {
            return (position.avgprice * position.volume + price * volume) / (position.volume + volume);
        }

        if (position.volume == volume) {
            return 0;
        }

        if (position.volume > volume) {
            return position.avgprice;
        }

        return price;
    }

    if (side == ORDERSIDE.SELL) {
        return (position.avgprice * -position.volume + price * volume) / (-position.volume + volume);
    }

    if (-position.volume == volume) {
        return 0;
    }

    if (-position.volume > volume) {
        return position.avgprice;
    }

    return price;
}

function onOrder_position(position, order) {
    if (order.ordstate == ORDERSTATE.CLOSE) {
        if (order.lastturnvolume > 0) {
            if (order.side == ORDERSIDE.BUY) {
                let ap = countAvgPrice(position, ORDERSIDE.SELL, order.lastturnvolume, order.lastturnprice);
                position.money += order.lastturnprice * order.lastturnvolume;
                position.avgprice = ap;
                position.volume -= order.lastturnvolume;
            }
            else {
                let ap = countAvgPrice(position, ORDERSIDE.BUY, order.lastturnvolume, order.lastturnprice);
                position.money -= order.lastturnprice * order.lastturnvolume;
                position.avgprice = ap;
                position.volume += order.lastturnvolume;
            }
        }

        let avgprice = countAvgPrice(position, order.side, order.volume, order.avgprice);
        position.avgprice = avgprice;
        position.volume += order.side == ORDERSIDE.BUY ? order.volume : -order.volume;
        position.money += order.side == ORDERSIDE.BUY ? -order.volume * order.avgprice : order.volume * order.avgprice;

        return ;
    }

    if (order.ordstate == ORDERSTATE.FULLCANCELED) {
        return ;
    }

    if (order.ordstate == ORDERSTATE.CANCEL) {
        return ;
    }

    if (order.ordstate == ORDERSTATE.RUNNING) {
        if (order.lastturnvolume > 0) {
            if (order.side == ORDERSIDE.BUY) {
                let ap = countAvgPrice(position, ORDERSIDE.SELL, order.lastturnvolume, order.lastturnprice);
                position.money += order.lastturnprice * order.lastturnvolume;
                position.avgprice = ap;
                position.volume -= order.lastturnvolume;
            }
            else {
                let ap = countAvgPrice(position, ORDERSIDE.BUY, order.lastturnvolume, order.lastturnprice);
                position.money -= order.lastturnprice * order.lastturnvolume;
                position.avgprice = ap;
                position.volume += order.lastturnvolume;
            }
        }

        let cv = order.volume - order.lastvolume;
        let avgprice = countAvgPrice(position, order.side, cv, order.avgprice);
        position.avgprice = avgprice;
        position.volume += order.side == ORDERSIDE.BUY ? cv : -cv;
        position.money += order.side == ORDERSIDE.BUY ? -cv * order.avgprice : cv * order.avgprice;

        return ;
    }
}

function initPosition(money, volume, price) {
    return {
        money: money,
        volume: volume,
        avgprice: price
    };
}

exports.countAvgPrice = countAvgPrice;
exports.onOrder_position = onOrder_position;
exports.initPosition = initPosition;