"use strict";

const { ORDERSIDE, ORDERTYPE, ORDERSTATE, TRADESIDE } = require('./basedef');

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

function onTrade_position(traderctrl, position, trade) {
    if (trade.side == TRADESIDE.BUY) {
        if (position.volume > 0) {

        }
    }
    else {

    }
}

function onOrder_position(traderctrl, position, order) {
    if (order.ordstate == ORDERSTATE.CLOSE) {
        if (order.lastturnvolume > 0) {
            if (order.side == ORDERSIDE.BUY) {
                let ap = countAvgPrice(position, ORDERSIDE.SELL, order.lastturnvolume, order.lastturnprice);
                position.money += traderctrl.countMoney(order.lastturnprice, order.lastturnvolume);
                position.avgprice = ap;
                position.volume -= order.lastturnvolume;
            }
            else {
                let ap = countAvgPrice(position, ORDERSIDE.BUY, order.lastturnvolume, order.lastturnprice);
                position.money -= traderctrl.countMoney(order.lastturnprice, order.lastturnvolume);
                position.avgprice = ap;
                position.volume += order.lastturnvolume;
            }
        }

        let avgprice = countAvgPrice(position, order.side, order.volume, order.avgprice);
        position.avgprice = avgprice;
        position.volume += order.side == ORDERSIDE.BUY ? order.volume : -order.volume;
        let cm = traderctrl.countMoney(order.avgprice, order.volume);
        position.money += order.side == ORDERSIDE.BUY ? -cm : cm;

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
                position.money += traderctrl.countMoney(order.lastturnprice, order.lastturnvolume);
                position.avgprice = ap;
                position.volume -= order.lastturnvolume;
            }
            else {
                let ap = countAvgPrice(position, ORDERSIDE.BUY, order.lastturnvolume, order.lastturnprice);
                position.money -= traderctrl.countMoney(order.lastturnprice, order.lastturnvolume);
                position.avgprice = ap;
                position.volume += order.lastturnvolume;
            }
        }

        let cv = order.volume - order.lastvolume;
        let avgprice = countAvgPrice(position, order.side, cv, order.avgprice);
        position.avgprice = avgprice;
        position.volume += order.side == ORDERSIDE.BUY ? cv : -cv;
        let cm = traderctrl.countMoney(order.avgprice, cv);
        position.money += order.side == ORDERSIDE.BUY ? -cm : cm;

        return ;
    }
}

function initPosition(money, volume, price, ordermoney) {
    return {
        money: money,
        volume: volume,
        avgprice: price,
        ordermoney: ordermoney,
    };
}

exports.countAvgPrice = countAvgPrice;
exports.onOrder_position = onOrder_position;
exports.initPosition = initPosition;