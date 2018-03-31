"use strict";

const process = require('process');

const RUNQUEUE_RESULT = {
    OK:     0,
    RETRY:  -1,
    CANCEL: 1,
};

class RunQueue {
    // funcRun is like func(node, callback), cur callback is like funcResult
    // funcResult is like func(result)
    constructor(funcRun, funcResult) {
        this.queue = [];

        this.funcRun = funcRun;
        this.funcResult = funcResult;

        this.curNode = undefined;
    }

    run(node) {
        if (this.curNode == undefined) {
            this.curNode = node;

            this._run();
            // this.funcRun(node, (result) => {
            //     this._onResult(result);
            // });

            return ;
        }

        this.queue.push(node);
    }

    _onResult(result) {
        let ret = this.funcResult(result);
        if (ret == RUNQUEUE_RESULT.RETRY) {
            process.nextTick(() => {
                this._run();
            });

            return ;
        }

        this._runQueue();
    }

    _run() {
        if (this.curNode != undefined) {
            this.funcRun(this.curNode, (result) => {
                this._onResult(result);
            });

            return ;
        }

        this._runQueue();
    }

    _runQueue() {
        this.curNode = undefined;

        if (this.queue.length > 0) {
            this.curNode = this.queue[0];
            this.queue.splice(0, 1);

            this._run();
        }
    }
};

exports.RUNQUEUE_RESULT = RUNQUEUE_RESULT;

exports.RunQueue = RunQueue;
