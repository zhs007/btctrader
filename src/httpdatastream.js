"use strict";

const { DataStream } = require('./datastream');
const { DEPTHINDEX, DEALSINDEX, DEALTYPE } = require('./basedef');
const rp = require('request-promise-native');

class HTTPDataStream extends DataStream {
    // cfg.baseurl
    // cfg.timeout_request
    // cfg.time_tick
    constructor(cfg) {
        super(cfg);

        this.timerTick = undefined;

        this.lstRequest = [];
    }

    _procConfig() {
        super._procConfig();

        if (!this.cfg.hasOwnProperty('time_tick')) {
            this.cfg.time_tick = 1000;
        }
    }

    _startTimer_Tick() {
        if (this.timerTick != undefined) {
            clearInterval(this.timerTick);

            this.timerTick = undefined;
        }

        setInterval(() => {
            this._onTick();
        }, this.cfg.time_tick);
    }

    startPost(url, form, callback) {
        rp({method: 'POST', uri: url, form: form}).then((str) => {

            callback(undefined, str);
        }).catch((err) => {

            callback(err);
        });
    }

    // callback(err, data)
    startRequest(url, callback) {
        // let isret = false;
        rp(url).then((str) => {

            callback(undefined, str);
        }).catch((err) => {

            callback(err);
        });

        // setTimeout(() => {
        //     if (isret) {
        //         return ;
        //     }
        //
        //     isret = true;
        //     callback(err);
        // }, this.cfg.timeout_request);
    }

    init() {
        this._startTimer_Tick();
    }

    //------------------------------------------------------------------------------
    // 需要重载的接口

    _onTick() {
    }
};

exports.HTTPDataStream = HTTPDataStream;