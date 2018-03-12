"use strict";

const { WSDataStream, DEPTHINDEX, DEALTYPE } = require('../../wsdatastream');
// const pako = require('pako');

class BitfinexDataStream extends WSDataStream {
    // cfg.symbol - btcusdt
    constructor(cfg) {

        if (!cfg.hasOwnProperty('addr')) {
            cfg.addr = 'wss://api.bitfinex.com/ws/2';
        }

        if (!cfg.hasOwnProperty('symbol')) {
            cfg.symbol = 'BTCUSD';
        }

        super(cfg);

        this.bookChanId = 0;
        this.tradesChanId = 0;
        // this.channelDepth = 'market.' + this.cfg.symbol + '.depth.step0';
        // this.channelDetail = 'market.' + this.cfg.symbol + '.trade.detail';

        this.depthIndexAsk = 0;
        this.depthIndexBid = 0;
    }

    _procConfig() {
        super._procConfig();

        // if (!this.cfg.hasOwnProperty('depthlimit')) {
        //     this.cfg.depthlimit = 1000;
        // }
        //
        // if (!this.cfg.hasOwnProperty('tradeslimit')) {
        //     this.cfg.tradeslimit = 500;
        // }
    }

    _subscribe() {
        this.sendMsg({
            event: 'subscribe',
            channel: 'book',
            symbol: this.cfg.symbol,
            prec: 'P0',
            freq: 'F0',
            len: 100
        });

        this.sendMsg({
            event: 'subscribe',
            channel: 'trades',
            symbol: this.cfg.symbol,
        });

        // this.sendMsg({
        //     "sub": this.channelDetail,
        //     "id": this.cfg.symbol + 'detail'
        // });
    }

    _onChannelDepth(arr) {
        if (this.cfg.simtrade) {
            if (this.asks.length == 0 && this.bids.length == 0) {
                for (let ci = 0; ci < arr.length; ++ci) {
                    let cn = arr[ci];
                    let p = cn[0];
                    let c = cn[1];
                    let v = cn[2];

                    if (c > 0) {
                        if (v > 0) {
                            this.bids.push([p, v, ++this.depthIndexBid, v]);
                        }
                        else {
                            this.asks.push([p, -v, ++this.depthIndexAsk, -v]);
                        }
                    }
                }
            }
            else {
                // for (let ci = 0; ci < arr.length; ++ci) {
                    let cn = arr;
                    let p = cn[0];
                    let c = cn[1];
                    let v = cn[2];

                    if (c > 0) {
                        if (v > 0) {
                            let isproc = false;
                            for (let j = 0; j < this.bids.length; ++j) {
                                if (p == this.bids[j][DEPTHINDEX.PRICE]) {
                                    this.bids[j][DEPTHINDEX.VOLUME] = v;
                                    isproc = true;
                                    break;
                                }
                                else if (p > this.bids[j][DEPTHINDEX.PRICE]) {
                                    this.bids.splice(j, 0, [p, v, ++this.depthIndexBid, v]);
                                    isproc = true;
                                    break;
                                }
                            }

                            if (!isproc) {
                                this.bids.push([p, v, ++this.depthIndexBid, v]);
                            }
                        }
                        else {
                            let isproc = false;
                            for (let j = 0; j < this.asks.length; ++j) {
                                if (p == this.asks[j][DEPTHINDEX.PRICE]) {
                                    this.asks[j][DEPTHINDEX.VOLUME] = -v;
                                    isproc = true;
                                    break;
                                }
                                else if (p < this.asks[j][DEPTHINDEX.PRICE]) {
                                    this.asks.splice(j, 0, [p, -v, ++this.depthIndexAsk, -v]);
                                    isproc = true;
                                    break;
                                }
                            }

                            if (!isproc) {
                                this.asks.push([p, -v, ++this.depthIndexAsk, -v]);
                            }
                        }
                    }
                    else {
                        if (v > 0) {
                            for (let j = 0; j < this.bids.length; ++j) {
                                if (p == this.bids[j][DEPTHINDEX.PRICE]) {
                                    this.bids.splice(j, 1);
                                    break;
                                }
                            }
                        }
                        else {
                            let isproc = false;
                            for (let j = 0; j < this.asks.length; ++j) {
                                if (p == this.asks[j][DEPTHINDEX.PRICE]) {
                                    this.asks.splice(j, 1);
                                    break;
                                }
                            }
                        }
                    }
                // }
            }
        }
        else {
            if (this.asks.length > 0 && this.bids.length > 0) {
                for (let ci = 0; ci < arr.length; ++ci) {
                    let cn = arr[ci];
                    let p = cn[0];
                    let c = cn[1];
                    let v = cn[2];

                    if (c > 0) {
                        if (v > 0) {
                            this.bids.push([p, v]);
                        }
                        else {
                            this.asks.push([p, -v]);
                        }
                    }
                }
            }
            else {
                // for (let ci = 0; ci < arr.length; ++ci) {
                    let cn = arr;
                    let p = cn[0];
                    let c = cn[1];
                    let v = cn[2];

                    if (c > 0) {
                        if (v > 0) {
                            let isproc = false;
                            for (let j = 0; j < this.bids.length; ++j) {
                                if (p == this.bids[j][DEPTHINDEX.PRICE]) {
                                    this.bids[j][DEPTHINDEX.VOLUME] = v;
                                    isproc = true;
                                    break;
                                }
                                else if (p > this.bids[j][DEPTHINDEX.PRICE]) {
                                    this.bids.splice(j, 0, [p, v]);
                                    isproc = true;
                                    break;
                                }
                            }

                            if (!isproc) {
                                this.bids.push([p, v, ++this.depthIndexBid, v]);
                            }
                        }
                        else {
                            let isproc = false;
                            for (let j = 0; j < this.asks.length; ++j) {
                                if (p == this.asks[j][DEPTHINDEX.PRICE]) {
                                    this.asks[j][DEPTHINDEX.VOLUME] = -v;
                                    isproc = true;
                                    break;
                                }
                                else if (p < this.asks[j][DEPTHINDEX.PRICE]) {
                                    this.asks.splice(j, 0, [p, -v]);
                                    isproc = true;
                                    break;
                                }
                            }

                            if (!isproc) {
                                this.asks.push([p, -v, ++this.depthIndexAsk, -v]);
                            }
                        }
                    }
                    else {
                        if (v > 0) {
                            for (let j = 0; j < this.bids.length; ++j) {
                                if (p == this.bids[j][DEPTHINDEX.PRICE]) {
                                    this.bids.splice(j, 1);
                                    break;
                                }
                            }
                        }
                        else {
                            let isproc = false;
                            for (let j = 0; j < this.asks.length; ++j) {
                                if (p == this.asks[j][DEPTHINDEX.PRICE]) {
                                    this.asks.splice(j, 1);
                                    break;
                                }
                            }
                        }
                    }
                // }
            }
        }

        this._onDepth();
    }

    _onChannelDetail(data) {
        if (this.deals.length == 0) {
            for (let i = 0; i < data.length; ++i) {

                this.deals.push([
                    data[i][0],
                    data[i][3],
                    Math.abs(data[i][2]),
                    data[i][1],
                    data[i][2] > 0 ? DEALTYPE.BUY : DEALTYPE.SELL
                ]);
            }
        }
        else {
            this.deals.push([
                data[0],
                data[3],
                Math.abs(data[2]),
                data[1],
                data[2] > 0 ? DEALTYPE.BUY : DEALTYPE.SELL
            ]);
        }

        this._onDeals();
    }

    _onSubscribed(data) {
        if (data.channel == 'book') {
            this.bookChanId = data.chanId;
        }
        else if (data.channel == 'trades') {
            this.tradesChanId = data.chanId;
        }
    }

    //------------------------------------------------------------------------------
    // WSDataStream

    sendMsg(msg) {
        this._send(JSON.stringify(msg));
    }

    _onOpen() {
        super._onOpen();

        console.log('bitfinex open ');

        this._subscribe();
    }

    _onMsg(data) {
        super._onMsg(data);

        let text = data;
        // let text = pako.inflate(data, {to: 'string'});

        if (this.cfg.output_message) {
            console.log(text);
        }

        let curts = new Date().getTime();

        let msg = JSON.parse(text);
        if (Array.isArray(msg)) {
            if (msg[0] == this.bookChanId) {
                this._onChannelDepth(msg[1]);
            }
            if (msg[0] == this.tradesChanId) {
                if (Array.isArray(msg[1])) {
                    this._onChannelDetail(msg[1]);
                }
                else if (msg[2]) {
                    this._onChannelDetail(msg[2]);
                }
            }
        }
        else if (msg.event == 'subscribed') {
            this._onSubscribed(msg);
        }


        // if (msg.ping) {
        //     this.sendMsg({pong: msg.ping});
        // }
        // else if (msg.tick) {
        //     if (msg.ch == this.channelDepth) {
        //         this._onChannelDepth(msg.tick);
        //
        //         curts = new Date().getTime();
        //         if (msg.ts) {
        //             let off = curts - msg.ts;
        //             // console.log('huobi msgoff ' + off);
        //         }
        //     }
        //     else if (msg.ch == this.channelDetail) {
        //         this._onChannelDetail(msg.tick);
        //
        //         curts = new Date().getTime();
        //         if (msg.ts) {
        //             let off = curts - msg.ts;
        //             // console.log('huobi msgoff ' + off);
        //         }
        //     }
        // }
    }

    _onClose() {
        console.log('bitfinex close ');

        super._onClose();
    }

    _onError(err) {
        console.log('bitfinex error ' + JSON.stringify(err));

        super._onError(err);
    }

    _onKeepalive() {
    }
};

exports.BitfinexDataStream = BitfinexDataStream;