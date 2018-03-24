"use strict";

const { TRADETYPE } = require('./basedef');

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

        this.maxDrawdown = 0;
    }

    onStart(money, value, price) {
        this.startMoney = money;
        this.curMoney = money;
        this.maxMoney = money;
        this.minMoney = money;

        this.startValue = value;
        this.curValue = value;
        this.maxValue = value;
        this.minValue = value;

        let ca = money + value * price;
        this.startAssets = ca;
        this.curAssets = ca;
        this.maxAssets = ca;
        this.minAssets = ca;

        this.tradeNums = 0;
        this.tradeDealNums = 0;
        this.tradeWinNums = 0;

        this.totalIn = 0;
        this.totalOut = 0;

        this.maxDrawdown = 0;
    }

    onDealPrice(p) {
        this.curAssets = this.curMoney + this.curValue * p;
        if (this.curAssets < this.minAssets) {
            this.minAssets = this.curAssets;

            this.maxDrawdown = (this.maxAssets - this.minAssets) / this.maxAssets;
        }

        if (this.curAssets > this.maxAssets) {
            this.maxAssets = this.curAssets;
        }
    }

    onOpen(type, p, v) {
        this.tradeNums++;

        // this.totalOut += p * v;
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

        // this.totalIn += p * v;

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
        // this.totalOut += p * v;

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
        // this.totalIn += p * v;

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

        // this.totalIn += p * v;
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
        let win = this.totalIn - this.totalOut;
        let src = Math.max(Math.abs(this.minMoney), Math.abs(this.maxMoney));
        let roi = this.curAssets / this.startAssets;
        console.log('totalOut ' + this.totalOut + ' totalIn ' + this.totalIn + ' ROI ' + roi);
        console.log('lastMoney ' + this.curMoney + ' [' + this.minMoney + ',' + this.maxMoney + ']');
        console.log('cancelper ' + this.tradeCancelNums / this.tradeNums + ' winper ' + this.tradeWinNums / this.tradeNums);
        console.log('max drawdown ' + this.maxDrawdown);
    }
};

exports.StrategyStatistics = StrategyStatistics;