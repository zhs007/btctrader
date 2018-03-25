"use strict";

const { TRADETYPE } = require('./basedef');
const util = require('util');

class StrategyStatistics {
    constructor() {
        this.tradeNums = 0;
        this.tradeCancelNums = 0;
        this.tradeWinNums = 0;

        this.totalIn = 0;
        this.totalOut = 0;

        this.startMoney = 0;
        this.curMoney = 0;
        this.maxMoney = 0;
        this.minMoney = 0;

        this.startValue = 0;
        this.curValue = 0;
        this.maxValue = 0;
        this.minValue = 0;

        this.startAssets = 0;
        this.curAssets = 0;
        this.maxAssets = 0;
        this.minAssets = 0;
        this.beforeMaxAssets = 0;

        this.maxDrawdown = 0;

        this.startPrice = 0;
        this.endPrice = 0;

        this.roi = 0;
    }

    onStart() {
        this.startMoney = 0;
        this.curMoney = 0;
        this.maxMoney = 0;
        this.minMoney = 0;

        this.startValue = 0;
        this.curValue = 0;
        this.maxValue = 0;
        this.minValue = 0;

        // let ca = money + value * price;
        this.startAssets = 0;
        this.curAssets = 0;
        this.maxAssets = 0;
        this.minAssets = 0;
        this.beforeMaxAssets = 0;

        this.tradeNums = 0;
        this.tradeDealNums = 0;
        this.tradeWinNums = 0;

        this.totalIn = 0;
        this.totalOut = 0;

        this.maxDrawdown = 0;

        this.startPrice = 0;
        this.endPrice = 0;
    }

    onDealPrice(p) {
        if (this.startPrice == 0) {
            this.startPrice = p;
        }

        this.endPrice = p;

        this.curAssets = this.curMoney + this.curValue * p;
        if (this.curAssets < this.minAssets) {
            this.minAssets = this.curAssets;
            this.beforeMaxAssets = this.maxAssets;
            // this.maxDrawdown = (this.maxAssets - this.minAssets) / this.maxAssets;
        }

        if (this.curAssets > this.maxAssets) {
            this.maxAssets = this.curAssets;
        }
    }

    onOpen(type, p, v) {
        this.tradeNums++;

        this.totalOut += p * v;
        //
        // if (type == TRADETYPE.BUY) {
        //     this.curMoney -= p * v;
        //     if (this.curMoney < this.minMoney) {
        //         this.minMoney = this.curMoney;
        //     }
        // }
        // else {
        //     this.curValue -= v;
        //     if (this.curValue < this.minValue) {
        //         this.minValue = this.curValue;
        //     }
        // }
    }

    onDealOpen(type, p, v) {
        // this.tradeDealNums++;

        this.totalIn += p * v;

        if (type == TRADETYPE.BUY) {
            this.curValue += v;
            if (this.curValue > this.maxValue) {
                this.maxValue = this.curValue;
            }

            this.curMoney -= p * v;
            if (this.curMoney < this.minMoney) {
                this.minMoney = this.curMoney;
            }
        }
        else {
            this.curMoney += p * v;
            if (this.curMoney > this.maxMoney) {
                this.maxMoney = this.curMoney;
            }

            this.curValue -= v;
            if (this.curValue < this.minValue) {
                this.minValue = this.curValue;
            }
        }
    }

    onClose(type, p, v) {
        this.totalOut += p * v;

        // if (type == TRADETYPE.BUY) {
        //     this.curValue -= v;
        //     if (this.curValue < this.minValue) {
        //         this.minValue = this.curValue;
        //     }
        // }
        // else {
        //     this.curMoney -= p * v;
        //     if (this.curMoney < this.minMoney) {
        //         this.minMoney = this.curMoney;
        //     }
        // }
    }

    onDealClose(type, p, v) {
        this.totalIn += p * v;

        if (type == TRADETYPE.BUY) {
            this.curMoney += p * v;
            if (this.curMoney > this.maxMoney) {
                this.maxMoney = this.curMoney;
            }

            this.curValue -= v;
            if (this.curValue < this.minValue) {
                this.minValue = this.curValue;
            }
        }
        else {
            this.curValue += v;
            if (this.curValue > this.maxValue) {
                this.maxValue = this.curValue;
            }

            this.curMoney -= p * v;
            if (this.curMoney < this.minMoney) {
                this.minMoney = this.curMoney;
            }
        }
    }

    onCloseEnd(type, bp, p) {
        if (type == TRADETYPE.BUY) {
            if (p > bp) {
                this.tradeWinNums++;
            }
        }
        else {
            if (p < bp) {
                this.tradeWinNums++;
            }
        }
    }

    onCancel(type, p, v) {
        this.tradeCancelNums++;

        this.totalIn += p * v;
        //
        // if (type == TRADETYPE.BUY) {
        //     this.curMoney += p * v;
        //     if (this.curMoney > this.maxMoney) {
        //         this.maxMoney = this.curMoney;
        //     }
        // }
        // else {
        //     this.curValue += v;
        //     if (this.curValue > this.maxValue) {
        //         this.maxValue = this.curValue;
        //     }
        // }
    }

    output() {
        // let win = this.totalIn - this.totalOut;
        let sm = Math.max(Math.abs(this.minMoney), Math.abs(this.maxMoney));
        let sv = Math.max(Math.abs(this.minValue), Math.abs(this.maxValue));
        let sa = this.startPrice * sv + sm;

        this.startMoney += sm;
        this.curMoney += sm;
        this.minMoney += sm;
        this.maxMoney += sm;

        this.startValue += sv;
        this.curValue += sv;
        this.minValue += sv;
        this.maxValue += sv;

        this.startAssets += sa;
        this.curAssets += sa;
        this.minAssets += sa;
        this.maxAssets += sa;
        this.beforeMaxAssets += sa;

        this.maxDrawdown = (this.beforeMaxAssets - this.minAssets) / this.beforeMaxAssets;

        this.roi = this.curAssets / this.startAssets;
        console.log('totalOut ' + this.totalOut + ' totalIn ' + this.totalIn + ' ROI ' + this.roi);

        console.log(util.format('money %f/%f, [%f, %f]', this.curMoney, this.startMoney, this.minMoney, this.maxMoney));
        console.log(util.format('value %f/%f, [%f, %f]', this.curValue, this.startValue, this.minValue, this.maxValue));
        console.log(util.format('assets %f/%f, [%f, %f]', this.curAssets, this.startAssets, this.minAssets, this.maxAssets));

        console.log(util.format('totalnums %d, cancelper %f, winper %f', this.tradeNums, this.tradeCancelNums / this.tradeNums, this.tradeWinNums / this.tradeNums));
        console.log('max drawdown ' + this.maxDrawdown);
    }
};

exports.StrategyStatistics = StrategyStatistics;