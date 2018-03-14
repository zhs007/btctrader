"use strict";

const { HTTPDataStream, DEPTHINDEX, DEALTYPE, DEALSINDEX } = require('../../httpdatastream');

class BCEXDataStream extends HTTPDataStream {
    // cfg.baseurl - like https://api.bithumb.com/public/
    // cfg.symbol - btc
    constructor(cfg) {
        if (!cfg.hasOwnProperty('baseurl')) {
            cfg.baseurl = 'https://www.bcex.ca/';
        }

        if (!cfg.hasOwnProperty('symbol')) {
            cfg.symbol = 'btc2ckusd';
        }

        super(cfg);

        this.depthIndexAsk = 0;
        this.depthIndexBid = 0;

        // this.urlDepth = cfg.baseurl + 'Api_Order/tradeList';
        this.urlDepth = cfg.baseurl + 'Api_Order/depth';
        this.urlTrade = cfg.baseurl + 'recent_transactions/' + cfg.symbol;
    }

    _onChannel_Deals(data) {
        for (let i = 0; i < data.length; ++i) {
            let cn = data[data.length - i - 1];

            let hascurnode = false;
            for (let j = 0; j < this.deals.length; ++j) {
                if (this.deals[DEALSINDEX.ID] == cn.cont_no) {
                    hascurnode = true;
                    break;
                }
            }

            if (!hascurnode) {
                this.deals.push([
                    cn.cont_no,
                    parseFloat(cn.price),
                    parseFloat(cn.units_traded),
                    new Date(cn.transaction_date).getTime(),
                    cn.type == 'ask' ? DEALTYPE.BUY : DEALTYPE.SELL
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
                    asks.push([parseFloat(data.asks[ci].price), parseFloat(data.asks[ci].quantity)]);

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
                    asks.push([parseFloat(data.asks[ci].price), parseFloat(data.asks[ci].quantity)]);

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
                    bids.push([parseFloat(data.bids[ci].price), parseFloat(data.bids[ci].quantity)]);

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
                    bids.push([parseFloat(data.bids[ci].price), parseFloat(data.bids[ci].quantity)]);

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
                asks.push([parseFloat(data.asks[ci].price), parseFloat(data.asks[ci].quantity)]);
            }

            this.asks = asks;

            let bids = [];
            for (let ci = 0; ci < data.bids.length; ++ci) {
                bids.push([parseFloat(data.bids[ci].price), parseFloat(data.bids[ci].quantity)]);
            }

            this.bids = bids;
        }

        this._onDepth();
    }

    //------------------------------------------------------------------------------
    // HTTPDataStream

    _onTick() {
        this.startPost(this.urlDepth, { symbol: this.cfg.symbol }, (err, data) => {
            if (err) {
                console.log('bcex depth err ' + err);

                return ;
            }

            if (this.cfg.output_message) {
                console.log('bcex depth + ' + data);
            }

            let msg = JSON.parse(data);

            this._onChannel_Depth(msg.data);
        });

        // this.startRequest(this.urlTrade, (err, data) => {
        //     if (err) {
        //         console.log('bcex trade err ' + err);
        //
        //         return ;
        //     }
        //
        //     if (this.cfg.output_message) {
        //         console.log('bcex trade + ' + data);
        //     }
        //
        //     let msg = JSON.parse(data);
        //
        //     this._onChannel_Deals(msg.data);
        // });
    }
};

exports.BCEXDataStream = BCEXDataStream;