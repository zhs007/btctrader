"use strict";

const { PubNubDataStream } = require('../../pubnubdatastream');
const { DEPTHINDEX, DEALSINDEX, DEALTYPE } = require('../../basedef');
const rp = require('request-promise-native');

class BitFlyerDataStream extends PubNubDataStream {
    // cfg.url - https://api.bitflyer.jp/
    // cfg.subscribekey - sub-c-52a9ab50-291b-11e5-baaa-0619f8945a4f
    // cfg.symbol - BTC_JPY
    constructor(cfg) {
        super(cfg);

        // this.channelOrderBook = 'lightning_board_snapshot_' + this.cfg.symbol;
        this.channelOrderBookUpd = 'lightning_board_' + this.cfg.symbol;
        this.channelExecution = 'lightning_executions_' + this.cfg.symbol;
        // this.channelOrderBook = 'lightning_board_snapshot_' + this.cfg.symbol;

        this.bookChanId = 0;
        this.tradesChanId = 0;
        // this.channelDepth = 'market.' + this.cfg.symbol + '.depth.step0';
        // this.channelDetail = 'market.' + this.cfg.symbol + '.trade.detail';

        this.depthIndexAsk = 0;
        this.depthIndexBid = 0;

        this.urlDepth = cfg.url + 'v1/getboard?product_code=' + cfg.symbol;
        this.urlTrade = cfg.url + 'v1/getexecutions?product_code=' + cfg.symbol;
    }

    _procConfig() {
        super._procConfig();

        if (!this.cfg.hasOwnProperty('url')) {
            this.cfg.url = 'https://api.bitflyer.jp/';
        }

        if (!this.cfg.hasOwnProperty('subscribekey')) {
            this.cfg.subscribekey = 'sub-c-52a9ab50-291b-11e5-baaa-0619f8945a4f';
        }

        if (!this.cfg.hasOwnProperty('symbol')) {
            this.cfg.symbol = 'FX_BTC_JPY';
        }
    }

    _initDeals(data) {
        for (let i = 0; i < data.length; ++i) {
            let cn = data[data.length - i - 1];

            this.deals.push([
                cn.id,
                parseFloat(cn.price),
                parseFloat(cn.size),
                new Date(cn.exec_date).getTime(),
                cn.side == 'BUY' ? DEALTYPE.BUY : DEALTYPE.SELL
            ]);
        }
    }

    // asks asc
    // bids desc
    _initDepth(data) {
        return ;

        for (let i = 0; i < data.asks.length; ++i) {
            let cn = data.asks[i];
            let p = parseFloat(cn.price);
            let v = parseFloat(cn.size);

            if (this.cfg.simtrade) {
                this.asks.push([p, v, ++this.depthIndexAsk, v]);
            }
            else {
                this.asks.push([p, v]);
            }
        }

        for (let i = 0; i < data.bids.length; ++i) {
            let cn = data.bids[i];
            let p = parseFloat(cn.price);
            let v = parseFloat(cn.size);

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

    // asks asc
    // bids asc
    _onChannel_Depth(asks, bids) {
        if (asks) {
            asks.sort((a, b) => {
                return a.price - b.price;
            });

            // if (this.asks.length == 0) {
            //     for (let i = 0; i < asks.length; ++i) {
            //         let cn = asks[i];
            //         let p = parseFloat(cn.price);
            //         let v = parseFloat(cn.size);
            //
            //         if (v == 0) {
            //             continue;
            //         }
            //
            //         if (this.cfg.simtrade) {
            //             this.asks.push([p, v, ++this.depthIndexAsk, v]);
            //         }
            //         else {
            //             this.asks.push([p, v]);
            //         }
            //     }
            // }
            // else {
                let rmvnums = 0;
                let insnums = 0;
                let updnums = 0;

                let mi = 0;
                for (let i = 0; i < asks.length; ++i) {
                    let cn = asks[i];
                    let p = parseFloat(cn.price);
                    let v = parseFloat(cn.size);

                    for (mi = 0; mi < this.asks.length; ++mi) {
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
                    console.log('bitflyer depth ask ins:' + insnums + ' upd:' + updnums + ' rmv:' + rmvnums);
                }
            // }
        }

        if (bids) {
            bids.sort((a, b) => {
                return b.price - a.price;
            });

            // if (this.bids.length == 0) {
            //     for (let i = 0; i < bids.length; ++i) {
            //         let cn = bids[i];
            //         let p = parseFloat(cn.price);
            //         let v = parseFloat(cn.size);
            //
            //         if (v == 0) {
            //             continue;
            //         }
            //
            //         if (this.cfg.simtrade) {
            //             this.bids.push([p, v, ++this.depthIndexBid, v]);
            //         }
            //         else {
            //             this.bids.push([p, v]);
            //         }
            //     }
            // }
            // else {
                let rmvnums = 0;
                let insnums = 0;
                let updnums = 0;

                let mi = 0;
                for (let i = 0; i < bids.length; ++i) {
                    let cn = bids[i];
                    let p = parseFloat(cn.price);
                    let v = parseFloat(cn.size);

                    for (mi = 0; mi < this.bids.length; ++mi) {
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
                    console.log('bitflyer depth bid ins:' + insnums + ' upd:' + updnums + ' rmv:' + rmvnums);
                }
            // }

            // console.log('bids' + JSON.stringify(this.bids));
        }
    }

    // data asc
    _onChannelDetail(data) {
        let newnums = 0;

        for (let i = 0; i < data.length; ++i) {
            let cn = data[i];

            let hascn = false;
            for (let j = 0; j < this.deals.length; ++j) {
                if (this.deals[j][DEALSINDEX.ID] == cn.id) {
                    hascn = true;

                    break;
                }
            }

            if (!hascn) {
                this.deals.push([
                    data[i].id,
                    data[i].price,
                    data[i].size,
                    new Date(data[i].exec_date).getTime(),
                    data[i].side == 'BUY' ? DEALTYPE.BUY : DEALTYPE.SELL
                ]);

                ++newnums;
            }
        }

        this._onDeals(newnums);

        // orderbook的数据有bug，偶尔会有一些数据没有被置0，应该是接口的问题，这里特殊处理一下
        if (this.asks.length > 0 && this.bids.length > 0) {
            let curdeal = this.deals[this.deals.length - 1];
            let askoff = this.asks[0][DEPTHINDEX.PRICE] - curdeal[DEALSINDEX.PRICE];
            let bidoff = curdeal[DEALSINDEX.PRICE] - this.bids[0][DEPTHINDEX.PRICE];
            if (askoff < 0) {
                this.asks.splice(0, 1);
            }
            if (bidoff < 0) {
                this.bids.splice(0, 1);
            }
        }
    }

    //------------------------------------------------------------------------------
    // PubNubDataStream

    init() {
        console.log('bitflyer init...');

        if (this.hasDepth()) {
            if (this.hasDeals()) {
                super.init();

                this.subscribe([this.channelOrderBookUpd, this.channelExecution]);
            }
            else {
                this._startTrades(() => {
                    super.init();

                    this.subscribe([this.channelOrderBookUpd, this.channelExecution]);
                });
            }
        }
        else {
            this._startDepth(() => {
                super.init();

                this.subscribe([this.channelOrderBookUpd, this.channelExecution]);
            });
        }
    }

    _onMsg(msg) {
        super._onMsg(msg);

        // let text = data;
        // let text = pako.inflate(data, {to: 'string'});

        if (this.cfg.output_message) {
            console.log(JSON.stringify(msg));
        }

        if (msg.channel == this.channelOrderBookUpd) {
            this._onChannel_Depth(msg.message.asks, msg.message.bids);
        }
        else if (msg.channel == this.channelExecution) {
            this._onChannelDetail(msg.message);
        }

        // let curts = new Date().getTime();
        //
        // let msg = JSON.parse(text);
        // if (Array.isArray(msg)) {
        //     if (msg[0] == this.bookChanId) {
        //         this._onChannelDepth(msg[1]);
        //     }
        //     if (msg[0] == this.tradesChanId) {
        //         if (Array.isArray(msg[1])) {
        //             this._onChannelDetail(msg[1]);
        //         }
        //         else if (msg[2]) {
        //             this._onChannelDetail(msg[2]);
        //         }
        //     }
        // }
        // else if (msg.event == 'subscribed') {
        //     this._onSubscribed(msg);
        // }
    }
};

exports.BitFlyerDataStream = BitFlyerDataStream;