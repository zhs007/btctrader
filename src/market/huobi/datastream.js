"use strict";

const { WSDataStream, DEALTYPE } = require('../../wsdatastream');
const pako = require('pako');

class HuoBiDataStream extends WSDataStream {
    // cfg.symbol - btcusdt
    constructor(cfg) {
        super(cfg);

        this.channelDepth = 'market.' + this.cfg.symbol + '.depth.step0';
        this.channelDetail = 'market.' + this.cfg.symbol + '.trade.detail';
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

        // this._send({
        //     "sub": 'market.' + symbol + '.kline.1min',
        //     "id": symbol + 'kline'
        // });
    }

    _onChannelDepth(data) {
        this.asks = data.asks;
        this.bids = data.bids;

        this._onDepth();
        // if (this.cfg.funcOnDepth) {
        //     this.cfg.funcOnDepth();
        // }

        // console.log('asks' + JSON.stringify(this.asks));
        // console.log('bids' + JSON.stringify(this.bids));
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

            // console.log('asks' + JSON.stringify(this.asks));
        }
        // this.asks = data.asks;
        // this.bids = data.bids;

        this._onDeals();
        // if (this.cfg.funcOnDepth) {
        //     this.cfg.funcOnDepth();
        // }

        // console.log('asks' + JSON.stringify(this.asks));
        // console.log('bids' + JSON.stringify(this.bids));
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