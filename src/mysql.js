"use strict";

const mysql = require('mysql2/promise');
const process = require('process');

class Mysql {
    constructor(cfg) {
        this.cfg = cfg;
        this.conn = undefined;//mysql.createConnection(this.cfg);
        // this.isconnected = false;

        this.alivesqlnums = 0;
    }

    async connect() {
        if (this.conn == undefined) {
            this.conn = await mysql.createConnection(this.cfg);
            console.log('mysql connect ...');
        }
    }

    // // callback(err)
    // _connect(callback) {
    //     if (this.isconnected) {
    //         callback();
    //     }
    //
    //     this.conn.connect((err) => {
    //         callback(err);
    //     });
    // }

    async run(sql) {
        try {
            if (this.conn == undefined) {
                this.conn = await mysql.createConnection(this.cfg);
                console.log('mysql connect ...');
            }

            this.alivesqlnums++;
            const [rows, fields] = await this.conn.query(sql);
            this.alivesqlnums--;

            return [undefined, rows, fields];
        }
        catch(err) {
            this.alivesqlnums--;

            return [ err ];
        }

        // return new Promise((resolve, reject) => {
        //     // this._connect((err) => {
        //     //     if (err) {
        //     //         this.isconnected = false;
        //     //         this.conn.destroy();
        //     //
        //     //         reject(err);
        //     //
        //     //         return ;
        //     //     }
        //     //
        //     //     this.isconnected = true;
        //
        //         this.conn.query(sql, (err, results, fields) => {
        //             if (err) {
        //                 this.isconnected = false;
        //                 this.conn.destroy();
        //
        //                 reject(err);
        //
        //                 return ;
        //             }
        //
        //             resolve(results, fields);
        //         });
        //     // });
        // });
    }

    safeExit(callback) {
        let isend = false;
        setInterval(() => {
            if (isend) {
                return ;
            }

            if (this.alivesqlnums == 0) {
                isend = true;

                callback().then(() => {
                    process.exit();
                });
            }
        }, 1000);
    }
};

exports.Mysql = Mysql;