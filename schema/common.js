"use strict";


const _types = {
    int8: { type: Number, int: true, size: 1 },
    int16: { type: Number, int: true, size: 2 },
    int32: { type: Number, int: true, size: 4 },
    int64: { type: Number, int: true, size: 8 },
    //
    uint8: { type: Number, int: true, size: 1, min: 0 },
    uint16: { type: Number, int: true, size: 2, min: 0 },
    uint32: { type: Number, int: true, size: 4, min: 0 },
    uint64: { type: Number, int:true, size: 8, min: 0 },
    //
    byte: { type: Number, int: true, size: 1 },
    short: { type: Number, int: true, size: 2 },
    int: { type: Number, int: true, size: 4 },
    long: { type: Number, int: true, size: 8 },
    //
    char: { type: Number, int: true, size: 1, min: 0 },
    word: { type: Number, int: true, size: 2, min: 0 },
    dword: { type: Number, int: true, size: 4, min: 0 },
    ulong: { type: Number, int:true, size: 8, min: 0 },
    //
    float: { type: Number },
    double: { type: Number },
    //
    bool: { type: Boolean },
    string: { type: String },
    fixedString: fixedType.bind(null, false, String),
    array: { type: Array },
    fixedArray: fixedType.bind(null, false, Array),
    //
    struct: { type: Object },
    union: { type: Object },
    namespace: { type: Object },
    //
    interface: { type: Object },
    function: { type: Function },
    //
    optional: {
        fixedString: fixedType.bind(null, true, String),
        fixedArray: fixedType.bind(null, true, Array),
    },
    //
    isNumeric: function (type) {
        if (undefined === this[type])
            return false;

        return this[type].type === Number;
    },
    isInt: function (type) {
        if (undefined === this[type])
            return false;

        return this[type].int;
    },
    isFloat: function (type) {
        if (undefined === this[type])
            return false;

        return (this[type] === Number) && !this[type].int;
    },
    isPrimitive: function (type) {
        if (undefined === this[type])
            return false;

        return this[type].type === Number ||
            this[type].type === Boolean ||
            this[type].type === String;
    },
    isNative: function (type) {
        return this[type] !== undefined;
    },
    isInline: function (type) {
        return (type === "struct") ||
            (type === "union") || (type === "enum");
    }
};

module.exports.types = _types;

// Assign name to the common types to aid code generators
for (let t in _types)
    if (typeof _types[t] === "object")
        _types[t].name = t;

// Create optional types
for (let t in _types)
    if (_types[t].type)
        _types.optional[t] = Object.assign({ optional: true }, _types[t]);

function fixedType(optional, type, size) {
    let res = {
        type: type,
        size: size
    };

    if (optional)
        res.optional = true;

    return res;
}


module.exports.validName = function (name) {
    // TODO : Implement this
    return true;
};



/**
 * @typedef {Function} ObjClass
 * @property {String} name
 * @property {String} doc
 * @property {String} type
 * @property {Object} members
 */

/**
 * @typedef {Function} ToFunction
 * @param {String|Buffer} doc
 * @param {ObjClass} [obj_class]
 * @returns {Object}
 */

/**
 * @typedef {Function} FromFunction
 * @param {Object} obj
 * @param {ObjClass} [obj_class]
 * @returns {String|Buffer}
 */

/**
 * @typedef {Object} Converter
 * @property {ToFunction} toObj
 * @property {FromFunction} fromObj
 */




