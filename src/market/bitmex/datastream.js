"use strict";

const { WSDataStream } = require('../../wsdatastream');
const OrderMgr = require('../../ordermgr');
const { DEPTHINDEX, DEALSINDEX, DEALTYPE, ORDERSIDE, ORDERTYPE, ORDERSTATE } = require('../../basedef');
const crypto = require('crypto');

class BitmexDataStream extends WSDataStream {
    // cfg.addr - like wss://testnet.bitmex.com/realtime
    // cfg.symbol - XBTUSD
    // cfg.apikey
    // cfg.apisecret
    constructor(cfg) {
        super(cfg);

        // this.channelDepth = 'ok_sub_spot_' + this.cfg.symbol + '_depth';
        // this.channelDeals = 'ok_sub_spot_' + this.cfg.symbol + '_deals';

        // this.depthIndexAsk = 0;
        // this.depthIndexBid = 0;
    }

    _makeSignature(expires) {
        let s = crypto.createHmac('sha256', this.cfg.apisecret).update('GET' + '/realtime' + expires).digest('hex');
        return s;
    }

    _procConfig() {
        super._procConfig();

        if (!this.cfg.addr) {
            // this.cfg.addr = 'wss://testnet.bitmex.com/realtime';
            this.cfg.addr = 'wss://www.bitmex.com/realtime';
        }

        if (!this.cfg.symbol) {
            this.cfg.symbol = 'XBTUSD';
        }
    }

    _addChannel(isauth) {
        if (isauth) {
            this.sendMsg({
                op: 'subscribe',
                args: ['orderBookL2:' + this.cfg.symbol, 'trade:' + this.cfg.symbol, 'order:' + this.cfg.symbol]//, 'execution:' + this.cfg.symbol, 'position:' + this.cfg.symbol]
            });
        }
        else {
            this.sendMsg({
                op: 'subscribe',
                args: ['orderBookL2:' + this.cfg.symbol, 'trade:' + this.cfg.symbol]
            });
        }
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

        this._onDeals(data.length);
    }

    __insertDepth_asks(id, p, v) {
        for (let i = 0; i < this.asks.length; ++i) {
            if (p < this.asks[i][DEPTHINDEX.PRICE]) {
                this.asks.splice(i, 0, [p, v, id, v]);

                return ;
            }
        }
    }

    __updateDepth_asks(id, v) {
        for (let i = 0; i < this.asks.length; ++i) {
            if (id == this.asks[i][DEPTHINDEX.ID]) {
                // this.asks[i][DEPTHINDEX.PRICE] = p;
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

    __updateDepth_bids(id, v) {
        for (let i = 0; i < this.bids.length; ++i) {
            if (id == this.bids[i][DEPTHINDEX.ID]) {
                // this.bids[i][DEPTHINDEX.PRICE] = p;
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
                return a[DEPTHINDEX.PRICE] - b[DEPTHINDEX.PRICE];
            });

            this.bids.sort((a, b) => {
                return b[DEPTHINDEX.PRICE] - a[DEPTHINDEX.PRICE];
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
                    // let p = parseFloat(data[i].price);
                    let v = parseFloat(data[i].size);

                    if (data[i].side == 'Buy') {
                        this.__updateDepth_bids(data[i].id, v);
                    }
                    else {
                        this.__updateDepth_asks(data[i].id, v);
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

    _onChannel_Order(action, data) {
        for (let i = 0; i < data.length; ++i) {
            let co = data[i];
            if (!co.clOrdID) {
                continue;
            }

            let arrclordid = co.clOrdID.split('-');
            if (arrclordid.length != 2) {
                continue;
            }

            let curlocalorder = OrderMgr.singleton.getOrder(this.marketname, co.clOrdID);
            if (curlocalorder == undefined) {
                continue;
            }

            if (curlocalorder.ordid != co.orderID) {
                curlocalorder.ordid = co.orderID;
                curlocalorder.isupd = true;
            }

            if (co.hasOwnProperty('price')) {
                if (curlocalorder.price != co.price) {
                    curlocalorder.price = co.price;
                    curlocalorder.isupd = true;
                }
            }

            if (co.hasOwnProperty('orderQty')) {
                if (curlocalorder.volume != co.orderQty) {
                    curlocalorder.volume = co.orderQty;
                    curlocalorder.isupd = true;
                }
            }

            if (co.hasOwnProperty('avgPx')) {
                if (curlocalorder.avgprice != co.avgPx) {
                    curlocalorder.avgprice = co.avgPx;
                    curlocalorder.isupd = true;
                }
            }

            if (co.hasOwnProperty('leavesQty')) {
                if (curlocalorder.lastvolume != co.leavesQty) {
                    curlocalorder.lastvolume = co.leavesQty;
                    curlocalorder.isupd = true;
                }
            }

            if (co.ordStatus == 'Canceled') {
                curlocalorder.ordstate = ORDERSTATE.CANCELED;
                curlocalorder.closems = new Date(co.timestamp).getTime();
                curlocalorder.isupd = true;
            }
            else if (co.ordStatus == 'Filled') {
                curlocalorder.ordstate = ORDERSTATE.CLOSE;
                curlocalorder.closems = new Date(co.timestamp).getTime();
                curlocalorder.isupd = true;
            }

            this._onOrder(curlocalorder);
        }
    }

    //------------------------------------------------------------------------------
    // WSDataStream

    sendMsg(msg) {
        this._send(JSON.stringify(msg));
    }

    _onOpen() {
        super._onOpen();

        this.asks = [];
        this.bids = [];

        console.log('bitmex open ');

        if (this.cfg.apikey && this.cfg.apisecret) {
            let expires = new Date().getTime() + (60 * 1000);
            this.sendMsg({
                op: 'authKey',
                args: [
                    this.cfg.apikey,
                    expires,
                    this._makeSignature(expires)
                ]
            });
        }
        else {
            this._addChannel(false);
        }
    }

    _onMsg(data) {
        super._onMsg(data);

        if (this.cfg.output_message) {
            console.log(data);
        }

        if (data == 'pong') {
            return ;
        }

        let curts = new Date().getTime();

        try{
            let msg = JSON.parse(data);
            if (msg) {
                if (msg.table == 'trade') {
                    if (msg.action == 'insert' || msg.action == 'partial') {
                        this._onChannel_Deals(msg.data);
                    }
                }
                else if (msg.table == 'order') {
                    console.log(data);

                    this._onChannel_Order(msg.action, msg.data);
                }
                else if (msg.table == 'orderBookL2') {
                    this._onChannel_Depth(msg.action, msg.data);

                    this._onDepth();
                }
                else if (msg.success == true) {
                    if (msg.request.op == 'authKey') {
                        this._addChannel(true);

                        if (this.funcOnAuth) {
                            this.funcOnAuth();
                        }
                    }
                }
                else {
                    console.log(data);
                }
            }
        }
        catch (err) {
            console.log('bitmex onmsg err! ' + err + ' ' + data);
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
        this.sendMsg('ping');

        super._onKeepalive();
    }
};

exports.BitmexDataStream = BitmexDataStream;