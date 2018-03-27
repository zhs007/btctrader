"use strict";

const { DataStream } = require('./datastream');
const { DEPTHINDEX, DEALSINDEX, DEALTYPE } = require('./basedef');
const Pusher = require('pusher-js');

class PusherDataStream extends DataStream {
    // cfg.pusherkey
    constructor(cfg) {
        super(cfg);

        this.pusher = new Pusher(this.cfg.pusherkey);
    }

    init() {
    }

    subscribe(channel, msgname, funcOnMsg) {
        let cc = this.pusher.subscribe(channel);
        cc.bind(msgname, funcOnMsg);
    }
};

exports.PusherDataStream = PusherDataStream;