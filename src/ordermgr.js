"use strict";

const { Mysql } = require('./mysql');
const { randomInt, randomString, makeInsertSql, makeUpdateSql } = require('./util');
const { ORDERSIDE, ORDERTYPE, ORDERSTATE, DEALSINDEX, DEALTYPE } = require('./basedef');
const { insertOrder2SortList_Buy, insertOrder2SortList_Sell } = require('./order');
const TradeMgr = require('./trademgr');
const Trader2Mgr = require('./trader2mgr');
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
    'side',
    'market'
];

const LST_UPDORDER_KEY = [
    'orderid',
    'closems',
    'avgprice',
    'lastvolume',
    'ordstate',
];

class MarketOrder {
    constructor() {
        this.mapOrder = {};
        this.mapServOrder = {};

        this.lstLimitBuy = [];
        this.lstLimitSell = [];

        this.lstMarketBuy = [];
        this.lstMarketSell = [];
    }

    addOrder(order) {
        this.mapOrder[order.mainid + '-' + order.indexid] = order;

        if (order.parentindexid) {
            let cp = this.mapOrder[order.mainid + '-' + order.parentindexid];
            if (!cp.lstchild) {
                cp.lstchild = [];
            }

            cp.lstchild.push(order);
            order.parent = cp;
        }

        if (!order.ordid) {
            this.mapServOrder[order.ordid] = order;
        }

        if (order.ordtype == ORDERTYPE.LIMIT) {
            if (order.side == ORDERSIDE.BUY) {
                insertOrder2SortList_Buy(this.lstLimitBuy, order);
            }
            else {
                insertOrder2SortList_Sell(this.lstLimitSell, order);
            }
        }
        else if (order.ordtype == ORDERTYPE.MARKET) {
            if (order.side == ORDERSIDE.BUY) {
                this.lstMarketBuy.push(order);
            }
            else {
                this.lstMarketSell.push(order);
            }
        }
    }

    _onSimDeals_MarketOrder(market2, newnums) {
        for (let i = 0; i < newnums; ++i) {
            let curdeal = market2.ds.deals[market2.ds.deals.length - newnums + i];
            if (curdeal[DEALSINDEX.TYPE] == DEALTYPE.BUY) {
                let cp = curdeal[DEALSINDEX.PRICE];
                let cv = curdeal[DEALSINDEX.VOLUME];
                let curtms = curdeal[DEALSINDEX.TMS];

                for (let j = 0; j < this.lstLimitSell.length; ) {
                    let co = this.lstLimitSell[j];
                    if (cp >= co.price) {
                        let ct = TradeMgr.singleton.newTrade(co, cp, cv, curtms);
                        cv -= ct.volume;

                        market2.ds._onOrder(co);

                        if (co.lastvolume <= 0) {
                            this.lstLimitSell.splice(j, 1);
                        }
                        else {
                            ++j;
                        }

                        if (cv <= 0) {
                            break;
                        }
                    }
                    else {
                        break;
                    }
                }

                for (let j = 0; j < this.lstMarketSell.length; ) {
                    let co = this.lstMarketSell[i];
                    let ct = TradeMgr.singleton.newTrade(co, cp, cv, curtms);
                    cv -= ct.volume;

                    market2.ds._onOrder(co);

                    if (co.lastvolume <= 0) {
                        this.lstMarketSell.splice(j, 1);
                    }
                    else {
                        ++j;
                    }

                    if (cv <= 0) {
                        break;
                    }
                }
            }
            else if (curdeal[DEALSINDEX.TYPE] == DEALTYPE.SELL) {
                let cp = curdeal[DEALSINDEX.PRICE];
                let cv = curdeal[DEALSINDEX.VOLUME];
                let curtms = curdeal[DEALSINDEX.TMS];

                for (let j = 0; j < this.lstLimitBuy.length; ) {
                    let co = this.lstLimitBuy[j];
                    if (cp <= co.price) {
                        let ct = TradeMgr.singleton.newTrade(co, cp, cv, curtms);
                        cv -= ct.volume;

                        market2.ds._onOrder(co);

                        if (co.lastvolume <= 0) {
                            this.lstLimitBuy.splice(j, 1);
                        }
                        else {
                            ++j;
                        }

                        if (cv <= 0) {
                            break;
                        }
                    }
                    else {
                        break;
                    }
                }

                for (let j = 0; j < this.lstMarketBuy.length; ) {
                    let co = this.lstMarketBuy[i];
                    let ct = TradeMgr.singleton.newTrade(co, cp, cv, curtms);
                    cv -= ct.volume;

                    market2.ds._onOrder(co);

                    if (co.lastvolume <= 0) {
                        this.lstMarketBuy.splice(j, 1);
                    }
                    else {
                        ++j;
                    }

                    if (cv <= 0) {
                        break;
                    }
                }
            }
        }
    }
};

class OrderMgr {
    constructor() {
        this.cfg = undefined;
        this.mysql = undefined;

        this.tablename = '';
        this.mainid = randomString(8);
        this.curindexid = randomInt(9999) + 10000;

        this.mapMarketOrder = {};

        // this.isSimMode = false;
    }

    __addOrder(order) {
        if (!order.market) {
            return ;
        }

        if (!this.mapMarketOrder.hasOwnProperty(order.market)) {
            this.mapMarketOrder[order.market] = new MarketOrder();
        }

        this.mapMarketOrder[order.market].addOrder(order);
    }

    async init(cfg, tablename) {
        this.tablename = tablename;
        this.cfg = cfg;
        this.mysql = new Mysql(cfg);
        await this.getOpenOrder();
    }

    _onDeals_OrderMgr(market2, newnums) {
        if (Trader2Mgr.singleton.isSimMode) {
            if (this.mapMarketOrder.hasOwnProperty(market2.marketname)) {
                this.mapMarketOrder[market2.marketname]._onSimDeals_MarketOrder(market2, newnums);
            }
        }
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

            order.isupd = false;
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

                this.__addOrder(co);
            }
        }
        catch (err) {
            console.log('OrderMgr.getOpenOrder(' + sql + ') err ' + err);
        }
    }

    newMarketOrder(marketname, side, symbol, volume, funcIns) {
        let co = {
            market: marketname,
            mainid: this.mainid,
            indexid: this.curindexid++,
            symbol: symbol,
            side: side,
            ordtype: ORDERTYPE.MARKET,
            ordstate: ORDERSTATE.OPEN,
            volume: volume,
            openms: new Date().getTime()
        };

        this.__addOrder(co);

        this.insOrder(co).then((id) => {
            if (funcIns) {
                funcIns(id);
            }
        });

        return co;
    }

    newLimitOrder(marketname, side, symbol, price, volume, funcIns) {
        let co = {
            market: marketname,
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

        this.__addOrder(co);

        this.insOrder(co).then((id) => {
            if (funcIns) {
                funcIns(id);
            }
        });

        return co;
    }

    // make market
    // buy price0
    // sell price1
    newMakeMarketOrder(marketname, side, symbol, price0, price1, volume, funcIns) {
        console.log('order - makemarket ' + price0 + ' ' + price1);

        let po = {
            market: marketname,
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

        this.__addOrder(po);

        let lo = {
            market: marketname,
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

        this.__addOrder(lo);

        let lst = [po, lo];

        this._insOrderList(lst, () => {
            if (funcIns) {
                funcIns();
            }
        });

        return lst;
    }

    // stop profit & stop loss
    // stop loss is market
    // stop profit is limit
    newStopProfitAndLossOrder(marketname, side, symbol, stopProfit, stopLoss, volume, funcIns) {
        let mo = {
            market: marketname,
            mainid: this.mainid,
            indexid: this.curindexid++,
            symbol: symbol,
            side: side,
            ordtype: ORDERTYPE.OCO,
            ordstate: ORDERSTATE.OPEN,
            openms: new Date().getTime(),
            lstchild: []
        };

        this.__addOrder(mo);

        let spo = {
            market: marketname,
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

        this.__addOrder(spo);

        let slo = {
            market: marketname,
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

        this.__addOrder(slo);

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