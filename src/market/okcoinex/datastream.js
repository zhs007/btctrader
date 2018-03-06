"use strict";

const WebSocket = require('ws');
// const pako = require('pako');

class OKCoinEXDataStream {
    // cfg.addr - like wss://real.okex.com:10441/websocket
    // cfg.symbol - btc_usdt
    constructor(cfg) {
        this.cfg = cfg;
        this.ws = undefined;

        this.asks = [];
        this.bids = [];

        this.channel = 'ok_sub_spot_' + this.cfg.symbol + '_depth';
    }

    _send(msg) {
        this.ws.send(JSON.stringify(msg));
    }

    _addChannel(symbol) {
        this._send({
            event: 'addChannel',
            channel: 'ok_sub_spot_' + symbol + '_depth'
        });

        // this._send({
        //     "sub": 'market.' + symbol + '.kline.1min',
        //     "id": symbol + 'kline'
        // });
    }

    _onChannel(data) {
        if (data.asks) {
            if (this.asks.length == 0) {
                for (let i = 0; i < data.asks.length; ++i) {
                    let cn = data.asks[i];
                    let p = parseFloat(cn[0]);
                    let v = parseFloat(cn[1]);

                    this.asks.push([p, v]);
                }
            }
            else {
                let mi = 0;
                for (let i = 0; i < data.asks.length; ++i) {
                    let cn = data.asks[i];
                    let p = parseFloat(cn[0]);
                    let v = parseFloat(cn[1]);

                    for (; mi < this.asks.length; ++mi) {
                        if (this.asks[mi][0] <= p) {
                            break ;
                        }
                    }

                    if (mi == this.asks.length) {
                        this.asks.push([p, v]);
                    }
                    else if (this.asks[mi][0] != p) {
                        this.asks.splice(mi, [p, v]);
                    }
                    else {
                        if (v == 0) {
                            this.asks.splice(mi, 1);
                        }
                        else {
                            this.asks[mi][1] = v;
                        }
                    }
                }
            }

            // console.log('asks' + JSON.stringify(this.asks));
        }

        if (data.bids) {
            if (this.bids.length == 0) {
                for (let i = 0; i < data.bids.length; ++i) {
                    let cn = data.bids[i];
                    let p = parseFloat(cn[0]);
                    let v = parseFloat(cn[1]);

                    this.bids.push([p, v]);
                }
            }
            else {
                let mi = 0;
                for (let i = 0; i < data.bids.length; ++i) {
                    let cn = data.bids[i];
                    let p = parseFloat(cn[0]);
                    let v = parseFloat(cn[1]);

                    for (; mi < this.bids.length; ++mi) {
                        if (this.bids[mi][0] >= p) {
                            break ;
                        }
                    }

                    if (mi == this.bids.length) {
                        this.bids.push([p, v]);
                    }
                    else if (this.bids[mi][0] != p) {
                        this.bids.splice(mi, [p, v]);
                    }
                    else {
                        if (v == 0) {
                            this.bids.splice(mi, 1);
                        }
                        else {
                            this.bids[mi][1] = v;
                        }
                    }
                }
            }

            // console.log('bids' + JSON.stringify(this.bids));
        }
    }

    init() {
        this.ws = new WebSocket(this.cfg.addr);

        this.ws.on('open', () => {
            console.log('open ');

            this._addChannel(this.cfg.symbol);
        });

        this.ws.on('message', (data) => {

            let text = data;
            let curts = new Date().getTime();

            // console.log('msg ' + text + curts);

            let arr = JSON.parse(text);
            if (Array.isArray(arr)) {
                for (let i = 0; i < arr.length; ++i) {
                    let msg = arr[i];

                    if (msg.channel) {
                        if (msg.channel == this.channel) {

                            // curts = new Date().getTime();
                            // if (msg.data.timestamp) {
                            //     let off = curts - msg.data.timestamp;
                            //     console.log('msg0 ' + off);
                            // }

                            this._onChannel(msg.data);

                            // curts = new Date().getTime();
                            if (msg.data.timestamp) {
                                let off = curts - msg.data.timestamp;
                                console.log('msg1 ' + off);
                            }
                        }
                    }
                }
            }
        });

        this.ws.on('close', () => {
            console.log('close ');
        });

        this.ws.on('error', (err) => {
            console.log('error ' + JSON.stringify(err));
        });
    }
};

exports.OKCoinEXDataStream = OKCoinEXDataStream;