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