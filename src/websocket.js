"use strict";

const WebSocket = require('ws');
const SocksProxyAgent = require('socks-proxy-agent');

class WebSocketClient {
    // cfg.addr
    // cfg.timeout_keepalive
    // cfg.timeout_connect
    // cfg.timeout_message
    // cfg.proxysocks
    // cfg.funcOnOpen
    // cfg.funcOnMsg
    // cfg.funcOnClose
    // cfg.funcOnError
    // cfg.funcOnKeepalive
    constructor(cfg) {
        this.cfg = cfg;

        this.ws = undefined;

        this.timerKeepalive = undefined;
        this.timerConnect = undefined;

        this.lastts = new Date().getTime();

        this._procConfig();
    }

    _procConfig() {
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

        if (this.cfg.proxysocks) {
            this.ws = new WebSocket(this.cfg.addr, {agent: new SocksProxyAgent(this.cfg.proxysocks)});
        }
        else {
            this.ws = new WebSocket(this.cfg.addr);
        }

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
        if (this.cfg.funcOnOpen) {
            this.cfg.funcOnOpen();
        }
    }

    _onMsg(data) {
        this.lastts = new Date().getTime();

        if (this.cfg.funcOnMsg) {
            this.cfg.funcOnMsg(data);
        }
    }

    _onClose() {
        this.init();

        if (this.cfg.funcOnClose) {
            this.cfg.funcOnClose();
        }
    }

    _onError(err) {
        if (this.cfg.funcOnError) {
            this.cfg.funcOnError(err);
        }
    }

    _onKeepalive() {
        if (this.cfg.funcOnKeepalive) {
            this.cfg.funcOnKeepalive();
        }
    }
};

exports.WebSocketClient = WebSocketClient;