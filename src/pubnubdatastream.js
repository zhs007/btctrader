"use strict";

const { DataStream } = require('./datastream');
const { DEPTHINDEX, DEALSINDEX, DEALTYPE } = require('./basedef');
const PubNub = require('pubnub');

class PubNubDataStream extends DataStream {
    // cfg.subscribekey
    constructor(cfg) {
        super(cfg);

        this.pubnub = new PubNub({
            subscribeKey: this.cfg.subscribekey
        });

        this.pubnub.addListener({
            message: (msg) => {
                this._onMsg(msg);
            }
        });
    }

    init() {
    }

    subscribe(channels) {
        this.pubnub.subscribe({
            channels: channels
        });
    }

    //------------------------------------------------------------------------------
    // 需要重载的接口

    _onMsg(msg) {
        this.lastts = new Date().getTime();
    }
};

exports.PubNubDataStream = PubNubDataStream;