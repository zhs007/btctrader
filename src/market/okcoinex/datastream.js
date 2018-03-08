"use strict";

const { WSDataStream, DEPTHINDEX, DEALTYPE } = require('../../wsdatastream');

class OKCoinEXDataStream extends WSDataStream {
    // cfg.addr - like wss://real.okex.com:10441/websocket
    // cfg.symbol - btc_usdt
    constructor(cfg) {
        super(cfg);

        this.channelDepth = 'ok_sub_spot_' + this.cfg.symbol + '_depth';
        this.channelDeals = 'ok_sub_spot_' + this.cfg.symbol + '_deals';

        this.depthIndexAsk = 0;
        this.depthIndexBid = 0;
        // this.lastdealtime = undefined;
    }

    _addChannel() {
        this.sendMsg({
            event: 'addChannel',
            channel: this.channelDepth
        });

        this.sendMsg({
            event: 'addChannel',
            channel: this.channelDeals
        });
    }

    _onChannel_Deals(data) {
        for (let i = 0; i < data.length; ++i) {
            this.deals.push([
                data[i][0],
                parseFloat(data[i][1]),
                parseFloat(data[i][2]),
                new Date().getTime(),//new Date(data[i][3]).getTime(),
                data[i][4] == 'ask' ? DEALTYPE.BUY : DEALTYPE.SELL
            ]);
        }
    }

    _onChannel_Depth(data) {
        if (data.asks) {
            if (this.asks.length == 0) {
                for (let i = 0; i < data.asks.length; ++i) {
                    let cn = data.asks[data.asks.length - 1 - i];
                    let p = parseFloat(cn[0]);
                    let v = parseFloat(cn[1]);

                    if (this.cfg.simtrade) {
                        this.asks.push([p, v, ++this.depthIndexAsk, v]);
                    }
                    else {
                        this.asks.push([p, v]);
                    }
                }
            }
            else {
                let mi = 0;
                for (let i = 0; i < data.asks.length; ++i) {
                    let cn = data.asks[data.asks.length - 1 - i];
                    let p = parseFloat(cn[0]);
                    let v = parseFloat(cn[1]);

                    for (; mi < this.asks.length; ++mi) {
                        if (this.asks[mi][0] <= p) {
                            break ;
                        }
                    }

                    if (mi == this.asks.length) {
                        if (this.cfg.simtrade) {
                            this.asks.push([p, v, ++this.depthIndexAsk, v]);
                        }
                        else {
                            this.asks.push([p, v]);
                        }
                    }
                    else if (this.asks[mi][0] != p) {

                        if (this.cfg.simtrade) {
                            this.asks.splice(mi, [p, v, ++this.depthIndexAsk, v]);
                        }
                        else {
                            this.asks.splice(mi, [p, v]);
                        }
                    }
                    else {
                        if (v == 0) {
                            this.asks.splice(mi, 1);
                        }
                        else {
                            if (this.cfg.simtrade) {
                                this.asks[mi][DEPTHINDEX.LASTVOLUME] += v - this.asks[mi][DEPTHINDEX.VOLUME];
                                this.asks[mi][1] = v;
                            }
                            else {
                                this.asks[mi][1] = v;
                            }
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

                    if (this.cfg.simtrade) {
                        this.bids.push([p, v, ++this.depthIndexBid, v]);
                    }
                    else {
                        this.bids.push([p, v]);
                    }
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
                        if (this.cfg.simtrade) {
                            this.bids.push([p, v, ++this.depthIndexBid, v]);
                        }
                        else {
                            this.bids.push([p, v]);
                        }
                    }
                    else if (this.bids[mi][0] != p) {
                        if (this.cfg.simtrade) {
                            this.bids.splice(mi, [p, v, ++this.depthIndexBid, v]);
                        }
                        else {
                            this.bids.splice(mi, [p, v]);
                        }
                    }
                    else {
                        if (v == 0) {
                            this.bids.splice(mi, 1);
                        }
                        else {
                            if (this.cfg.simtrade) {
                                this.bids[mi][DEPTHINDEX.LASTVOLUME] += v - this.bids[mi][DEPTHINDEX.VOLUME];
                                this.bids[mi][1] = v;
                            }
                            else {
                                this.bids[mi][1] = v;
                            }
                        }
                    }
                }
            }

            // console.log('bids' + JSON.stringify(this.bids));
        }
    }

    //------------------------------------------------------------------------------
    // WSDataStream

    sendMsg(msg) {
        this._send(JSON.stringify(msg));
    }

    _onOpen() {
        super._onOpen();

        console.log('okcoinex open ');

        this._addChannel();
    }

    _onMsg(data) {
        super._onMsg(data);

        if (this.cfg.output_message) {
            console.log(data);
        }

        let text = data;
        let curts = new Date().getTime();

        let hasDepth = false;
        let hasDeals = false;

        let arr = JSON.parse(text);
        if (Array.isArray(arr)) {
            for (let i = 0; i < arr.length; ++i) {
                let msg = arr[i];

                if (msg.channel) {
                    if (msg.channel == this.channelDepth) {

                        hasDepth = true;
                        // curts = new Date().getTime();
                        // if (msg.data.timestamp) {
                        //     let off = curts - msg.data.timestamp;
                        //     console.log('msg0 ' + off);
                        // }

                        this._onChannel_Depth(msg.data);

                        // curts = new Date().getTime();
                        if (msg.data.timestamp) {
                            let off = curts - msg.data.timestamp;
                            // console.log('okcoinex msgoff ' + off);
                        }
                    }
                    else if (msg.channel == this.channelDeals) {

                        hasDeals = true;
                        // hasDepth = true;
                        // curts = new Date().getTime();
                        // if (msg.data.timestamp) {
                        //     let off = curts - msg.data.timestamp;
                        //     console.log('msg0 ' + off);
                        // }

                        this._onChannel_Deals(msg.data);

                        // curts = new Date().getTime();
                        if (msg.data.timestamp) {
                            let off = curts - msg.data.timestamp;
                            // console.log('okcoinex msgoff ' + off);
                        }
                    }
                }
            }
        }

        if (hasDepth) {
            this._onDepth();
        }

        if (hasDeals) {
            this._onDeals();
        }
    }

    _onClose() {
        console.log('okcoinex close ');

        super._onClose();
    }

    _onError(err) {
        console.log('okcoinex error ' + JSON.stringify(err));

        super._onError(err);
    }

    _onKeepalive() {
        this.sendMsg({event: 'ping'});

        super._onKeepalive();
    }
};

exports.OKCoinEXDataStream = OKCoinEXDataStream;