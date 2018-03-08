"use strict";

const mysql = require('mysql2');

class Mysql {
    constructor(cfg) {
        this.cfg = cfg;
        this.conn = mysql.createConnection(this.cfg);
        this.isconnected = false;
    }

    // callback(err)
    _connect(callback) {
        if (this.isconnected) {
            callback();
        }

        this.conn.connect((err) => {
            callback(err);
        });
    }

    run(sql) {
        return new Promise((resolve, reject) => {
            this._connect((err) => {
                if (err) {
                    this.isconnected = false;
                    this.conn.destroy();

                    reject(err);

                    return ;
                }

                this.isconnected = true;

                this.conn.execute(sql, (err, results, fields) => {
                    if (err) {
                        this.isconnected = false;
                        this.conn.destroy();

                        reject(err);

                        return ;
                    }

                    resolve(results, fields);
                });
            });
        });
    }
};

exports.Mysql = Mysql;