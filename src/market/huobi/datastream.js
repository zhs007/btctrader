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
            console.log('open ');

            this._subscribe(this.cfg.symbol);
        });

        this.ws.on('message', (data) => {

            let text = pako.inflate(data, {to: 'string'});

            console.log('msg ' + text);

            let msg = JSON.parse(text);
            if (msg.ping) {
                this._send({
                    pong: msg.ping
                });
            }
            else if (msg.tick) {
                console.log();
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