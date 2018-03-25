"use strict";

const { DataStream } = require('./datastream');
const { DEPTHINDEX, DEALSINDEX, DEALTYPE } = require('./basedef');
const rp = require('request-promise-native');

class HTTPDataStream extends DataStream {
    // cfg.baseurl
    // cfg.timeout_request
    // cfg.time_tick
    // cfg.fpstimeoff
    constructor(cfg) {
        super(cfg);

        this.timerFPS = undefined;
        this.lastmsTick = 0;
        this.isTickRunning = false;

        this.lstRequest = [];
    }

    _procConfig() {
        super._procConfig();

        if (!this.cfg.time_tick) {
            this.cfg.time_tick = 5000;
        }

        if (!this.cfg.fpstimeoff) {
            this.cfg.fpstimeoff = 20;
        }
    }

    _startTimer_Tick() {
        if (this.timerFPS != undefined) {
            clearInterval(this.timerFPS);

            this.timerFPS = undefined;
        }

        setInterval(async () => {
            let tms = new Date().getTime();

            if (!this.isTickRunning && tms - this.lastmsTick >= this.cfg.time_tick) {
                this.isTickRunning = true;
                await this._onTick();
                this.lastmsTick = new Date().getTime();
                this.isTickRunning = false;
            }

        }, this.cfg.timerFPS);
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

    async startRequestAsync(url) {
        return new Promise((resolve, reject) => {
            this.startRequest(url, (err, data) => {
                if (err) {
                    reject(err);
                }
                else {
                    resolve(data);
                }
            });
        });
    }

    init() {
        this._startTimer_Tick();
    }

    //------------------------------------------------------------------------------
    // 需要重载的接口

    async _onTick() {
    }
};

exports.HTTPDataStream = HTTPDataStream;