"use strict";

const { WSDataStream } = require('../../wsdatastream');
const { DEPTHINDEX, DEALSINDEX, DEALTYPE } = require('../../basedef');

class BitmexDataStream extends WSDataStream {
    // cfg.addr - like wss://testnet.bitmex.com/realtime
    // cfg.symbol - XBTUSD
    constructor(cfg) {
        super(cfg);

        // this.channelDepth = 'ok_sub_spot_' + this.cfg.symbol + '_depth';
        // this.channelDeals = 'ok_sub_spot_' + this.cfg.symbol + '_deals';

        // this.depthIndexAsk = 0;
        // this.depthIndexBid = 0;
    }

    _procConfig() {
        super._procConfig();

        if (!this.cfg.addr) {
            this.cfg.addr = 'wss://testnet.bitmex.com/realtime';
        }

        if (!this.cfg.symbol) {
            this.cfg.symbol = 'XBTUSD';
        }
    }

    _addChannel() {
        this.sendMsg({
            op: 'subscribe',
            args: ['orderBookL2:' + this.cfg.symbol, 'trade:' + this.cfg.symbol]
        });
    }

    _onChannel_Deals(data) {
        for (let i = 0; i < data.length; ++i) {
            if (data[i].symbol == this.cfg.symbol) {
                this.deals.push([
                    data[i].trdMatchID,
                    parseFloat(data[i].price),
                    parseFloat(data[i].size),
                    new Date(data[i].timestamp).getTime(),
                    data[i].side == 'Buy' ? DEALTYPE.BUY : DEALTYPE.SELL
                ]);
            }
        }
    }

    __insertDepth_asks(id, p, v) {
        for (let i = 0; i < this.asks.length; ++i) {
            if (p < this.asks[i][DEPTHINDEX.PRICE]) {
                this.asks.splice(i, 0, [p, v, id, v]);

                return ;
            }
        }
    }

    __updateDepth_asks(id, p, v) {
        for (let i = 0; i < this.asks.length; ++i) {
            if (id == this.asks[i][DEPTHINDEX.ID]) {
                this.asks[i][DEPTHINDEX.PRICE] = p;
                this.asks[i][DEPTHINDEX.VOLUME] = v;
                this.asks[i][DEPTHINDEX.LASTVOLUME] = v;

                return ;
            }
        }

        // this.__insertDepth_asks(id, p, v);
    }

    __deleteDepth_asks(id) {
        for (let i = 0; i < this.asks.length; ++i) {
            if (id == this.asks[i][DEPTHINDEX.ID]) {
                this.asks.splice(i, 1);

                return ;
            }
        }

        // this.__insertDepth_asks(id, p, v);
    }

    __insertDepth_bids(id, p, v) {
        for (let i = 0; i < this.bids.length; ++i) {
            if (p > this.bids[i][DEPTHINDEX.PRICE]) {
                this.bids.splice(i, 0, [p, v, id, v]);

                return ;
            }
        }
    }

    __updateDepth_bids(id, p, v) {
        for (let i = 0; i < this.bids.length; ++i) {
            if (id == this.bids[i][DEPTHINDEX.ID]) {
                this.bids[i][DEPTHINDEX.PRICE] = p;
                this.bids[i][DEPTHINDEX.VOLUME] = v;
                this.bids[i][DEPTHINDEX.LASTVOLUME] = v;

                return ;
            }
        }

        // this.__insertDepth_bids(id, p, v);
    }

    __deleteDepth_bids(id) {
        for (let i = 0; i < this.bids.length; ++i) {
            if (id == this.bids[i][DEPTHINDEX.ID]) {
                this.bids.splice(i, 1);

                return ;
            }
        }

        // this.__insertDepth_asks(id, p, v);
    }

    _onChannel_Depth(action, data) {
        if (this.asks.length == 0 || this.bids.length == 0) {
            if (action != 'partial') {
                return ;
            }

            for (let i = 0; i < data.length; ++i) {
                if (data[i].symbol == this.cfg.symbol) {
                    let p = parseFloat(data[i].price);
                    let v = parseFloat(data[i].size);

                    if (data[i].side == 'Buy') {
                        this.bids.push([p, v, data[i].id, v]);
                    }
                    else {
                        this.asks.push([p, v, data[i].id, v]);
                    }
                }
            }

            this.asks.sort((a, b) => {
                return a.price - b.price;
            });

            this.bids.sort((a, b) => {
                return b.price - a.price;
            });

            return ;
        }

        if (action == 'insert') {
            for (let i = 0; i < data.length; ++i) {
                if (data[i].symbol == this.cfg.symbol) {
                    let p = parseFloat(data[i].price);
                    let v = parseFloat(data[i].size);

                    if (data[i].side == 'Buy') {
                        this.__insertDepth_bids(data[i].id, p, v);
                    }
                    else {
                        this.__insertDepth_asks(data[i].id, p, v);
                    }
                }
            }
        }
        else if (action == 'update') {
            for (let i = 0; i < data.length; ++i) {
                if (data[i].symbol == this.cfg.symbol) {
                    let p = parseFloat(data[i].price);
                    let v = parseFloat(data[i].size);

                    if (data[i].side == 'Buy') {
                        this.__updateDepth_bids(data[i].id, p, v);
                    }
                    else {
                        this.__updateDepth_asks(data[i].id, p, v);
                    }
                }
            }
        }
        else if (action == 'delete') {
            for (let i = 0; i < data.length; ++i) {
                if (data[i].symbol == this.cfg.symbol) {
                    if (data[i].side == 'Buy') {
                        this.__deleteDepth_bids(data[i].id);
                    }
                    else {
                        this.__deleteDepth_asks(data[i].id);
                    }
                }
            }
        }
    }

    //------------------------------------------------------------------------------
    // WSDataStream

    sendMsg(msg) {
        this._send(JSON.stringify(msg));
    }

    _onOpen() {
        super._onOpen();

        console.log('bitmex open ');

        this._addChannel();
    }

    _onMsg(data) {
        super._onMsg(data);

        if (this.cfg.output_message) {
            console.log(data);
        }

        let curts = new Date().getTime();

        try{
            let msg = JSON.parse(data);
            if (msg) {
                if (msg.table == 'trade') {
                    if (msg.action == 'insert' || msg.action == 'partial') {
                        this._onChannel_Deals(msg.data);

                        this._onDeals();
                    }
                }
                else if (msg.table == 'orderBookL2') {
                    this._onChannel_Depth(msg.action, msg.data);

                    this._onDepth();
                }
            }
        }
        catch (err) {
            console.log('bitmex onmsg err! ' + err);
            this.client.close();
        }
    }

    _onClose() {
        console.log('bitmex close ');

        super._onClose();
    }

    _onError(err) {
        console.log('bitmex error ' + JSON.stringify(err));

        super._onError(err);
    }

    _onKeepalive() {
        this.sendMsg({event: 'ping'});

        super._onKeepalive();
    }
};

exports.BitmexDataStream = BitmexDataStream;