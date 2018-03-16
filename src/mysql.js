"use strict";

const mysql = require('mysql2/promise');

class Mysql {
    constructor(cfg) {
        this.cfg = cfg;
        this.conn = undefined;//mysql.createConnection(this.cfg);
        // this.isconnected = false;
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
            }

            const [rows, fields] = await this.conn.query(sql);

            return [undefined, rows, fields];
        }
        catch(err) {
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
};

exports.Mysql = Mysql;