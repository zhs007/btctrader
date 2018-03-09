"use strict";

const { DataStream, DEPTHINDEX, DEALSINDEX, DEALTYPE } = require('./datastream');
const { WebSocketClient } = require('./websocket');

class __MulWSDataStreamConfig {
    constructor(ds, cfg, i) {
        this.addr = cfg.lstaddr[i];
        this.timeout_keepalive = cfg.timeout_keepalive;
        this.timeout_connect = cfg.timeout_connect;
        this.timeout_message = cfg.timeout_message;
        this.proxysocks = cfg.proxysocks;

        this.curIndex = i;
        this.ds = ds;
    }

    funcOnOpen() {
        this.ds._onOpen(this.curIndex);
    }

    funcOnMsg(data) {
        this.ds._onMsg(this.curIndex, data);
    }

    funcOnClose(i) {
        this.ds._onClose(this.curIndex);
    }

    funcOnError(i, err) {
        this.ds._onError(this.curIndex, err);
    }

    funcOnKeepalive(i) {
        this.ds._onKeepalive(this.curIndex);
    }
};

class MulWSDataStream extends DataStream {
    // cfg.lstaddr
    // cfg.timeout_keepalive
    // cfg.timeout_connect
    // cfg.timeout_message
    // cfg.proxysocks
    constructor(cfg) {
        super(cfg);

        this.lstClient = [];
        for (let i = 0; i < cfg.lstaddr.length; ++i) {
            let curcfg = new __MulWSDataStreamConfig(this, cfg, i);
            this.lstClient.push(new WebSocketClient(curcfg));
        }
    }

    init() {
        for (let i = 0; i < this.lstClient.length; ++i) {
            if (!this.lstClient[i].isConnected()) {
                this.lstClient[i].init();
            }
        }
    }

    _send(i, buff) {
        this.lstClient[i]._send(buff);
    }

    //------------------------------------------------------------------------------
    // 需要重载的接口

    sendMsg(i, msg) {
    }

    _onOpen(i) {
    }

    _onMsg(i, data) {
        this.lastts = new Date().getTime();
    }

    _onClose(i) {
        this.init();
    }

    _onError(i, err) {
    }

    _onKeepalive(i) {
    }
};

exports.MulWSDataStream = MulWSDataStream;

exports.DEPTHINDEX      = DEPTHINDEX;
exports.DEALSINDEX      = DEALSINDEX;
exports.DEALTYPE        = DEALTYPE;