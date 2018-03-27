"use strict";

const { WSDataStream } = require('../../wsdatastream');
const { DEPTHINDEX, DEALSINDEX, DEALTYPE } = require('../../basedef');

class GDAXDataStream extends WSDataStream {
    // cfg.addr - like wss://ws-feed.gdax.com
    // cfg.symbol - BTC-USD
    constructor(cfg) {
        super(cfg);

        // this.channelDepth = 'ok_sub_spot_' + this.cfg.symbol + '_depth';
        // this.channelDeals = 'ok_sub_spot_' + this.cfg.symbol + '_deals';

        this.depthIndexAsk = 0;
        this.depthIndexBid = 0;
    }

    _procConfig() {
        super._procConfig();

        if (!this.cfg.addr) {
            this.cfg.addr = 'wss://ws-feed.gdax.com';
        }

        if (!this.cfg.symbol) {
            this.cfg.symbol = 'BTC-USD';
        }
    }

    _addChannel() {
        this.sendMsg({
            type: 'subscribe',
            product_ids: [this.cfg.symbol],
            channels: ['level2', 'heartbeat', 'ticker']
        });
    }

    // init() {
    //     console.log('gdax init. ');
    //
    //     this._addChannel();
    // }

    _onChannel_Deals(data) {
        if (data.product_id == this.cfg.symbol && data.trade_id) {
            this.deals.push([
                data.trade_id,
                parseFloat(data.price),
                parseFloat(data.last_size),
                new Date(data.time).getTime(),
                data.side == 'buy' ? DEALTYPE.BUY : DEALTYPE.SELL
            ]);

            this._onDeals(1);
        }
    }

    _onChannel_initdepth(data) {
        this.asks = [];
        this.bids = [];

        if (this.cfg.simtrade) {
            for (let i = 0; i < data.asks.length; ++i) {
                let p = parseFloat(data.asks[i][0]);
                let v = parseFloat(data.asks[i][1]);

                this.asks.push([p, v, this.depthIndexAsk++, v]);
            }

            for (let i = 0; i < data.bids.length; ++i) {
                let p = parseFloat(data.bids[i][0]);
                let v = parseFloat(data.bids[i][1]);

                this.bids.push([p, v, this.depthIndexBid++, v]);
            }
        }
        else {
            for (let i = 0; i < data.asks.length; ++i) {
                let p = parseFloat(data.asks[i][0]);
                let v = parseFloat(data.asks[i][1]);

                this.asks.push([p, v]);
            }

            for (let i = 0; i < data.bids.length; ++i) {
                let p = parseFloat(data.bids[i][0]);
                let v = parseFloat(data.bids[i][1]);

                this.bids.push([p, v]);
            }
        }
    }

    _onChannel_upddepth(msg) {
        for (let i = 0; i < msg.changes.length; ++i) {
            let p = parseFloat(msg.changes[i][1]);
            let v = parseFloat(msg.changes[i][2]);

            if (msg.changes[i][0] == 'buy') {
                this._updDepth_bids(p, v);
            }
            else {
                this._updDepth_asks(p, v);
            }
        }
    }

    _updDepth_asks(p, v) {
        if (this.cfg.simtrade) {
            for (let i = 0; i < this.asks.length; ++i) {
                if (p == this.asks[i][DEPTHINDEX.PRICE]) {
                    if (v == 0) {
                        this.asks.splice(i, 1);

                        return ;
                    }

                    this.asks[i][DEPTHINDEX.LASTVOLUME] = v - this.asks[i][DEPTHINDEX.VOLUME] + this.asks[i][DEPTHINDEX.LASTVOLUME];
                    this.asks[i][DEPTHINDEX.VOLUME] = v;

                    return ;
                }
                else if (p < this.asks[i][DEPTHINDEX.PRICE]) {
                    this.asks.splice(i, 0, [p, v, this.depthIndexAsk++, v]);

                    return ;
                }
            }
        }
        else {
            for (let i = 0; i < this.asks.length; ++i) {
                if (p == this.asks[i][DEPTHINDEX.PRICE]) {
                    if (v == 0) {
                        this.asks.splice(i, 1);

                        return ;
                    }

                    this.asks[i][DEPTHINDEX.VOLUME] = v;

                    return ;
                }
                else if (p < this.asks[i][DEPTHINDEX.PRICE]) {
                    this.asks.splice(i, 0, [p, v]);

                    return ;
                }
            }
        }
    }

    _updDepth_bids(p, v) {
        if (this.cfg.simtrade) {
            for (let i = 0; i < this.bids.length; ++i) {
                if (p == this.bids[i][DEPTHINDEX.PRICE]) {
                    if (v == 0) {
                        this.bids.splice(i, 1);

                        return ;
                    }

                    this.bids[i][DEPTHINDEX.LASTVOLUME] = v - this.bids[i][DEPTHINDEX.VOLUME] + this.bids[i][DEPTHINDEX.LASTVOLUME];
                    this.bids[i][DEPTHINDEX.VOLUME] = v;

                    return ;
                }
                else if (p > this.bids[i][DEPTHINDEX.PRICE]) {
                    this.bids.splice(i, 0, [p, v, this.depthIndexBid++, v]);

                    return ;
                }
            }
        }
        else {
            for (let i = 0; i < this.bids.length; ++i) {
                if (p == this.bids[i][DEPTHINDEX.PRICE]) {
                    if (v == 0) {
                        this.bids.splice(i, 1);

                        return ;
                    }

                    this.bids[i][DEPTHINDEX.VOLUME] = v;

                    return ;
                }
                else if (p > this.bids[i][DEPTHINDEX.PRICE]) {
                    this.bids.splice(i, 0, [p, v]);

                    return ;
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

        console.log('gdax open ');

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
                if (msg.type == 'ticker') {
                    this._onChannel_Deals(msg);
                }
                else if (msg.type == 'snapshot') {
                    this._onChannel_initdepth(msg);

                    this._onDepth();
                }
                else if (msg.type == 'l2update') {
                    this._onChannel_upddepth(msg);

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
        console.log('gdax close ');

        super._onClose();
    }

    _onError(err) {
        console.log('gdax error ' + JSON.stringify(err));

        super._onError(err);
    }

    // _onKeepalive() {
    //     this.sendMsg({event: 'ping'});
    //
    //     super._onKeepalive();
    // }
};

exports.GDAXDataStream = GDAXDataStream;