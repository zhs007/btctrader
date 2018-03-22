"use strict";

const { TRADETYPE } = require('./basedef');

class TradeSortList {
    constructor(tradetype) {
        this.typeTrade = tradetype;
        this.lst = [];
    }

    insert(trade) {
        this.lst.push(trade);

        if (this.typeTrade == TRADETYPE.BUY) {
            this.lst.sort((a, b) => {
                return b.bp - a.bp;
            });
        }
        else if (this.typeTrade == TRADETYPE.SELL) {
            this.lst.sort((a, b) => {
                return a.bp - b.bp;
            });
        }
    }

    remove(trade) {
        for (let i = 0; i < this.lst.length; ++i) {
            if (this.lst[i].tid == trade.tid) {
                this.lst.splice(i, 1);

                return true;
            }
        }

        return false;
    }
};

exports.TradeSortList = TradeSortList;