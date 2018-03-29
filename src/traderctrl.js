"use strict";

const util = require('util');

class TraderCtrl {
    //cfg.outputlevel
    constructor(cfg) {
        this.cfg = cfg;

        this._procConfig();
    }

    _procConfig() {
        if (!this.cfg.outputlevel) {
            this.cfg.outputlevel = 'log';
        }
    }

    log(level, msg) {
        let str = util.format('[%s] %s', level, msg);
        console.log(str);
    }
};

exports.TraderCtrl = TraderCtrl;