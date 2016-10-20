'use strict';

const _ = require('lodash');

const RunnerEvents = require('./constants/events');

module.exports = class Stats {
    constructor(runner) {
        this._tests = {};

        runner
            .on(RunnerEvents.SKIP_STATE, (test) => this._add('skipped', test))
            .on(RunnerEvents.WARNING, (test) => this._add('warned', test))
            .on(RunnerEvents.ERROR, (test) => this._add('errored', test))
            .on(RunnerEvents.UPDATE_RESULT, (test) => this._add(test.updated ? 'updated' : 'passed', test))
            .on(RunnerEvents.TEST_RESULT, (test) => this._add(test.equal ? 'passed' : 'failed', test));
    }

    _add(type, test) {
        this._tests[type] = this._tests[type] || [];

        this._tests = _.mapValues(this._tests, (fullNames) => _.without(fullNames, test.state.fullName));

        this._tests[type].push(test.state.fullName);
    }

    get(type) {
        const stats = this._getStats();

        return type === undefined ? stats : stats[type];
    }

    _getStats() {
        return _(this._tests)
            .mapValues((tests) => tests.length)
            .thru((stats) => _.extend(stats, {total: _(stats).values().sum()}))
            .omitBy((count) => !count)
            .value();
    }
};
