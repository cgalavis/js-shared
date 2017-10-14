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


/** @type {ObjClass} */
exports.def_class = { _name: "Anonymous", _attrs: {}, _refs: {} };

exports.validObjClass = function (obj_class) {
    return obj_class &&
        typeof obj_class._name === "string" &&
        typeof obj_class._attrs === "object" &&
        typeof obj_class._refs === "object";
};

