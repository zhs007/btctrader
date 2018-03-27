"use strict";

const { PusherDataStream } = require('../../pusherdatastream');
const { DEPTHINDEX, DEALSINDEX, DEALTYPE } = require('../../basedef');

class BitstampDataStream extends PusherDataStream {
    // cfg.pusherkey - like de504dc5763aeef9ff52
    // cfg.symbol - btcusd
    constructor(cfg) {
        super(cfg);

        this.depthIndexAsk = 0;
        this.depthIndexBid = 0;
    }

    _procConfig() {
        super._procConfig();

        if (!this.cfg.pusherkey) {
            this.cfg.pusherkey = 'de504dc5763aeef9ff52';
        }

        if (!this.cfg.symbol) {
            this.cfg.symbol = 'btcusd';
        }
    }

    _getChannel_trades() {
        if (this.cfg.symbol == 'btcusd') {
            return 'live_trades';
        }

        return 'live_trades_' + this.cfg.symbol;
    }

    _getChannel_orderbook() {
        if (this.cfg.symbol == 'btcusd') {
            return 'order_book';
        }

        return 'order_book_' + this.cfg.symbol;
    }

    init() {
        console.log('bitstamp init. ');

        this.subscribe(this._getChannel_trades(), 'trade', (msg) => {
            this._onTrades(msg);
        });

        this.subscribe(this._getChannel_orderbook(), 'data', (msg) => {
            this._onOrderBook(msg);
        });
    }

    _onTrades(msg) {
        if (this.cfg.output_message) {
            console.log(JSON.stringify(msg));
        }

        this.deals.push([
            msg.id,
            parseFloat(msg.price),
            parseFloat(msg.amount),
            new Date(msg.timestamp * 1000).getTime(),
            msg.type == 0 ? DEALTYPE.BUY : DEALTYPE.SELL
        ]);
    }

    _onOrderBook(data) {
        if (this.cfg.output_message) {
            console.log(JSON.stringify(data));
        }

        if (this.cfg.simtrade) {
            if (this.asks.length > 0) {
                let oi = 0;
                for (let ci = 0; ci < data.asks.length; ++ci) {
                    let p = parseFloat(data.asks[ci][DEPTHINDEX.PRICE]);
                    let v = parseFloat(data.asks[ci][DEPTHINDEX.VOLUME]);

                    data.asks[ci][DEPTHINDEX.PRICE] = p;
                    data.asks[ci][DEPTHINDEX.VOLUME] = v;

                    for (; oi < this.asks.length; ++oi) {
                        if (data.asks[ci][DEPTHINDEX.PRICE] == this.asks[oi][DEPTHINDEX.PRICE]) {

                            if (data.asks[ci].length == 2) {
                                data.asks[ci].push(this.asks[oi][DEPTHINDEX.ID]);
                                data.asks[ci].push(v - this.asks[oi][DEPTHINDEX.VOLUME] + this.asks[oi][DEPTHINDEX.LASTVOLUME]);
                            }
                            else {
                                data.asks[ci][DEPTHINDEX.LASTVOLUME] = v - this.asks[oi][DEPTHINDEX.VOLUME] + this.asks[oi][DEPTHINDEX.LASTVOLUME];
                            }

                            break;
                        }
                        else if (p < this.asks[oi][DEPTHINDEX.PRICE]) {

                            if (data.asks[ci].length == 2) {
                                data.asks[ci].push(++this.depthIndexAsk);
                                data.asks[ci].push(v);
                            }

                            break;
                        }
                        else {
                            ++oi;
                        }
                    }

                    if (data.asks[ci].length == 2) {
                        data.asks[ci].push(++this.depthIndexAsk);
                        data.asks[ci].push(v);
                    }
                }
            }
            else {
                for (let ci = 0; ci < data.asks.length; ++ci) {
                    let p = parseFloat(data.asks[ci][DEPTHINDEX.PRICE]);
                    let v = parseFloat(data.asks[ci][DEPTHINDEX.VOLUME]);

                    data.asks[ci][DEPTHINDEX.PRICE] = p;
                    data.asks[ci][DEPTHINDEX.VOLUME] = v;

                    if (data.asks[ci].length == 2) {
                        data.asks[ci].push(++this.depthIndexAsk);
                        data.asks[ci].push(v);
                    }
                }
            }

            if (this.bids.length > 0) {
                let oi = 0;
                for (let ci = 0; ci < data.bids.length; ++ci) {
                    let p = parseFloat(data.bids[ci][DEPTHINDEX.PRICE]);
                    let v = parseFloat(data.bids[ci][DEPTHINDEX.VOLUME]);

                    data.bids[ci][DEPTHINDEX.PRICE] = p;
                    data.bids[ci][DEPTHINDEX.VOLUME] = v;

                    for (; oi < this.bids.length; ++oi) {
                        if (data.bids[ci][DEPTHINDEX.PRICE] == this.bids[oi][DEPTHINDEX.PRICE]) {

                            if (data.bids[ci].length == 2) {
                                data.bids[ci].push(this.bids[oi][DEPTHINDEX.ID]);
                                data.bids[ci].push(v - this.bids[oi][DEPTHINDEX.VOLUME] + this.bids[oi][DEPTHINDEX.LASTVOLUME]);
                            }
                            else {
                                data.bids[ci][DEPTHINDEX.LASTVOLUME] = v - this.bids[oi][DEPTHINDEX.VOLUME] + this.bids[oi][DEPTHINDEX.LASTVOLUME];
                            }

                            break;
                        }
                        else if (p > this.bids[oi][DEPTHINDEX.PRICE]) {

                            if (data.bids[ci].length == 2) {
                                data.bids[ci].push(++this.depthIndexBid);
                                data.bids[ci].push(v);
                            }

                            break;
                        }
                        else {
                            ++oi;
                        }
                    }

                    if (data.bids[ci].length == 2) {
                        data.bids[ci].push(++this.depthIndexAsk);
                        data.bids[ci].push(v);
                    }
                }
            }
            else {
                for (let ci = 0; ci < data.bids.length; ++ci) {
                    let p = parseFloat(data.bids[ci][DEPTHINDEX.PRICE]);
                    let v = parseFloat(data.bids[ci][DEPTHINDEX.VOLUME]);

                    data.bids[ci][DEPTHINDEX.PRICE] = p;
                    data.bids[ci][DEPTHINDEX.VOLUME] = v;

                    if (data.bids[ci].length == 2) {
                        data.bids[ci].push(++this.depthIndexBid);
                        data.bids[ci].push(v);
                    }
                }
            }

            this.asks = data.asks;
            this.bids = data.bids;
        }
        else {
            this.asks = data.asks;
            this.bids = data.bids;
        }

        this._onDepth();
    }
};

exports.BitstampDataStream = BitstampDataStream;