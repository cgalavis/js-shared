"use strict";

/**
 * @typedef {Function} ObjClass
 * @property {String} _name
 * @property {Object} _attrs
 * @property {Object} _refs
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


/**
 * @typedef {Object} Restructure
 * @property int64
 * @property int32
 * @property int16
 * @property int8
 * @property uint64
 * @property uint32
 * @property uint16
 * @property uint8
 * @property double
 * @property float
 * @property Array
 * @property String
 * @property Struct
 * @property Enum
 */

/**
 * @typedef { rs.int8 | rs.int16 | rs.int32 | rs.int64 |
        rs.uint8 | rs.uint16 | rs.uint32 |rs.uint64 |
        rs.float | rs.double | rs.Array | rs.String } NativeType
 */


/** @type {ObjClass} */
exports.def_class = { _name: "Anonymous", _attrs: {}, _refs: {} };

exports.validObjClass = function (obj_class) {
    return obj_class &&
        typeof obj_class._name === "string" &&
        typeof obj_class._attrs === "object" &&
        typeof obj_class._refs === "object";
};


/** @type {Restructure} */
const rs = require("restructure");

exports.types = {
    int8:   { type: "Integer", size: 1, native: rs.int8 },
    int16:  { type: "Integer", size: 2, native: rs.int16 },
    int32:  { type: "Integer", size: 4, native: rs.int32 },
    int64:  { type: "Integer", size: 8, native: rs.int64 },
    uint8:  { type: "Integer", size: 1, min: 0, native: rs.uint8 },
    uint16: { type: "Integer", size: 2, min: 0, native: rs.uint16 },
    uint32: { type: "Integer", size: 4, min: 0, native: rs.uint32 },
    uint64: { type: "Integer", size: 8, min: 0, native: rs.uint64 },
    float:  { type: "Numeric", size: 4, native: rs.float },
    double: { type: "Numeric", size: 8, native: rs.double },
    bool:   { type: "Boolean", native: new rs.Boolean(rs.uint8) },
    string: { type: "Alpha", native: new rs.String(rs.uint32, "utf8") },
    node:   { type: "Node" }
};

