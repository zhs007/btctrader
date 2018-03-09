"use strict";

const { DataStream, DEPTHINDEX, DEALSINDEX, DEALTYPE } = require('./datastream');
const { WebSocketClient } = require('./websocket');

class WSDataStream extends DataStream {
    // cfg.addr
    // cfg.timeout_keepalive
    // cfg.timeout_connect
    // cfg.timeout_message
    // cfg.proxysocks
    constructor(cfg) {
        super(cfg);

        cfg.funcOnOpen = () => {
            this._onOpen();
        };

        cfg.funcOnMsg = (data) => {
            this._onMsg(data);
        };

        cfg.funcOnClose = () => {
            this._onClose();
        };

        cfg.funcOnError = (err) => {
            this._onError(err);
        };

        cfg.funcOnKeepalive = () => {
            this._onKeepalive();
        };

        this.client = new WebSocketClient(this.cfg);
    }

    init() {
        this.client.init();
    }

    _send(buff) {
        this.client._send(buff);
    }

    // isConnected() {
    //     return this.client.isConnected();
    // }

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
};

exports.WSDataStream = WSDataStream;

exports.DEPTHINDEX      = DEPTHINDEX;
exports.DEALSINDEX      = DEALSINDEX;
exports.DEALTYPE        = DEALTYPE;