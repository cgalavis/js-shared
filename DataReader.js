"use strict";

const str_util = require('./str_util');
const EventEmitter = require('events');
const util = require('util');

module.exports = DataReader;

function DataReader(source) {
    if (!source || "object" !== typeof source)
        throw new Error('Invalid call to "DataReader" constructor, the source must be ' +
            'a valid object.');

    let readProp = (type, prop, def, cb) => {
        if ("string" === typeof type) {
            def = prop;
            prop = type;
            type = undefined;
        }

        if ("string" !== typeof prop && "symbol" !== typeof prop)
            throw new Error('Invalid call to function "get". No valid property ' +
                'indentifier was specified.');

        let msg = `Failed to get property "${prop}". `;
        if (undefined === source[prop] && undefined === def) {
            return cb(new Error(msg + "The property was not found in the source " + 
                "object."));
        }

        if (undefined === source[prop])
            source[prop] = def;

        let err_invalid_type = new Error(msg + `The property "${prop}" in source ` +
            "is of the wrong type.");

        switch (type) {
            case Date:
                let dt = new Date(source[prop]);
                if (isNaN(dt.getTime()))
                    return cb(err_invalid_type);
                return cb(null, prop, dt);
            case Number:
                if (isNaN(source[prop]))
                    return cb(err_invalid_type);
                return cb(null, prop, Number(source[prop]));
            case Boolean:
                return cb(null, prop, Boolean(source[prop]));
            case String:
                return cb(null, prop, str_util.combineLines(source[prop]));
            default:
                return cb(null, prop, source[prop]);
        }
    };

    this.get = (type, prop, def) => {
        readProp(type, prop, def, (err, val) => {
            if (err)
                throw err;
            return val;
        });
    };

    this.get.optional = (prop, type, def) => {
        readProp(type, prop, def, (err, prop, val) => val);
    };

    this.transfer = (tgt, type, prop, def) => {
        readProp(type, prop, def, (err, prop, val) => {
            if (err)
                throw err;
            return tgt[prop] = val;
        });
    };

    this.transfer.optional = (tgt, type, prop, def) => {
        readProp(type, prop, def, (err, prop, val) => tgt[prop] = val);
    };
}

util.inherits(DataReader, EventEmitter);
