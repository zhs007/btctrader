"use strict";

const WebSocket = require('ws');
const pako = require('pako');

class HuoBiDataStream {
    // cfg.addr - like wss://api.huobi.pro/ws
    // cfg.symbol - btcusdt
    constructor(cfg) {
        this.cfg = cfg;
        this.ws = undefined;

        this.asks = [];
        this.bids = [];

        this.channelDepth = 'market.' + this.cfg.symbol + '.depth.step0';
    }

    _send(msg) {
        this.ws.send(JSON.stringify(msg));
    }

    _subscribe() {
        this._send({
            "sub": this.channelDepth,
            "id": this.cfg.symbol + 'depth'
        });

        // this._send({
        //     "sub": 'market.' + symbol + '.kline.1min',
        //     "id": symbol + 'kline'
        // });
    }

    _onChannelDepth(data) {
        this.asks = data.asks;
        this.bids = data.bids;

        this.cfg.funcOnDepth();
        // console.log('asks' + JSON.stringify(this.asks));
        // console.log('bids' + JSON.stringify(this.bids));
    }

    init() {
        this.ws = new WebSocket(this.cfg.addr);

        this.ws.on('open', () => {
            console.log('open ');

            this._subscribe();
        });

        this.ws.on('message', (data) => {

            let text = pako.inflate(data, {to: 'string'});
            let curts = new Date().getTime();

            // console.log('msg ' + text);

            let msg = JSON.parse(text);
            if (msg.ping) {
                this._send({
                    pong: msg.ping
                });
            }
            else if (msg.tick) {
                if (msg.ch == this.channelDepth) {

                    // curts = new Date().getTime();
                    // if (msg.ts) {
                    //     let off = curts - msg.ts;
                    //     console.log('msg0 ' + off);
                    // }

                    this._onChannelDepth(msg.tick);

                    curts = new Date().getTime();
                    if (msg.ts) {
                        let off = curts - msg.ts;
                        // console.log('huobi msgoff ' + off);
                    }
                }
                // console.log();
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

exports.HuoBiDataStream = HuoBiDataStream;