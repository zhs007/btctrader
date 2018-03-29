"use strict";

const { TraderCtrl } = require('../../traderctrl');
const { ORDERSIDE, ORDERTYPE, ORDERSTATE } = require('../../basedef');
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
    }

    _procConfig() {
        super._procConfig();

        if (!this.cfg.baseuri) {
            this.cfg.baseuri = 'https://testnet.bitmex.com';
        }

        if (!this.cfg.baseapipath) {
            this.cfg.baseapipath = '/api/v1/';
        }
    }

    _makeSignature(verb, cmd, expires, strparams) {
        let s = crypto.createHmac('sha256', this.cfg.apisecret).update(verb + (this.cfg.baseapipath + cmd) + expires + strparams).digest('hex');
        return s;
    }

    request(verb, cmd, params, callback) {
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

    newLimitOrder(isbuy, price, volume, callback) {
        this.request('POST', 'order', {
            symbol: this.cfg.symbol,
            ordType: 'Limit',
            orderQty: volume,
            price: price,
            side: isbuy ? 'Buy' : 'Sell'
        }, (err, res, body) => {
            if (callback) {
                callback([]);
            }
        });
    }

    newMarketOrder(isbuy, volume, callback) {
        this.request('POST', 'order', {
            symbol: this.cfg.symbol,
            ordType: 'Market',
            orderQty: volume,
            side: isbuy ? 'Buy' : 'Sell'
        }, (err, res, body) => {
            if (callback) {
                callback([]);
            }
        });
    }

};

exports.BitmexTraderCtrl = BitmexTraderCtrl;