"use strict";

const { Mysql } = require('./mysql');
const { randomInt, randomString, makeInsertSql, makeUpdateSql } = require('./util');
const { ORDERSIDE, ORDERTYPE, ORDERSTATE } = require('./basedef');
const util = require('util');

const LST_INSORDER_KEY = [
    'mainid',
    'indexid',
    'orderid',
    'symbol',
    'openms',
    'closems',
    'ordtype',
    'price',
    'volume',
    'avgprice',
    'lastvolume',
    'parentindexid',
    'ordstate',
    'side'
];

const LST_UPDORDER_KEY = [
    'orderid',
    'closems',
    'avgprice',
    'lastvolume',
    'ordstate',
];

class OrderMgr {
    constructor() {
        this.cfg = undefined;
        this.mysql = undefined;

        this.tablename = '';
        this.mainid = randomString(8);
        this.curindexid = randomInt(9999) + 10000;

        // this.lstOrder = [];
        this.mapOrder = {};
        this.mapServOrder = {};
    }

    async init(cfg, tablename) {
        this.tablename = tablename;
        this.cfg = cfg;
        this.mysql = new Mysql(cfg);
        await this.getOpenOrder();
    }

    async insOrder(order) {
        if (this.mysql == undefined) {
            return -1;
        }

        let sql = makeInsertSql(this.tablename, order, (key) => {
            return LST_INSORDER_KEY.indexOf(key) >= 0;
        });

        try {
            let [err, rows, fields] = await this.mysql.run(sql);
            if (err) {
                console.log('OrderMgr.insOrder(' + sql + ') err ' + err);

                return -1;
            }

            return rows.insertId;
        }
        catch (err) {
            console.log('OrderMgr.insOrder(' + sql + ') err ' + err);
        }

        return -1;
    }

    _insOrderList(lst, callback) {
        let endnums = 0;
        for (let i = 0; i < lst.length; ++i) {
            this.insOrder(lst[i]).then(() => {
                endnums++;

                if (endnums == lst.length) {
                    callback();
                }
            });
        }
    }

    async updOrder(order) {
        if (this.mysql == undefined) {
            return ;
        }

        let wherestr = util.format("mainid = '%s' and indexid = %d", order.mainid, order.indexid);

        let sql = makeUpdateSql(this.tablename, order, wherestr, (key) => {
            return LST_UPDORDER_KEY.indexOf(key) >= 0;
        });

        try {
            let [err, rows, fields] = await this.mysql.run(sql);
            if (err) {
                console.log('OrderMgr.updOrder(' + sql + ') err ' + err);

                return ;
            }
        }
        catch (err) {
            console.log('OrderMgr.updOrder(' + sql + ') err ' + err);
        }
    }

    async getOpenOrder() {
        if (this.mysql == undefined) {
            return ;
        }

        let sql = util.format("select * from %s where ordstate < 2", this.tablename);
        try {
            let [err, rows, fields] = await this.mysql.run(sql);
            if (err) {
                console.log('OrderMgr.getOpenOrder(' + sql + ') err ' + err);

                return ;
            }

            for (let i = 0; i < rows.length; ++i) {
                let cd = rows[i];
                let co = {};

                co.mainid = cd.mainid;
                co.indexid = cd.indexid;

                if (cd.parentindexid != null) {
                    co.parentindexid = cd.parentindexid;
                }

                if (cd.ordid != null) {
                    co.ordid = cd.ordid;
                }

                co.symbol = cd.symbol;
                co.side = cd.side;
                co.ordtype = cd.ordtype;
                co.ordstate = cd.ordstate;

                if (cd.price != null) {
                    co.price = cd.price;
                }

                if (cd.volume != null) {
                    co.volume = cd.volume;
                }

                if (cd.avgprice != null) {
                    co.avgprice = cd.avgprice;
                }

                if (cd.lastvolume != null) {
                    co.lastvolume = cd.lastvolume;
                }

                co.openms = cd.openms;
                if (cd.closems != null) {
                    co.closems = cd.closems;
                }

                if (!co.parentindexid) {
                    this.mapOrder[co.mainid + '-' + co.indexid] = co;
                }
                else {
                    let cp = this.mapOrder[co.mainid + '-' + co.parentindexid];
                    if (!cp.lstchild) {
                        cp.lstchild = [];
                    }

                    cp.lstchild.push(co);
                    co.parent = cp;
                }

                if (!co.ordid) {
                    this.mapServOrder[co.ordid] = co;
                }
            }
        }
        catch (err) {
            console.log('OrderMgr.getOpenOrder(' + sql + ') err ' + err);
        }
    }

    newLimitOrder(side, symbol, price, volume, funcIns) {
        let co = {
            mainid: this.mainid,
            indexid: this.curindexid++,
            symbol: symbol,
            side: side,
            ordtype: ORDERTYPE.LIMIT,
            ordstate: ORDERSTATE.OPEN,
            price: price,
            volume: volume,
            openms: new Date().getTime()
        };

        this.mapOrder[co.mainid + '-' + co.indexid] = co;

        this.insOrder(co).then((id) => {
            if (funcIns) {
                funcIns(id);
            }
        });

        return co;
    }

    newMakeMarketOrder(side, symbol, price0, price1, volume, funcIns) {
        let po = {
            mainid: this.mainid,
            indexid: this.curindexid++,
            symbol: symbol,
            side: side,
            ordtype: ORDERTYPE.LIMIT,
            ordstate: ORDERSTATE.OPEN,
            price: price0,
            volume: volume,
            openms: new Date().getTime()
        };

        this.mapOrder[po.mainid + '-' + po.indexid] = po;

        let lo = {
            mainid: this.mainid,
            indexid: this.curindexid++,
            symbol: symbol,
            side: side == ORDERSIDE.BUY ? ORDERSIDE.SELL : ORDERSIDE.BUY,
            ordtype: ORDERTYPE.LIMIT,
            ordstate: ORDERSTATE.OPEN,
            price: price1,
            volume: volume,
            openms: new Date().getTime()
        };

        this.mapOrder[lo.mainid + '-' + lo.indexid] = lo;

        let lst = [po, lo];

        this._insOrderList(lst, () => {
            if (funcIns) {
                funcIns();
            }
        });

        return lst;
    }

    newOCOOrder(side, symbol, stopProfit, stopLoss, volume, funcIns) {
        let mo = {
            mainid: this.mainid,
            indexid: this.curindexid++,
            symbol: symbol,
            side: side,
            ordtype: ORDERTYPE.OCO,
            ordstate: ORDERSTATE.OPEN,
            openms: new Date().getTime(),
            lstchild: []
        };

        this.mapOrder[mo.mainid + '-' + mo.indexid] = mo;

        let spo = {
            mainid: this.mainid,
            indexid: this.curindexid++,
            symbol: symbol,
            side: side,
            ordtype: ORDERTYPE.LIMIT,
            ordstate: ORDERSTATE.OPEN,
            price: stopProfit,
            volume: volume,
            openms: new Date().getTime(),
            parentindexid: mo.indexid,
            parent: mo,
        };

        this.mapOrder[spo.mainid + '-' + spo.indexid] = spo;

        let slo = {
            mainid: this.mainid,
            indexid: this.curindexid++,
            symbol: symbol,
            side: side,
            ordtype: ORDERTYPE.LIMIT,
            ordstate: ORDERSTATE.OPEN,
            price: stopLoss,
            volume: volume,
            openms: new Date().getTime(),
            parentindexid: mo.indexid,
            parent: mo,
        };

        this.mapOrder[slo.mainid + '-' + slo.indexid] = slo;

        mo.lstchild.push(spo);
        mo.lstchild.push(slo);

        let lst = [mo, spo, slo];

        this._insOrderList(lst, () => {
            if (funcIns) {
                funcIns();
            }
        });

        return mo;
    }
};

exports.singleton = new OrderMgr();