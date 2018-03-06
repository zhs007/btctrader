"use strict";

const WebSocket = require('ws');
// const pako = require('pako');

class OKCoinEXDataStream {
    // cfg.addr - like wss://real.okex.com:10441/websocket
    // cfg.symbol - btc_usdt
    constructor(cfg) {
        this.cfg = cfg;
        this.ws = undefined;
    }

    _send(msg) {
        this.ws.send(JSON.stringify(msg));
    }

    _subscribe(symbol) {
        this._send({
            event: 'addChannel',
            channel: 'ok_sub_spot_' + symbol + '_depth'
        });

        // this._send({
        //     "sub": 'market.' + symbol + '.kline.1min',
        //     "id": symbol + 'kline'
        // });
    }

    init() {
        this.ws = new WebSocket(this.cfg.addr);

        this.ws.on('open', () => {
            console.log('open ');

            this._subscribe(this.cfg.symbol);
        });

        this.ws.on('message', (data) => {

            let text = data;//pako.inflate(data, {to: 'string'});

            console.log('msg ' + text);

            let msg = JSON.parse(text);
            if (msg.ping) {
                // this._send({
                //     pong: msg.ping
                // });
            }
            else if (msg.channel) {
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

exports.OKCoinEXDataStream = OKCoinEXDataStream;