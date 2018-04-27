"use strict";

const { TraderCtrl } = require('../../traderctrl');
const { ORDERSIDE, ORDERTYPE, ORDERSTATE, TRADESIDE } = require('../../basedef');
const OrderMgr = require('../../ordermgr');
const { RunQueue, RUNQUEUE_RESULT } = require('../../runqueue');
const request = require('request');
const crypto = require('crypto');

class BitmexTraderCtrl extends TraderCtrl {
    // cfg.baseuri
    // cfg.baseapiuri
    // cfg.apikey
    // cfg.apisecret
    // cfg.symbol
    constructor(cfg) {
        super(cfg);

        this.runqueue = new RunQueue((node, callback) => {
            this._runRQ(node, callback);
        }, (result) => {
            return this._resultRQ(result);
        });
    }

    _procConfig() {
        super._procConfig();

        if (!this.cfg.baseuri) {
            this.cfg.baseuri = 'https://www.bitmex.com';
        }

        if (!this.cfg.baseapipath) {
            this.cfg.baseapipath = '/api/v1/';
        }
    }

    _addRQ(node) {
        this.runqueue.run(node);
    }

    _runRQ(node, callback) {
        this.__request(node.verb, node.cmd, node.params, (err, res, body) => {
            callback({
                node: node,
                err: err,
                res: res,
                body: body
            });
        });
    }

    _resultRQ(result) {
        if (result.err) {
            return RUNQUEUE_RESULT.RETRY;
        }

        try {
            let ret = JSON.parse(result.body);
            if (ret) {
                if (ret.error) {
                    return RUNQUEUE_RESULT.RETRY;
                }
            }
        }
        catch (err) {
            console.log('_resultRQ ' + err);

            return RUNQUEUE_RESULT.RETRY;
        }

        if (result.node && result.node.callback) {
            result.node.callback(result.err, result.res, result.body);
        }

        return RUNQUEUE_RESULT.OK;
    }

    _makeSignature(verb, cmd, expires, strparams) {
        let s = crypto.createHmac('sha256', this.cfg.apisecret).update(verb + (this.cfg.baseapipath + cmd) + expires + strparams).digest('hex');
        return s;
    }

    __request(verb, cmd, params, callback) {
        let expires = new Date().getTime() + (60 * 1000);
        let strparams = JSON.stringify(params);

        let headers = {
            'content-type': 'application/json',
            'Accept': 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
            'api-expires': expires,
            'api-key': this.cfg.apikey,
            'api-signature': this._makeSignature(verb, cmd, expires, strparams)
        };

        let ro = {
            headers: headers,
            url: this.cfg.baseuri + this.cfg.baseapipath + cmd,
            method: verb,
            body: strparams
        };

        this.log('log', JSON.stringify(ro));

        request(ro, (err, res, body) => {
            if (err) {
                this.log('error', JSON.stringify(err));
            }

            this.log('log', JSON.stringify(body));
            // let msg = JSON.parse(body);

            if (callback) {
                callback(err, res, body);
            }
        });
    }

    request(verb, cmd, params, callback) {
        this._addRQ({
            verb: verb,
            cmd: cmd,
            params: params,
            callback: callback
        });
        // let expires = new Date().getTime() + (60 * 1000);
        // let strparams = JSON.stringify(params);
        //
        // let headers = {
        //     'content-type': 'application/json',
        //     'Accept': 'application/json',
        //     'X-Requested-With': 'XMLHttpRequest',
        //     'api-expires': expires,
        //     'api-key': this.cfg.apikey,
        //     'api-signature': this._makeSignature(verb, cmd, expires, strparams)
        // };
        //
        // let ro = {
        //     headers: headers,
        //     url: this.cfg.baseuri + this.cfg.baseapipath + cmd,
        //     method: verb,
        //     body: strparams
        // };
        //
        // this.log('log', JSON.stringify(ro));
        //
        // request(ro, (err, res, body) => {
        //     if (err) {
        //         this.log('error', JSON.stringify(err));
        //     }
        //
        //     this.log('log', JSON.stringify(body));
        //     // let msg = JSON.parse(body);
        //
        //     if (callback) {
        //         callback(err, res, body);
        //     }
        // });
    }

    requestPromise(verb, cmd, params) {
        let expires = new Date().getTime() + (60 * 1000);
        let strparams = JSON.stringify(params);

        let headers = {
            'content-type': 'application/json',
            'Accept': 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
            'api-expires': expires,
            'api-key': this.cfg.apikey,
            'api-signature': this._makeSignature(verb, cmd, expires, strparams)
        };

        let ro = {
            headers: headers,
            url: this.cfg.baseuri + this.cfg.baseapipath + cmd,
            method: verb,
            body: strparams
        };

        return new Promise((resolve, reject) => {
            request(ro, (err, res, body) => {
                resolve({ err, res, body });
            });
        });
    }

    async getAllOrderList() {
        let lst = [];
        let count = 100;
        let start = 0;

        while (true) {
            let { err, res, body } = await this.requestPromise('GET', 'order', {symbol: this.symbol, start: start, count: count});
            if (err) {
                return lst;
            }

            let msg = JSON.parse(body);

            for (let i = 0; i < msg.length; ++i) {
                let co = msg[i];

                lst.push({
                    id: co.orderID,
                    symbol: co.symbol,
                    side: co.side == 'Buy' ? ORDERSIDE.BUY : ORDERSIDE.SELL,
                    openms: new Date(co.timestamp).getTime(),
                    closems: new Date(co.transactTime).getTime(),
                    type: co.ordType == 'Limit' ? ORDERTYPE.LIMIT : ORDERTYPE.MARKET,
                    price: co.price,
                    volume: co.orderQty,
                    avgprice: co.avgPx,
                    lastvolume: co.leavesQty,
                });
            }

            start += count;

            if (msg.length < count) {
                return lst;
            }
        }

        return lst;
    }

    async getOpenOrderList() {
        let lst = [];
        let count = 100;
        let start = 0;

        while (true) {
            let { err, res, body } = await this.requestPromise('GET', 'order', {symbol: this.cfg.symbol, open: true, start: start, count: count});
            if (err) {
                return lst;
            }

            let msg = JSON.parse(body);
            if (msg.length < count) {
                return lst;
            }

            for (let i = 0; i < msg.length; ++i) {
                let co = msg[i];

                lst.push({
                    id: co.orderID,
                    symbol: co.symbol,
                    side: co.side == 'Buy' ? ORDERSIDE.BUY : ORDERSIDE.SELL,
                    openms: new Date(co.timestamp).getTime(),
                    closems: new Date(co.transactTime).getTime(),
                    type: co.ordType == 'Limit' ? ORDERTYPE.LIMIT : ORDERTYPE.MARKET,
                    price: co.price,
                    volume: co.orderQty,
                    avgprice: co.avgPx,
                    lastvolume: co.leavesQty,
                });
            }

            start += count;
        }

        return lst;
    }

    countPositionWithTrade(position, trade) {
        if (trade.side == TRADESIDE.BUY) {
            let cv = trade.volume;
            if (position.volume < 0) {
                let tv = cv;
                if (cv > -position.volume) {
                    tv = -position.volume;
                }

                let cm = this.countMoney(trade.price, tv);
                position.money += cm;
                position.volume += tv;

                cv -= tv;
            }

            if (cv > 0) {
                let cm = this.countMoney(trade.price, cv);
                position.money -= cm;
                position.volume += cv;
            }
        }
        else {
            let cv = trade.volume;
            if (position.volume > 0) {
                let tv = cv;
                if (cv > position.volume) {
                    tv = position.volume;
                }

                let cm = this.countMoney(trade.price, tv);
                position.money += cm;

                cv -= tv;
            }

            if (cv > 0) {
                let cm = this.countMoney(trade.price, cv);
                position.money -= cm;
            }
        }
    }

    countMoney(price, volume) {
        return volume / price;
    }

    formatPrice(side, price) {
        let fp = price.toFixed(1);
        let arr = fp.split('.');
        if (arr.length == 2) {
            if (arr[1] == '0' || arr[1] == '5') {
                return parseFloat(fp);
            }

            if (side == ORDERSIDE.BUY) {
                if (arr[1] > 5) {
                    return parseFloat(arr[0] + '.5');
                }

                return parseFloat(arr[0] + '.0');
            }
            else {
                if (arr[1] > 5) {
                    return parseFloat((parseInt(arr[0]) + 1).toString() + '.0');
                }

                return parseFloat(arr[0] + '.5');
            }
        }

        return parseFloat(fp);
    }

    // _formatPrice(side, p) {
    //     let fp = p.toFixed(1);
    //     let arr = fp.split('.');
    //     if (arr.length == 2) {
    //         if (arr[1] == '0' || arr[1] == '5') {
    //             return parseFloat(fp);
    //         }
    //
    //         if (side == ORDERSIDE.BUY) {
    //             if (arr[1] > 5) {
    //                 return parseFloat(arr[0] + '.5');
    //             }
    //
    //             return parseFloat(arr[0] + '.0');
    //         }
    //         else {
    //             if (arr[1] > 5) {
    //                 return parseFloat((parseInt(arr[0]) + 1).toString() + '.0');
    //             }
    //
    //             return parseFloat(arr[0] + '.5');
    //         }
    //     }
    //
    //     return parseFloat(fp);
    // }

    // deleteOrder(order, callback) {
    //     this.log('debug', order);
    //
    //     if (!(order.ordstate == ORDERSTATE.OPEN || order.ordstate == ORDERSTATE.RUNNING)) {
    //         this.log('error', 'order state fail!');
    //
    //         return ;
    //     }
    //
    //     order.ordstate = ORDERSTATE.CANCEL;
    //
    //     this.request('DELETE', 'order', {
    //         clOrdID: order.mainid + '-' + order.indexid
    //     }, (err, res, body) => {
    //         if (callback) {
    //             callback(order);
    //         }
    //     });
    // }
    //
    // deleteOrderList(lstorder, callback) {
    //     this.log('debug', lstorder);
    //
    //     let arr = [];
    //     for (let i = 0; i < lstorder.length; ++i) {
    //         let co = lstorder[i];
    //
    //         if (!(co.ordstate == ORDERSTATE.OPEN || co.ordstate == ORDERSTATE.RUNNING)) {
    //             this.log('error', 'order state fail!');
    //         }
    //         else {
    //             order.ordstate = ORDERSTATE.CANCEL;
    //
    //             arr.push(co[i].mainid + '-' + co[i].indexid);
    //         }
    //     }
    //
    //     if (arr.length <= 0) {
    //         return ;
    //     }
    //
    //     this.request('DELETE', 'order', {
    //         clOrdID: arr
    //     }, (err, res, body) => {
    //         if (callback) {
    //             callback(order);
    //         }
    //     });
    // }

    // newLimitOrder(order, callback) {
    //     this.log('debug', order);
    //
    //     this.request('POST', 'order', {
    //         symbol: order.symbol,
    //         ordType: 'Limit',
    //         orderQty: order.volume,
    //         price: this._formatPrice(order.side, order.price),
    //         side: order.side == ORDERSIDE.BUY ? 'Buy' : 'Sell',
    //         clOrdID: order.mainid + '-' + order.indexid,
    //     }, (err, res, body) => {
    //         if (callback) {
    //             callback(order);
    //         }
    //     });
    // }
    //
    // newMarketOrder(order, callback) {
    //     this.log('debug', order);
    //
    //     this.request('POST', 'order', {
    //         symbol: order.symbol,
    //         ordType: 'Market',
    //         orderQty: order.volume,
    //         side: order.side == ORDERSIDE.BUY ? 'Buy' : 'Sell',
    //         clOrdID: order.mainid + '-' + order.indexid,
    //     }, (err, res, body) => {
    //         if (callback) {
    //             callback(order);
    //         }
    //     });
    // }
    //
    // newMakeMarketOrder(lstorder, callback) {
    //     let spo = lstorder[0];
    //     let slo = lstorder[1];
    //     let lstorders = [];
    //
    //     lstorders.push({
    //         symbol: spo.symbol,
    //         ordType: 'Limit',
    //         orderQty: spo.volume,
    //         price: this._formatPrice(spo.side, spo.price),
    //         side: spo.side == ORDERSIDE.BUY ? 'Buy' : 'Sell',
    //         // contingencyType: 'OneCancelsTheOther',
    //         // clOrdLinkID: slo.mainid + '-' + slo.indexid,
    //         clOrdID: spo.mainid + '-' + spo.indexid,
    //     });
    //
    //     lstorders.push({
    //         symbol: slo.symbol,
    //         ordType: 'Limit',
    //         orderQty: slo.volume,
    //         price: this._formatPrice(slo.side, slo.price),
    //         side: slo.side == ORDERSIDE.BUY ? 'Buy' : 'Sell',
    //         // contingencyType: 'OneCancelsTheOther',
    //         // clOrdLinkID: slo.mainid + '-' + slo.indexid,
    //         clOrdID: slo.mainid + '-' + slo.indexid,
    //     });
    //
    //     // if (slo.side == ORDERSIDE.BUY) {
    //     //     lstorders.push({
    //     //         symbol: slo.symbol,
    //     //         ordType: 'Stop',
    //     //         orderQty: slo.volume,
    //     //         // price: this._formatPrice(order.side, slo.price),
    //     //         stopPx: this._formatPrice(order.side, slo.price),
    //     //         side: 'Buy',
    //     //         contingencyType: 'OneCancelsTheOther',
    //     //         clOrdLinkID: spo.mainid + '-' + spo.indexid,
    //     //         clOrdID: slo.mainid + '-' + slo.indexid,
    //     //     });
    //     // }
    //     // else {
    //     //     lstorders.push({
    //     //         symbol: slo.symbol,
    //     //         ordType: 'Stop',
    //     //         orderQty: slo.volume,
    //     //         // price: this._formatPrice(order.side, slo.price),
    //     //         stopPx: this._formatPrice(order.side, slo.price),
    //     //         side: 'Sell',
    //     //         contingencyType: 'OneCancelsTheOther',
    //     //         clOrdLinkID: spo.mainid + '-' + spo.indexid,
    //     //         clOrdID: slo.mainid + '-' + slo.indexid,
    //     //     });
    //     // }
    //
    //     this.request('POST', 'order/bulk', {
    //         orders: lstorders,
    //     }, (err, res, body) => {
    //         if (callback) {
    //             callback(order);
    //         }
    //     });
    // }
    //
    // newStopProfitAndLossOrder(order, callback) {
    //     this.log('debug', order);
    //
    //     let spo = order.lstchild[0];
    //     let slo = order.lstchild[1];
    //     let lstorders = [];
    //
    //     lstorders.push({
    //         symbol: spo.symbol,
    //         ordType: 'Limit',
    //         orderQty: spo.volume,
    //         price: this._formatPrice(order.side, spo.price),
    //         side: spo.side == ORDERSIDE.BUY ? 'Buy' : 'Sell',
    //         contingencyType: 'OneCancelsTheOther',
    //         clOrdLinkID: slo.mainid + '-' + slo.indexid,
    //         clOrdID: spo.mainid + '-' + spo.indexid,
    //     });
    //
    //     if (slo.side == ORDERSIDE.BUY) {
    //         lstorders.push({
    //             symbol: slo.symbol,
    //             ordType: 'Stop',
    //             orderQty: slo.volume,
    //             // price: this._formatPrice(order.side, slo.price),
    //             stopPx: this._formatPrice(order.side, slo.price),
    //             side: 'Buy',
    //             contingencyType: 'OneCancelsTheOther',
    //             clOrdLinkID: spo.mainid + '-' + spo.indexid,
    //             clOrdID: slo.mainid + '-' + slo.indexid,
    //         });
    //     }
    //     else {
    //         lstorders.push({
    //             symbol: slo.symbol,
    //             ordType: 'Stop',
    //             orderQty: slo.volume,
    //             // price: this._formatPrice(order.side, slo.price),
    //             stopPx: this._formatPrice(order.side, slo.price),
    //             side: 'Sell',
    //             contingencyType: 'OneCancelsTheOther',
    //             clOrdLinkID: spo.mainid + '-' + spo.indexid,
    //             clOrdID: slo.mainid + '-' + slo.indexid,
    //         });
    //     }
    //
    //     this.request('POST', 'order/bulk', {
    //         orders: lstorders,
    //     }, (err, res, body) => {
    //         if (callback) {
    //             callback(order);
    //         }
    //     });
    // }
    //
    // newStopLossOrder(order, callback) {
    //     this.log('debug', order);
    //
    //     this.request('POST', 'order', {
    //         symbol: order.symbol,
    //         ordType: 'Stop',
    //         orderQty: order.volume,
    //         stopPx: this._formatPrice(order.side, order.stopprice),
    //         side: order.side == ORDERSIDE.BUY ? 'Buy' : 'Sell',
    //         clOrdID: order.mainid + '-' + order.indexid,
    //     }, (err, res, body) => {
    //         if (callback) {
    //             callback(order);
    //         }
    //     });
    // }

    createOrders(lstorder, callback) {
        let lst = [];

        for (let i = 0; i < lstorder.length; ++i) {
            let co = lstorder[i];

            if (co.ordtype == ORDERTYPE.LIMIT) {
                lst.push({
                    symbol: co.symbol,
                    ordType: 'Limit',
                    orderQty: co.volume,
                    price: this.formatPrice(co.side, co.price),
                    side: co.side == ORDERSIDE.BUY ? 'Buy' : 'Sell',
                    clOrdID: co.mainid + '-' + co.indexid,
                });
            }
            else if (co.ordtype == ORDERTYPE.MARKET) {
                lst.push({
                    symbol: co.symbol,
                    ordType: 'Market',
                    orderQty: co.volume,
                    side: co.side == ORDERSIDE.BUY ? 'Buy' : 'Sell',
                    clOrdID: co.mainid + '-' + co.indexid,
                });
            }
            else if (co.ordtype == ORDERTYPE.STOP) {
                lst.push({
                    symbol: co.symbol,
                    ordType: 'Stop',
                    orderQty: co.volume,
                    stopPx: this.formatPrice(co.side, co.stopprice),
                    side: co.side == ORDERSIDE.BUY ? 'Buy' : 'Sell',
                    clOrdID: co.mainid + '-' + co.indexid,
                });
            }
        }

        if (lst.length <= 0) {
            return ;
        }

        this.request('POST', 'order/bulk', {
            orders: lst,
        }, (err, res, body) => {
            if (callback) {
                callback(order);
            }
        });
    }

    deleteOrders(lstorder, callback) {
        this.log('debug', lstorder);

        let lst = [];
        for (let i = 0; i < lstorder.length; ++i) {
            let co = lstorder[i];

            // if (!(co.ordstate == ORDERSTATE.OPEN || co.ordstate == ORDERSTATE.RUNNING)) {
            //     this.log('error', 'order state fail!');
            // }
            // else {
                // order.ordstate = ORDERSTATE.CANCEL;

                lst.push(co.mainid + '-' + co.indexid);
            // }
        }

        if (lst.length <= 0) {
            return ;
        }

        this.request('DELETE', 'order', {
            clOrdID: lst
        }, (err, res, body) => {
            if (callback) {
                callback(order);
            }
        });
    }

    updOrders(lstorder, callback) {
    }

};

exports.BitmexTraderCtrl = BitmexTraderCtrl;