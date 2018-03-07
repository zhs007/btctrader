"use strict";

const WebSocket = require('ws');

const DEPTHINDEX = {
    PRICE:      0,
    VOLUME:     1
};

const DEALSINDEX = {
    ID:         0,
    PRICE:      1,
    VOLUME:     2,
    TS:         3,
    TYPE:       4
};

const DEALTYPE = {
    NULL:       0,
    BUY:        1,
    SELL:       2
};

class WSDataStream {
    // cfg.addr
    // cfg.timeout_keepalive
    // cfg.timeout_connect
    // cfg.timeout_message
    // cfg.output_message
    // cfg.maxdeals
    constructor(cfg) {
        this.cfg = cfg;
        this.ws = undefined;

        this.asks = [];
        this.bids = [];

        this.deals = [];

        this.lastPrice = 0;

        this.timerKeepalive = undefined;
        this.timerConnect = undefined;

        this.lastts = new Date().getTime();

        this._procConfig();
    }

    _procConfig() {
        if (!this.cfg.hasOwnProperty('maxdeals')) {
            this.cfg.maxdeals = 500;
        }

        if (!this.cfg.hasOwnProperty('output_message')) {
            this.cfg.output_message = false;
        }

        if (!this.cfg.hasOwnProperty('timeout_keepalive')) {
            this.cfg.timeout_keepalive = 30 * 1000;
        }

        if (!this.cfg.hasOwnProperty('timeout_connect')) {
            this.cfg.timeout_connect = 30 * 1000;
        }

        if (!this.cfg.hasOwnProperty('timeout_message')) {
            this.cfg.timeout_message = 30 * 1000;
        }
    }

    _startTimer_Keepalive() {
        if (this.timerKeepalive != undefined) {
            clearInterval(this.timerKeepalive);

            this.timerKeepalive = undefined;
        }

        setInterval(() => {
            if (!this.isConnected()) {
                this.init();

                return ;
            }

            this._onKeepalive();

            let ts = new Date().getTime();
            if (ts - this.lastts > this.cfg.timeout_message) {
                this.ws.close();

                return ;
            }

        }, this.cfg.timeout_keepalive);
    }

    _startTimer_Connect() {
        if (this.timerConnect != undefined) {
            clearTimeout(this.timerConnect);

            this.timerConnect = undefined;
        }

        setTimeout(() => {
            if (this.isConnected()) {
                return ;
            }

            this.init();

        }, this.cfg.timeout_connect);
    }

    init() {
        this.ws = undefined;

        this._startTimer_Keepalive();
        this._startTimer_Connect();

        this.ws = new WebSocket(this.cfg.addr);

        this.ws.on('open', () => {
            this._onOpen();
        });

        this.ws.on('message', (data) => {
            this._onMsg(data);
        });

        this.ws.on('close', () => {
            this._onClose();
        });

        this.ws.on('error', (err) => {
            this._onError(err);
        });
    }

    _send(buff) {
        if (!this.isConnected()) {
            return ;
        }

        this.ws.send(buff);
    }

    isConnected() {
        if (this.ws == undefined) {
            return false;
        }

        if (this.ws.readyState !== WebSocket.OPEN) {
            return false;
        }

        return true;
    }

    //------------------------------------------------------------------------------
    // 需要重载的接口

    sendMsg(msg) {
    }

    _onOpen() {
    }

    _onMsg(data) {
        this.lastts = new Date().getTime();
    }

    _onClose() {
        this.init();
    }

    _onError(err) {
    }

    _onKeepalive() {
    }

    _onDepth() {
        if (this.cfg.funcOnDepth) {
            this.cfg.funcOnDepth();
        }
    }

    _onDeals() {
        if (this.deals.length > this.cfg.maxdeals) {
            this.deals.splice(0, Math.floor(this.cfg.maxdeals / 2));
        }

        if (this.deals.length > 0) {
            this.lastPrice = this.deals[this.deals.length - 1][DEALSINDEX.PRICE];
        }

        if (this.cfg.funcOnDeals) {
            this.cfg.funcOnDeals();
        }
    }
};

exports.WSDataStream = WSDataStream;

exports.DEPTHINDEX      = DEPTHINDEX;
exports.DEALSINDEX      = DEALSINDEX;
exports.DEALTYPE        = DEALTYPE;