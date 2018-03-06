"use strict";

const WebSocket = require('ws');
const pako = require('pako');

class HuoBiDataStream {
    // cfg.addr - like wss://api.huobi.pro/ws
    // cfg.symbol - btcusdt
    constructor(cfg) {
        this.cfg = cfg;
        this.ws = undefined;
    }

    _send(msg) {
        this.ws.send(JSON.stringify(msg));
    }

    _subscribe(symbol) {
        this._send({
            "sub": 'market.' + symbol + '.depth.step0',
            "id": symbol + 'depth'
        });

        this._send({
            "sub": 'market.' + symbol + '.kline.1min',
            "id": symbol + 'kline'
        });
    }

    init() {
        this.ws = new WebSocket(this.cfg.addr);

        this.ws.on('open', () => {
            this._subscribe(this.cfg.symbol);
        });

        this.ws.on('message', (data) => {
            let text = pako.inflate(data, {to: 'string'});
            let msg = JSON.parse(text);
            if (msg.ping) {
                this._send({
                    pong: msg.ping
                });
            }
            else if (msg.tick) {

            }
        });

        this.ws.on('close', () => {

        });

        this.ws.on('error', (err) => {

        });
    }
};

exports.HuoBiDataStream = HuoBiDataStream;