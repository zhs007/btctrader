"use strict";

const { DEPTHINDEX, DEALSINDEX, DEALTYPE } = require('../basedef');
const util = require('util');

async function runDND(ds) {
    let bt = new Date(ds.cfg.begintime);
    let et = new Date(ds.cfg.endtime);
    let btms = bt.getTime();
    let etms = et.getTime();

    while (btms <= etms) {
        let lst = await ds._getDND(btms, btms + ds.cfg.offtimems);
        if (lst && lst.length > 0) {
            for (let i = 0; i < lst.length; ++i) {
                let cn = lst[i];

                ds.deals.push([cn.id, cn.price, cn.volume, cn.tsms, cn.type]);

                ds.asks = [[cn.askprice, cn.askvolume, cn.id, cn.askvolume]];
                ds.bids = [[cn.bidprice, cn.bidvolume, cn.id, cn.bidvolume]];

                ds._onDeals(1);
                ds._onDepth();
            }
        }

        btms += ds.cfg.offtimems;
    }
}

async function runDNDLink(dsmain, dslink) {
    let bt0 = new Date(dsmain.cfg.begintime);
    let et0 = new Date(dsmain.cfg.endtime);
    let bt1 = new Date(dslink.cfg.begintime);
    let et1 = new Date(dslink.cfg.endtime);

    let otms = dsmain.cfg.offtimems > dslink.cfg.offtimems ? dslink.cfg.offtimems : dsmain.cfg.offtimems;
    let btms = bt0.getTime() < bt1.getTime() ? bt1.getTime() : bt0.getTime();
    let etms = et0.getTime() < et1.getTime() ? et0.getTime() : et1.getTime();

    while (btms <= etms) {
        let lst0 = await dsmain._getDND(btms, btms + otms);
        let lst1 = await dslink._getDND(btms, btms + otms);
        if (lst0 && lst0.length > 0) {
            if (lst1 && lst1.length > 0) {
                let lst = [];

                for (let i = 0; i < lst0.length; ++i) {
                    let cn = lst0[i];
                    cn.ds = dsmain;
                    cn.dsi = 0;
                    lst.push(cn);
                }

                for (let i = 0; i < lst1.length; ++i) {
                    let cn = lst1[i];
                    cn.ds = dslink;
                    cn.dsi = 1;
                    lst.push(cn);
                }

                lst.sort((a, b) => {
                    if (a.tsms == b.tsms) {
                        return a.dsi - b.dsi;
                    }

                    return a.tsms - b.tsms;
                });

                for (let i = 0; i < lst.length; ++i) {
                    let cn = lst[i];

                    cn.ds.deals.push([cn.id, cn.price, cn.volume, cn.tsms, cn.type]);

                    cn.ds.asks = [[cn.askprice, cn.askvolume, cn.id, cn.askvolume]];
                    cn.ds.bids = [[cn.bidprice, cn.bidvolume, cn.id, cn.bidvolume]];

                    cn.ds._onDeals(1);
                    cn.ds._onDepth();
                }
            }
            else {
                for (let i = 0; i < lst0.length; ++i) {
                    let cn = lst0[i];

                    dsmain.deals.push([cn.id, cn.price, cn.volume, cn.tsms, cn.type]);

                    dsmain.asks = [[cn.askprice, cn.askvolume, cn.id, cn.askvolume]];
                    dsmain.bids = [[cn.bidprice, cn.bidvolume, cn.id, cn.bidvolume]];

                    dsmain._onDeals(1);
                    dsmain._onDepth();
                }
            }
        }
        else if (lst1 && lst1.length > 0) {
            for (let i = 0; i < lst1.length; ++i) {
                let cn = lst1[i];

                dslink.deals.push([cn.id, cn.price, cn.volume, cn.tsms, cn.type]);

                dslink.asks = [[cn.askprice, cn.askvolume, cn.id, cn.askvolume]];
                dslink.bids = [[cn.bidprice, cn.bidvolume, cn.id, cn.bidvolume]];

                dslink._onDeals(1);
                dslink._onDepth();
            }
        }

        btms += otms;
    }
}

exports.runDND = runDND;
exports.runDNDLink = runDNDLink;
