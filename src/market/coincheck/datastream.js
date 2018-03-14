"use strict";

const { HTTPDataStream, DEPTHINDEX, DEALTYPE, DEALSINDEX } = require('../../httpdatastream');

class CoinCheckDataStream extends HTTPDataStream {
    // cfg.baseurl - like https://api.bithumb.com/public/
    // cfg.symbol - btc
    constructor(cfg) {
        if (!cfg.hasOwnProperty('baseurl')) {
            cfg.baseurl = 'https://coincheck.com';
        }

        if (!cfg.hasOwnProperty('symbol')) {
            cfg.symbol = 'btc';
        }

        super(cfg);

        this.depthIndexAsk = 0;
        this.depthIndexBid = 0;

        this.urlDepth = cfg.baseurl + '/api/order_books';
        this.urlTrade = cfg.baseurl + '/api/trades?pair=btc_jpy';
    }

    _onChannel_Deals(data) {
        for (let i = 0; i < data.length; ++i) {
            let cn = data[data.length - i - 1];

            let hascurnode = false;
            for (let j = 0; j < this.deals.length; ++j) {
                if (this.deals[DEALSINDEX.ID] == cn.id) {
                    hascurnode = true;
                    break;
                }
            }

            if (!hascurnode) {
                this.deals.push([
                    cn.id,
                    parseFloat(cn.rate),
                    parseFloat(cn.amount),
                    new Date(cn.created_at).getTime(),
                    cn.order_type == 'buy' ? DEALTYPE.BUY : DEALTYPE.SELL
                ]);
            }
        }

        this._onDeals();
    }

    _onChannel_Depth(data) {
        if (this.cfg.simtrade) {
            if (this.asks.length > 0) {
                let asks = [];
                let oi = 0;
                for (let ci = 0; ci < data.asks.length; ++ci) {
                    asks.push([parseFloat(data.asks[ci][0]), parseFloat(data.asks[ci][1])]);

                    for (; oi < this.asks.length; ++oi) {
                        if (asks[ci][DEPTHINDEX.PRICE] == this.asks[oi][DEPTHINDEX.PRICE]) {

                            if (asks[ci].length == 2) {
                                asks[ci].push(this.asks[oi][DEPTHINDEX.ID]);
                                asks[ci].push(asks[ci][DEPTHINDEX.VOLUME] - this.asks[oi][DEPTHINDEX.VOLUME] + this.asks[oi][DEPTHINDEX.LASTVOLUME]);
                            }
                            else {
                                asks[ci][DEPTHINDEX.LASTVOLUME] = asks[ci][DEPTHINDEX.VOLUME] - this.asks[oi][DEPTHINDEX.VOLUME] + this.asks[oi][DEPTHINDEX.LASTVOLUME];
                            }

                            break;
                        }
                        else if (asks[ci][DEPTHINDEX.PRICE] < this.asks[oi][DEPTHINDEX.PRICE]) {

                            if (asks[ci].length == 2) {
                                asks[ci].push(++this.depthIndexAsk);
                                asks[ci].push(asks[ci][DEPTHINDEX.VOLUME]);
                            }

                            break;
                        }
                        else {
                            ++oi;
                        }
                    }

                    if (asks[ci].length == 2) {
                        asks[ci].push(++this.depthIndexAsk);
                        asks[ci].push(asks[ci][DEPTHINDEX.VOLUME]);
                    }
                }

                this.asks = asks;
            }
            else {
                let asks = [];
                for (let ci = 0; ci < data.asks.length; ++ci) {
                    asks.push([parseFloat(data.asks[ci][0]), parseFloat(data.asks[ci][1])]);

                    if (asks[ci].length == 2) {
                        asks[ci].push(++this.depthIndexAsk);
                        asks[ci].push(asks[ci][DEPTHINDEX.VOLUME]);
                    }
                }

                this.asks = asks;
            }

            if (this.bids.length > 0) {
                let bids = [];
                let oi = 0;
                for (let ci = 0; ci < data.bids.length; ++ci) {
                    bids.push([parseFloat(data.bids[ci][0]), parseFloat(data.bids[ci][1])]);

                    for (; oi < this.bids.length; ++oi) {
                        if (bids[ci][DEPTHINDEX.PRICE] == this.bids[oi][DEPTHINDEX.PRICE]) {

                            if (bids[ci].length == 2) {
                                bids[ci].push(this.bids[oi][DEPTHINDEX.ID]);
                                bids[ci].push(bids[ci][DEPTHINDEX.VOLUME] - this.bids[oi][DEPTHINDEX.VOLUME] + this.bids[oi][DEPTHINDEX.LASTVOLUME]);
                            }
                            else {
                                bids[ci][DEPTHINDEX.LASTVOLUME] = bids[ci][DEPTHINDEX.VOLUME] - this.bids[oi][DEPTHINDEX.VOLUME] + this.bids[oi][DEPTHINDEX.LASTVOLUME];
                            }

                            break;
                        }
                        else if (bids[ci][DEPTHINDEX.PRICE] > this.bids[oi][DEPTHINDEX.PRICE]) {

                            if (bids[ci].length == 2) {
                                bids[ci].push(++this.depthIndexBid);
                                bids[ci].push(bids[ci][DEPTHINDEX.VOLUME]);
                            }

                            break;
                        }
                        else {
                            ++oi;
                        }
                    }

                    if (bids[ci].length == 2) {
                        bids[ci].push(++this.depthIndexAsk);
                        bids[ci].push(bids[ci][DEPTHINDEX.VOLUME]);
                    }
                }

                this.bids = bids;
            }
            else {
                let bids = [];
                for (let ci = 0; ci < data.bids.length; ++ci) {
                    bids.push([parseFloat(data.bids[ci][0]), parseFloat(data.bids[ci][1])]);

                    if (bids[ci].length == 2) {
                        bids[ci].push(++this.depthIndexBid);
                        bids[ci].push(bids[ci][DEPTHINDEX.VOLUME]);
                    }
                }

                this.bids = bids;
            }
        }
        else {
            let asks = [];
            for (let ci = 0; ci < data.asks.length; ++ci) {
                asks.push([parseFloat(data.asks[ci][0]), parseFloat(data.asks[ci][1])]);
            }

            this.asks = asks;

            let bids = [];
            for (let ci = 0; ci < data.bids.length; ++ci) {
                bids.push([parseFloat(data.bids[ci][0]), parseFloat(data.bids[ci][1])]);
            }

            this.bids = bids;
        }

        this._onDepth();
    }

    //------------------------------------------------------------------------------
    // HTTPDataStream

    _onTick() {
        this.startRequest(this.urlDepth, (err, data) => {
            if (err) {
                console.log('coincheck depth err ' + err);

                return ;
            }

            if (this.cfg.output_message) {
                console.log('coincheck depth + ' + data);
            }

            let msg = JSON.parse(data);

            this._onChannel_Depth(msg);
        });

        this.startRequest(this.urlTrade, (err, data) => {
            if (err) {
                console.log('coincheck trade err ' + err);

                return ;
            }

            if (this.cfg.output_message) {
                console.log('coincheck trade + ' + data);
            }

            let msg = JSON.parse(data);

            this._onChannel_Deals(msg.data);
        });
    }
};

exports.CoinCheckDataStream = CoinCheckDataStream;