"use strict";

const { MulWSDataStream } = require('../../mulwsdatastream');
const { DEPTHINDEX, DEALSINDEX, DEALTYPE } = require('../../basedef');
const rp = require('request-promise-native');

const BINANCECHANNEL = {
    DEPTH:      0,
    DEAL:       1,
};

const BINANCECHANNELNAME = [
    'depth',
    'deal',
];

class BinanceDataStream extends MulWSDataStream {
    // cfg.addr - like wss://stream.binance.com:9443/ws
    // cfg.symbol - btcusdt
    // cfg.url - like https://www.binance.com/api/v1/
    // cfg.depthlimit - like 1000
    // cfg.tradeslimit - like 500
    constructor(cfg) {
        if (!cfg.hasOwnProperty('addr')) {
            cfg.addr = 'wss://stream.binance.com:9443/ws';
        }

        if (!cfg.hasOwnProperty('symbol')) {
            cfg.symbol = 'btcusdt';
        }

        cfg.lstaddr = [
            cfg.addr + '/' + cfg.symbol + '@depth',
            cfg.addr + '/' + cfg.symbol + '@trade'
        ];

        super(cfg);

        this.depthIndexAsk = 0;
        this.depthIndexBid = 0;

        this.urlDepth = cfg.url + 'depth?symbol=' + cfg.symbol.toUpperCase() + '&limit=' + cfg.depthlimit;
        this.urlTrade = cfg.url + 'trades?symbol=' + cfg.symbol.toUpperCase() + '&limit=' + cfg.tradeslimit;
    }

    _procConfig() {
        super._procConfig();

        if (!this.cfg.hasOwnProperty('url')) {
            this.cfg.url = 'https://www.binance.com/api/v1/';
        }

        if (!this.cfg.hasOwnProperty('depthlimit')) {
            this.cfg.depthlimit = 1000;
        }

        if (!this.cfg.hasOwnProperty('tradeslimit')) {
            this.cfg.tradeslimit = 500;
        }
    }

    _initDeals(data) {
        for (let i = 0; i < data.length; ++i) {
            this.deals.push([
                data[i].id,
                parseFloat(data[i].price),
                parseFloat(data[i].qty),
                data[i].time,
                data[i].isBuyerMaker ? DEALTYPE.BUY : DEALTYPE.SELL
            ]);
        }
    }

    _initDepth(data) {
        for (let i = 0; i < data.asks.length; ++i) {
            let cn = data.asks[i];
            let p = parseFloat(cn[0]);
            let v = parseFloat(cn[1]);

            if (this.cfg.simtrade) {
                this.asks.push([p, v, ++this.depthIndexAsk, v]);
            }
            else {
                this.asks.push([p, v]);
            }
        }

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

    _startTrades(callback) {
        rp(this.urlTrade).then((str) => {
            try {
                let msg = JSON.parse(str);
                this._initDeals(msg);

                callback();
            }
            catch(err) {
                this.init();
            }
        }).catch((err) => {
            this.init();
        });
    }

    _startDepth(callback) {
        rp(this.urlDepth).then((str) => {
            try {
                let msg = JSON.parse(str);
                this._initDepth(msg);

                if (this.hasDeals()) {
                    callback();
                }
                else {
                    this._startTrades(callback);
                }
            }
            catch(err) {
                this.init();
            }
        }).catch((err) => {
            this.init();
        });
    }

    init() {
        console.log('binance init...');

        if (this.hasDepth()) {
            if (this.hasDeals()) {
                super.init();
            }
            else {
                this._startTrades(() => {
                    super.init();
                });
            }
        }
        else {
            this._startDepth(() => {
                super.init();
            });
        }
    }

    _onChannel_Deals(data) {
        this.deals.push([
            data.t,
            parseFloat(data.p),
            parseFloat(data.q),
            data.T,
            data.m ? DEALTYPE.BUY : DEALTYPE.SELL
        ]);
    }

    _onChannel_Depth(asks, bids) {
        if (asks) {
            if (this.asks.length == 0) {
                for (let i = 0; i < asks.length; ++i) {
                    let cn = asks[i];
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
                let rmvnums = 0;
                let insnums = 0;
                let updnums = 0;

                let mi = 0;
                for (let i = 0; i < asks.length; ++i) {
                    let cn = asks[i];
                    let p = parseFloat(cn[0]);
                    let v = parseFloat(cn[1]);

                    for (; mi < this.asks.length; ++mi) {
                        if (this.asks[mi][0] >= p) {
                            break ;
                        }
                    }

                    if (mi == this.asks.length) {
                        if (v == 0) {

                        }
                        else {
                            if (this.cfg.simtrade) {
                                insnums++;
                                this.asks.push([p, v, ++this.depthIndexAsk, v]);
                            }
                            else {
                                insnums++;
                                this.asks.push([p, v]);
                            }
                        }
                    }
                    else if (this.asks[mi][0] != p) {
                        if (v == 0) {

                        }
                        else {
                            if (this.cfg.simtrade) {
                                insnums++;

                                this.asks.splice(mi, 0, [p, v, ++this.depthIndexAsk, v]);
                            }
                            else {
                                insnums++;
                                this.asks.splice(mi, 0, [p, v]);
                            }
                        }
                    }
                    else {
                        if (v == 0) {
                            rmvnums++;
                            this.asks.splice(mi, 1);
                        }
                        else {
                            if (this.cfg.simtrade) {
                                updnums++;
                                this.asks[mi][DEPTHINDEX.LASTVOLUME] += v - this.asks[mi][DEPTHINDEX.VOLUME];
                                this.asks[mi][1] = v;
                            }
                            else {
                                updnums++;
                                this.asks[mi][1] = v;
                            }
                        }
                    }
                }

                if (this.cfg.output_message) {
                    console.log('binance depth ask ins:' + insnums + ' upd:' + updnums + ' rmv:' + rmvnums);
                }
            }
        }

        if (bids) {
            if (this.bids.length == 0) {
                for (let i = 0; i < bids.length; ++i) {
                    let cn = bids[i];
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
                let rmvnums = 0;
                let insnums = 0;
                let updnums = 0;

                let mi = 0;
                for (let i = 0; i < bids.length; ++i) {
                    let cn = bids[i];
                    let p = parseFloat(cn[0]);
                    let v = parseFloat(cn[1]);

                    for (; mi < this.bids.length; ++mi) {
                        if (this.bids[mi][0] <= p) {
                            break ;
                        }
                    }

                    if (mi == this.bids.length) {
                        if (v == 0) {

                        }
                        else {
                            if (this.cfg.simtrade) {
                                insnums++;
                                this.bids.push([p, v, ++this.depthIndexBid, v]);
                            }
                            else {
                                insnums++;
                                this.bids.push([p, v]);
                            }
                        }
                    }
                    else if (this.bids[mi][0] != p) {
                        if (v == 0) {

                        }
                        else {
                            if (this.cfg.simtrade) {
                                insnums++;
                                this.bids.splice(mi, 0, [p, v, ++this.depthIndexBid, v]);
                            }
                            else {
                                insnums++;
                                this.bids.splice(mi, 0, [p, v]);
                            }
                        }
                    }
                    else {
                        if (v == 0) {
                            rmvnums++;
                            this.bids.splice(mi, 1);
                        }
                        else {
                            if (this.cfg.simtrade) {
                                updnums++;
                                this.bids[mi][DEPTHINDEX.LASTVOLUME] += v - this.bids[mi][DEPTHINDEX.VOLUME];
                                this.bids[mi][1] = v;
                            }
                            else {
                                updnums++;
                                this.bids[mi][1] = v;
                            }
                        }
                    }
                }

                if (this.cfg.output_message) {
                    console.log('binance depth bid ins:' + insnums + ' upd:' + updnums + ' rmv:' + rmvnums);
                }
            }

            // console.log('bids' + JSON.stringify(this.bids));
        }
    }

    //------------------------------------------------------------------------------
    // WSDataStream

    _onOpen(i) {
        super._onOpen(i);

        console.log('binance ' + BINANCECHANNELNAME[i] + ' open ');
    }

    _onMsg(i, data) {
        super._onMsg(i, data);

        if (this.cfg.output_message) {
            console.log('binance ' + BINANCECHANNELNAME[i] + ' msg ' + data);
        }

        if (i == BINANCECHANNEL.DEPTH) {
            let msg = JSON.parse(data);
            if (msg.e == 'depthUpdate') {
                this._onChannel_Depth(msg.a, msg.b);

                this._onDepth();
            }
        }
        else if (i == BINANCECHANNEL.DEAL) {
            let msg = JSON.parse(data);
            if (msg.e == 'trade') {
                this._onChannel_Deals(msg);

                this._onDeals(1);
            }
        }

        return ;
    }

    _onClose(i) {
        console.log('binance ' + BINANCECHANNELNAME[i] + ' close ');

        super._onClose(i);
    }

    _onError(i, err) {
        console.log('binance ' + BINANCECHANNELNAME[i] + ' error ' + JSON.stringify(err));

        super._onError(i, err);
    }

    _onKeepalive(i) {
        super._onKeepalive(i);
    }
};

exports.BinanceDataStream = BinanceDataStream;