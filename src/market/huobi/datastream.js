"use strict";

const { WSDataStream } = require('../../wsdatastream');
const { DEPTHINDEX, DEALSINDEX, DEALTYPE } = require('../../basedef');
const pako = require('pako');

class HuoBiDataStream extends WSDataStream {
    // cfg.symbol - btcusdt
    constructor(cfg) {
        super(cfg);

        this.channelDepth = 'market.' + this.cfg.symbol + '.depth.step0';
        this.channelDetail = 'market.' + this.cfg.symbol + '.trade.detail';

        this.depthIndexAsk = 0;
        this.depthIndexBid = 0;
    }

    _subscribe() {
        this.sendMsg({
            "sub": this.channelDepth,
            "id": this.cfg.symbol + 'depth'
        });

        this.sendMsg({
            "sub": this.channelDetail,
            "id": this.cfg.symbol + 'detail'
        });
    }

    _onChannelDepth(data) {
        if (this.cfg.simtrade) {
            if (this.asks.length > 0) {
                let oi = 0;
                for (let ci = 0; ci < data.asks.length; ++ci) {
                    for (; oi < this.asks.length; ++oi) {
                        if (data.asks[ci][DEPTHINDEX.PRICE] == this.asks[oi][DEPTHINDEX.PRICE]) {

                            if (data.asks[ci].length == 2) {
                                data.asks[ci].push(this.asks[oi][DEPTHINDEX.ID]);
                                data.asks[ci].push(data.asks[ci][DEPTHINDEX.VOLUME] - this.asks[oi][DEPTHINDEX.VOLUME] + this.asks[oi][DEPTHINDEX.LASTVOLUME]);
                            }
                            else {
                                // data.asks[ci][DEPTHINDEX.ID] = this.asks[oi][DEPTHINDEX.ID];
                                data.asks[ci][DEPTHINDEX.LASTVOLUME] = data.asks[ci][DEPTHINDEX.VOLUME] - this.asks[oi][DEPTHINDEX.VOLUME] + this.asks[oi][DEPTHINDEX.LASTVOLUME];
                            }

                            break;
                        }
                        else if (data.asks[ci][DEPTHINDEX.PRICE] < this.asks[oi][DEPTHINDEX.PRICE]) {

                            if (data.asks[ci].length == 2) {
                                data.asks[ci].push(++this.depthIndexAsk);
                                data.asks[ci].push(data.asks[ci][DEPTHINDEX.VOLUME]);
                            }

                            break;

                            // else {
                                // data.asks[ci][DEPTHINDEX.ID] = this.asks[oi][DEPTHINDEX.ID];
                                // data.asks[ci][DEPTHINDEX.LASTVOLUME] = data.asks[ci][DEPTHINDEX.VOLUME];
                            // }
                        }
                        else {
                            ++oi;
                        }
                    }

                    if (data.asks[ci].length == 2) {
                        data.asks[ci].push(++this.depthIndexAsk);
                        data.asks[ci].push(data.asks[ci][DEPTHINDEX.VOLUME]);
                    }
                }
            }
            else {
                for (let ci = 0; ci < data.asks.length; ++ci) {
                    if (data.asks[ci].length == 2) {
                        data.asks[ci].push(++this.depthIndexAsk);
                        data.asks[ci].push(data.asks[ci][DEPTHINDEX.VOLUME]);
                    }
                }
            }

            if (this.bids.length > 0) {
                let oi = 0;
                for (let ci = 0; ci < data.bids.length; ++ci) {
                    for (; oi < this.bids.length; ++oi) {
                        if (data.bids[ci][DEPTHINDEX.PRICE] == this.bids[oi][DEPTHINDEX.PRICE]) {

                            if (data.bids[ci].length == 2) {
                                data.bids[ci].push(this.bids[oi][DEPTHINDEX.ID]);
                                data.bids[ci].push(data.bids[ci][DEPTHINDEX.VOLUME] - this.bids[oi][DEPTHINDEX.VOLUME] + this.bids[oi][DEPTHINDEX.LASTVOLUME]);
                            }
                            else {
                                // data.asks[ci][DEPTHINDEX.ID] = this.asks[oi][DEPTHINDEX.ID];
                                data.bids[ci][DEPTHINDEX.LASTVOLUME] = data.bids[ci][DEPTHINDEX.VOLUME] - this.bids[oi][DEPTHINDEX.VOLUME] + this.bids[oi][DEPTHINDEX.LASTVOLUME];
                            }

                            break;
                        }
                        else if (data.bids[ci][DEPTHINDEX.PRICE] > this.bids[oi][DEPTHINDEX.PRICE]) {

                            if (data.bids[ci].length == 2) {
                                data.bids[ci].push(++this.depthIndexBid);
                                data.bids[ci].push(data.bids[ci][DEPTHINDEX.VOLUME]);
                            }

                            break;

                            // else {
                            // data.asks[ci][DEPTHINDEX.ID] = this.asks[oi][DEPTHINDEX.ID];
                            // data.asks[ci][DEPTHINDEX.LASTVOLUME] = data.asks[ci][DEPTHINDEX.VOLUME];
                            // }
                        }
                        else {
                            ++oi;
                        }
                    }

                    if (data.bids[ci].length == 2) {
                        data.bids[ci].push(++this.depthIndexAsk);
                        data.bids[ci].push(data.bids[ci][DEPTHINDEX.VOLUME]);
                    }
                }
            }
            else {
                for (let ci = 0; ci < data.bids.length; ++ci) {
                    if (data.bids[ci].length == 2) {
                        data.bids[ci].push(++this.depthIndexBid);
                        data.bids[ci].push(data.bids[ci][DEPTHINDEX.VOLUME]);
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

    _onChannelDetail(data) {
        for (let i = 0; i < data.data.length; ++i) {

            this.deals.push([
                data.data[i].id,
                parseFloat(data.data[i].price),
                parseFloat(data.data[i].amount),
                data.data[i].ts,
                data.data[i].direction == 'buy' ? DEALTYPE.BUY : DEALTYPE.SELL
            ]);
        }

        this._onDeals();
    }

    //------------------------------------------------------------------------------
    // WSDataStream

    sendMsg(msg) {
        this._send(JSON.stringify(msg));
    }

    _onOpen() {
        super._onOpen();

        console.log('huobi open ');

        this._subscribe();
    }

    _onMsg(data) {
        super._onMsg(data);

        let text = pako.inflate(data, {to: 'string'});

        if (this.cfg.output_message) {
            console.log(text);
        }

        let curts = new Date().getTime();

        let msg = JSON.parse(text);
        if (msg.ping) {
            this.sendMsg({pong: msg.ping});
        }
        else if (msg.tick) {
            if (msg.ch == this.channelDepth) {
                this._onChannelDepth(msg.tick);

                curts = new Date().getTime();
                if (msg.ts) {
                    let off = curts - msg.ts;
                    // console.log('huobi msgoff ' + off);
                }
            }
            else if (msg.ch == this.channelDetail) {
                this._onChannelDetail(msg.tick);

                curts = new Date().getTime();
                if (msg.ts) {
                    let off = curts - msg.ts;
                    // console.log('huobi msgoff ' + off);
                }
            }
        }
    }

    _onClose() {
        console.log('huobi close ');

        super._onClose();
    }

    _onError(err) {
        console.log('huobi error ' + JSON.stringify(err));

        super._onError(err);
    }

    _onKeepalive() {
    }
};

exports.HuoBiDataStream = HuoBiDataStream;