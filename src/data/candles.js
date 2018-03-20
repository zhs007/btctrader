"use strict";

const { DEPTHINDEX, DEALTYPE, DEALSINDEX } = require('../basedef');

const MAX_ONDEALS_NUMS = 512;

class Candles{
    constructor() {
        this.lstData = [];
    }

    onDeals(mgrData, tname, cdi, cask, cbid) {
        let cts = Math.floor(cdi[DEALSINDEX.TMS] / 1000);
        let lastn = undefined;

        if (this.lstData.length <= 0) {
            lastn = {
                op: cdi[DEALSINDEX.PRICE],
                cp: cdi[DEALSINDEX.PRICE],
                hp: cdi[DEALSINDEX.PRICE],
                lp: cdi[DEALSINDEX.PRICE],
                volume: cdi[DEALSINDEX.VOLUME],
                ask_o: cask[DEPTHINDEX.PRICE],
                ask_c: cask[DEPTHINDEX.PRICE],
                ask_h: cask[DEPTHINDEX.PRICE],
                ask_l: cask[DEPTHINDEX.PRICE],
                bid_o: cbid[DEPTHINDEX.PRICE],
                bid_c: cbid[DEPTHINDEX.PRICE],
                bid_h: cbid[DEPTHINDEX.PRICE],
                bid_l: cbid[DEPTHINDEX.PRICE],
                ts: cts
            };

            this.lstData.push(lastn);
        }
        else {
            lastn = this.lstData[this.lstData.length - 1];

            if (cts == lastn.ts) {
                lastn.cp = cdi[DEALSINDEX.PRICE];

                if (lastn.hp < cdi[DEALSINDEX.PRICE]) {
                    lastn.hp = cdi[DEALSINDEX.PRICE];
                }

                if (lastn.lp > cdi[DEALSINDEX.PRICE]) {
                    lastn.lp = cdi[DEALSINDEX.PRICE];
                }

                lastn.volume += cdi[DEALSINDEX.VOLUME];

                lastn.ask_c = cask[DEPTHINDEX.PRICE];

                if (lastn.ask_h < cask[DEPTHINDEX.PRICE]) {
                    lastn.ask_h = cask[DEPTHINDEX.PRICE];
                }

                if (lastn.ask_l > cask[DEPTHINDEX.PRICE]) {
                    lastn.ask_l = cask[DEPTHINDEX.PRICE];
                }

                lastn.bid_c = cbid[DEPTHINDEX.PRICE];

                if (lastn.bid_h < cbid[DEPTHINDEX.PRICE]) {
                    lastn.bid_h = cbid[DEPTHINDEX.PRICE];
                }

                if (lastn.bid_l > cbid[DEPTHINDEX.PRICE]) {
                    lastn.bid_l = cbid[DEPTHINDEX.PRICE];
                }
            }
            else if (cts > lastn.ts) {

                {
                    let csn = {};
                    for (let k in lastn) {
                        csn[k] = lastn[k];
                    }
                    csn.ts = new Date(csn.ts * 1000).toISOString();
                    mgrData.insertCandle(tname, csn);
                }

                let cn = {
                    op: lastn.cp,
                    cp: lastn.cp,
                    hp: lastn.cp,
                    lp: lastn.cp,
                    volume: 0,
                    ask_o: lastn.ask_c,
                    ask_c: lastn.ask_c,
                    ask_h: lastn.ask_c,
                    ask_l: lastn.ask_c,
                    bid_o: lastn.bid_c,
                    bid_c: lastn.bid_c,
                    bid_h: lastn.bid_c,
                    bid_l: lastn.bid_c,
                    ts: cts
                };

                cn.cp = cdi[DEALSINDEX.PRICE];

                if (cn.hp < cdi[DEALSINDEX.PRICE]) {
                    cn.hp = cdi[DEALSINDEX.PRICE];
                }

                if (cn.lp > cdi[DEALSINDEX.PRICE]) {
                    cn.lp = cdi[DEALSINDEX.PRICE];
                }

                cn.volume += cdi[DEALSINDEX.VOLUME];

                cn.ask_c = cask[DEPTHINDEX.PRICE];

                if (cn.ask_h < cask[DEPTHINDEX.PRICE]) {
                    cn.ask_h = cask[DEPTHINDEX.PRICE];
                }

                if (cn.ask_l > cask[DEPTHINDEX.PRICE]) {
                    cn.ask_l = cask[DEPTHINDEX.PRICE];
                }

                cn.bid_c = cbid[DEPTHINDEX.PRICE];

                if (cn.bid_h < cbid[DEPTHINDEX.PRICE]) {
                    cn.bid_h = cbid[DEPTHINDEX.PRICE];
                }

                if (cn.bid_l > cbid[DEPTHINDEX.PRICE]) {
                    cn.bid_l = cbid[DEPTHINDEX.PRICE];
                }

                this.lstData.push(cn);
            }
        }

        if (this.lstData.length > MAX_ONDEALS_NUMS) {
            this.lstData.splice(0, Math.floor(MAX_ONDEALS_NUMS / 2));
        }
    }
};

exports.Candles = Candles;