'use strict';
var path = require('path'),
    configparser = require('gemini-configparser'),
    _ = require('lodash'),
    GeminiError = require('../errors/gemini-error'),
    util = require('./util'),

    browserOptions = require('./browser-options'),

    is = util.is,
    anyObject = util.anyObject,
    resolveWithProjectRoot = util.resolveWithProjectRoot,
    booleanOption = util.booleanOption,
    positiveIntegerOption = util.positiveIntegerOption,
    root = configparser.root,
    section = configparser.section,
    option = configparser.option,
    map = configparser.map;

module.exports = root(
    section(_.extend(browserOptions.getTopLevel(), {
        system: section({
            projectRoot: option({
                validate: is('string'),
                map: _.ary(path.resolve, 1)
            }),

            sourceRoot: option({
                validate: is('string'),
                map: resolveWithProjectRoot,
                defaultValue: function(config) {
                    return config.system.projectRoot;
                }
            }),

            tempDir: option({
                validate: is('string'),
                defaultValue: ''
            }),

            plugins: anyObject(),

            debug: booleanOption(false),

            parallelLimit: positiveIntegerOption(Infinity),

            diffColor: option({
                defaultValue: '#ff00ff',
                validate: function(value) {
                    if (typeof value !== 'string') {
                        throw new GeminiError('Field "diffColor" must be string');
                    }

                    if (!/^#[0-9a-fA-F]{6}$/.test(value)) {
                        throw new GeminiError('Field "diffColor" must be hexadecimal color string (i.e. #ff0000)');
                    }
                }
            }),

            coverage: section({
                enabled: booleanOption(false),
                map: option({
                    defaultValue: () => {
                        return (url, rootUrl) => url.replace(rootUrl, '').replace(/^\//, '');
                    },
                    validate: (value) => {
                        if (!_.isFunction(value)) {
                            throw new GeminiError('"coverage.map" must be a function');
                        }
                    }
                }),
                exclude: option({
                    defaultValue: [],
                    validate: function(value) {
                        if (!_.isArray(value)) {
                            throw new GeminiError('"coverage.exclude" must be an array');
                        }

                        if (!_.every(value, _.isString)) {
                            throw new GeminiError('"coverage.exclude" must be an array of strings');
                        }
                    }
                }),
                html: booleanOption(true)
            }),

            exclude: option({
                defaultValue: [],
                validate: function(value) {
                    if (_.isString(value)) {
                        return;
                    }

                    if (!_.every(value, _.isString)) {
                        throw new GeminiError('"exclude" must be an array of strings');
                    }
                },
                map: (value) => [].concat(value)
            })
        }),

        sets: map(section({
            files: option({
                validate: function(value) {
                    if (!_.isArray(value) && !_.isString(value)) {
                        throw new GeminiError('"sets.files" must be an array or string');
                    }

                    if (_.isArray(value) && !_.every(value, _.isString)) {
                        throw new GeminiError('"sets.files" must be an array of strings');
                    }
                },
                map: function(val) {
                    return _.isString(val) ? [val] : val;
                }
            }),
            browsers: option({
                defaultValue: function(config) {
                    return _.keys(config.browsers);
                },
                validate: function(value, config) {
                    if (!_.isArray(value)) {
                        throw new GeminiError('"sets.browsers" must be an array');
                    }

                    var unknownBrowsers = _.difference(value, _.keys(config.browsers));
                    if (!_.isEmpty(unknownBrowsers)) {
                        throw new GeminiError('Unknown browsers for "sets.browsers": ' + unknownBrowsers.join(', '));
                    }
                }
            })
        })),

        browsers: map(section(browserOptions.getPerBrowser()))
    }))
);
