"use strict";

const { Mysql } = require('./mysql');
const { randomInt, randomString, makeInsertSql, makeUpdateSql } = require('./util');
const { ORDERSIDE, ORDERTYPE, ORDERSTATE, DEALSINDEX, DEALTYPE } = require('./basedef');
const { insertOrder2SortList_Buy, insertOrder2SortList_Sell, insertOrder2SortList_StopBuy, insertOrder2SortList_StopSell, removeOrder, addTrade2Order } = require('./order');
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
    'ordid',
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

        this.lstStopBuy = [];
        this.lstStopSell = [];

        this.lstFinished = [];
    }

    onGC() {
        for (let i = 0; i < this.lstFinished.length; ++i) {
            let order = this.lstFinished[i];
            this.mapOrder[order.mainid + '-' + order.indexid] = undefined;

            if (!order.ordid) {
                this.mapServOrder[order.ordid] = undefined;
            }
        }

        this.lstFinished.splice(0, this.lstFinished.length);
    }

    removeOrder(market2, order) {
        order.ordstate = ORDERSTATE.CANCEL;

        //!! proc order with sim mode
        if (Trader2Mgr.singleton.isSimMode) {

            if (!order.hasOwnProperty('lastvolume')) {
                order.lastvolume = order.volume;
            }

            order.lastturnvolume = order.volume - order.lastvolume;
            order.lastturnprice = order.avgprice;

            if (order.lastvolume == order.volume) {
                order.ordstate = ORDERSTATE.FULLCANCELED;
            }
            else {
                order.ordstate = ORDERSTATE.CANCELED;
            }

            order.lastvolume = 0;
            order.isupd = true;

            if (order.ordtype == ORDERTYPE.LIMIT) {
                if (order.side == ORDERSIDE.BUY) {
                    removeOrder(this.lstLimitBuy, order);
                }
                else {
                    removeOrder(this.lstLimitSell, order);
                }
            }
            else if (order.ordtype == ORDERTYPE.MARKET) {
                if (order.side == ORDERSIDE.BUY) {
                    removeOrder(this.lstMarketBuy, order);
                }
                else {
                    removeOrder(this.lstMarketSell, order);
                }
            }
            else if (order.ordtype == ORDERTYPE.STOP) {
                if (order.side == ORDERSIDE.BUY) {
                    removeOrder(this.lstStopBuy, order);
                    removeOrder(this.lstMarketBuy, order);
                }
                else {
                    removeOrder(this.lstStopSell, order);
                    removeOrder(this.lstMarketSell, order);
                }
            }

            market2.ds._onOrder(order);

            this.lstFinished.push(order);
        }
    }

    addOrder(market2, order) {
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

        if (Trader2Mgr.singleton.isSimMode) {
            if (order.ordtype == ORDERTYPE.LIMIT) {
                if (order.side == ORDERSIDE.BUY) {
                    order.alreadyvolume = market2.ds.getDepthVolume_bid(order.price);

                    insertOrder2SortList_Buy(this.lstLimitBuy, order);
                }
                else {
                    order.alreadyvolume = market2.ds.getDepthVolume_ask(order.price);

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
            else if (order.ordtype == ORDERTYPE.STOP) {
                if (order.side == ORDERSIDE.BUY) {
                    insertOrder2SortList_StopBuy(this.lstStopBuy, order);
                }
                else {
                    insertOrder2SortList_StopSell(this.lstStopSell, order);
                }
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

                for (let j = 0; j < this.lstStopSell.length; ) {
                    let co = this.lstStopSell[j];
                    if (cp <= co.stopprice) {
                        this.lstStopSell.splice(j, 1);
                        this.lstMarketSell.push(co);
                    }
                    else {
                        break;
                    }
                }

                for (let j = 0; j < this.lstLimitSell.length; ) {
                    let co = this.lstLimitSell[j];
                    let isproc = false;
                    if (cp == co.price) {
                        if (co.alreadyvolume <= 0) {
                            isproc = true;
                        }
                        else if (co.alreadyvolume >= cv) {
                            co.alreadyvolume = 0;
                            isproc = true;
                        }
                        else {
                            co.alreadyvolume -= cv;
                        }
                    }
                    else if (cp > co.price) {
                        isproc = true;
                    }

                    if (isproc) {
                        let ct = TradeMgr.singleton.newTrade(co, cp, cv, curtms);
                        cv -= ct.volume;

                        market2.ds._onOrder(co);

                        if (co.lastvolume <= 0) {
                            this.lstLimitSell.splice(j, 1);

                            this.lstFinished.push(co);
                        }
                        else {
                            ++j;
                        }

                        if (cv <= 0) {
                            break;
                        }
                    }
                    else if (cp < co.price) {
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

                        this.lstFinished.push(co);
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

                for (let j = 0; j < this.lstStopBuy.length; ) {
                    let co = this.lstStopBuy[j];
                    if (cp >= co.stopprice) {
                        this.lstStopBuy.splice(j, 1);
                        this.lstMarketBuy.push(co);
                    }
                    else {
                        break;
                    }
                }

                for (let j = 0; j < this.lstLimitBuy.length; ) {
                    let co = this.lstLimitBuy[j];
                    let isproc = false;
                    if (cp == co.price) {
                        if (co.alreadyvolume <= 0) {
                            isproc = true;
                        }
                        else if (co.alreadyvolume >= cv) {
                            co.alreadyvolume = 0;
                            isproc = true;
                        }
                        else {
                            co.alreadyvolume -= cv;
                        }
                    }
                    else if (cp < co.price) {
                        isproc = true;
                    }

                    if (isproc) {
                        let ct = TradeMgr.singleton.newTrade(co, cp, cv, curtms);
                        cv -= ct.volume;

                        market2.ds._onOrder(co);

                        if (co.lastvolume <= 0) {
                            this.lstLimitBuy.splice(j, 1);

                            this.lstFinished.push(co);
                        }
                        else {
                            ++j;
                        }

                        if (cv <= 0) {
                            break;
                        }
                    }
                    else if (cp > co.price) {
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

                        this.lstFinished.push(co);
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

    __removeOrder(market2, order) {
        if (!order.market) {
            return ;
        }

        if (!this.mapMarketOrder.hasOwnProperty(order.market)) {
            this.mapMarketOrder[order.market] = new MarketOrder();
        }

        this.mapMarketOrder[order.market].removeOrder(market2, order);
    }

    __addOrder(market2, order) {
        if (!order.market) {
            return ;
        }

        if (!this.mapMarketOrder.hasOwnProperty(order.market)) {
            this.mapMarketOrder[order.market] = new MarketOrder();
        }

        this.mapMarketOrder[order.market].addOrder(market2, order);
    }

    async init(cfg, tablename) {
        this.tablename = tablename;
        this.cfg = cfg;
        this.mysql = new Mysql(cfg);
        await this.mysql.connect();
        // await this.getOpenOrder();
    }

    getOrder(marketname, mainindexid) {
        if (this.mapMarketOrder[marketname]) {
            return this.mapMarketOrder[marketname].mapOrder[mainindexid];
        }

        return undefined;
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

    // async getOpenOrder() {
    //     if (this.mysql == undefined) {
    //         return ;
    //     }
    //
    //     let sql = util.format("select * from %s where ordstate < 2", this.tablename);
    //     try {
    //         let [err, rows, fields] = await this.mysql.run(sql);
    //         if (err) {
    //             console.log('OrderMgr.getOpenOrder(' + sql + ') err ' + err);
    //
    //             return ;
    //         }
    //
    //         for (let i = 0; i < rows.length; ++i) {
    //             let cd = rows[i];
    //             let co = {};
    //
    //             co.mainid = cd.mainid;
    //             co.indexid = cd.indexid;
    //
    //             if (cd.parentindexid != null) {
    //                 co.parentindexid = cd.parentindexid;
    //             }
    //
    //             if (cd.ordid != null) {
    //                 co.ordid = cd.ordid;
    //             }
    //
    //             co.symbol = cd.symbol;
    //             co.side = cd.side;
    //             co.ordtype = cd.ordtype;
    //             co.ordstate = cd.ordstate;
    //
    //             if (cd.price != null) {
    //                 co.price = cd.price;
    //             }
    //
    //             if (cd.volume != null) {
    //                 co.volume = cd.volume;
    //             }
    //
    //             if (cd.avgprice != null) {
    //                 co.avgprice = cd.avgprice;
    //             }
    //
    //             if (cd.lastvolume != null) {
    //                 co.lastvolume = cd.lastvolume;
    //             }
    //
    //             co.openms = cd.openms;
    //             if (cd.closems != null) {
    //                 co.closems = cd.closems;
    //             }
    //
    //             this.__addOrder(co);
    //         }
    //     }
    //     catch (err) {
    //         console.log('OrderMgr.getOpenOrder(' + sql + ') err ' + err);
    //     }
    // }

    cancelOrder(market2, order, callback) {
        if (order.ordstate == ORDERSTATE.OPEN || order.ordstate == ORDERSTATE.RUNNING) {
            this.__removeOrder(market2, order);

            this.updOrder(order).then(() => {
                if (callback) {
                    callback();
                }
            });
        }
    }

    newMarketOrder(market2, side, symbol, volume, funcIns) {
        let co = {
            market: market2.marketname,
            mainid: this.mainid,
            indexid: this.curindexid++,
            symbol: symbol,
            side: side,
            ordtype: ORDERTYPE.MARKET,
            ordstate: ORDERSTATE.OPEN,
            volume: volume,
            openms: new Date().getTime()
        };

        this.__addOrder(market2, co);

        this.insOrder(co).then((id) => {
            if (funcIns) {
                funcIns(id);
            }
        });

        return co;
    }

    newLimitOrder(market2, side, symbol, price, volume, funcIns) {
        let co = {
            market: market2.marketname,
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

        this.__addOrder(market2, co);

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
    newMakeMarketOrder(market2, side, symbol, price0, volume0, price1, volume1, funcIns) {
        console.log('order - makemarket ' + price0 + ' ' + price1);

        let po = {
            market: market2.marketname,
            mainid: this.mainid,
            indexid: this.curindexid++,
            symbol: symbol,
            side: side,
            ordtype: ORDERTYPE.LIMIT,
            ordstate: ORDERSTATE.OPEN,
            price: price0,
            volume: volume0,
            openms: new Date().getTime()
        };

        this.__addOrder(market2, po);

        let lo = {
            market: market2.marketname,
            mainid: this.mainid,
            indexid: this.curindexid++,
            symbol: symbol,
            side: side == ORDERSIDE.BUY ? ORDERSIDE.SELL : ORDERSIDE.BUY,
            ordtype: ORDERTYPE.LIMIT,
            ordstate: ORDERSTATE.OPEN,
            price: price1,
            volume: volume1,
            openms: new Date().getTime()
        };

        this.__addOrder(market2, lo);

        let lst = [po, lo];

        this._insOrderList(lst, () => {
            if (funcIns) {
                funcIns();
            }
        });

        return lst;
    }

    // stop loss market
    newStopLossOrder(market2, side, symbol, stopLoss, volume, funcIns) {
        let spo = {
            market: market2.marketname,
            mainid: this.mainid,
            indexid: this.curindexid++,
            symbol: symbol,
            side: side,
            ordtype: ORDERTYPE.STOP,
            ordstate: ORDERSTATE.OPEN,
            stopprice: stopLoss,
            volume: volume,
            openms: new Date().getTime(),
        };

        this.__addOrder(market2, spo);

        this.insOrder(spo).then((id) => {
            if (funcIns) {
                funcIns(id);
            }
        });

        return mo;
    }

    // stop profit & stop loss
    // stop loss is market
    // stop profit is limit
    newStopProfitAndLossOrder(market2, side, symbol, stopProfit, stopLoss, volume, funcIns) {
        let mo = {
            market: market2.marketname,
            mainid: this.mainid,
            indexid: this.curindexid++,
            symbol: symbol,
            side: side,
            ordtype: ORDERTYPE.OCO,
            ordstate: ORDERSTATE.OPEN,
            openms: new Date().getTime(),
            lstchild: []
        };

        this.__addOrder(market2, mo);

        let spo = {
            market: market2.marketname,
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

        this.__addOrder(market2, spo);

        let slo = {
            market: market2.marketname,
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

        this.__addOrder(market2, slo);

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