"use strict";

const { TRADETYPE } = require('./basedef');

class StrategyStatistics {
    constructor() {
        this.tradeNums = 0;
        this.tradeDealNums = 0;
        this.tradeWinNums = 0;

        this.totalIn = 0;
        this.totalOut = 0;

        this.curMoney = 0;
        this.maxMoney = 0;
        this.minMoney = 0;

        this.maxDrawdown = 0;
    }

    onOpen(p, v) {
        this.tradeNums++;
    }

    onDealOpen(p, v) {
        this.tradeDealNums++;

        this.totalOut += p * v;

        this.curMoney -= p * v;
        if (this.curMoney < this.minMoney) {
            this.minMoney = this.curMoney;

            // this.maxDrawdown = (this.maxMoney - this.minMoney) /
        }
    }

    onClose(p, v) {

    }

    onDealClose(type, op, p, v) {
        this.totalIn += p * v;

        this.curMoney += p * v;
        if (this.curMoney > this.maxMoney) {
            this.maxMoney = this.curMoney;
        }

        if (type == TRADETYPE.BUY) {
            if (p > op) {
                this.tradeWinNums++;
            }
        }
        else {
            if (p < op) {
                this.tradeWinNums++;
            }
        }
    }

    onCancel(p, v) {
        // this.totalIn += p * v;
        //
        // this.curMoney += p * v;
        // if (this.curMoney > this.maxMoney) {
        //     this.maxMoney = this.curMoney;
        // }
    }

    output() {
        let win = this.totalIn - this.totalOut;
        let src = Math.max(Math.abs(this.minMoney), Math.abs(this.maxMoney));
        let roi = (src + win) / src;
        console.log('totalOut ' + this.totalOut + ' totalIn ' + this.totalIn + ' ROI ' + roi);
        console.log('lastMoney ' + this.curMoney + ' [' + this.minMoney + ',' + this.maxMoney + ']');
        console.log('dealper ' + this.tradeDealNums / this.tradeNums + ' winper ' + this.tradeWinNums / this.tradeNums);
    }
};

exports.StrategyStatistics = StrategyStatistics;