"use strict";

/** @type {Restructure} */
const rs = require("restructure");
//
const common = require("../common");


/**
 *
 * @param {TypeDef} type_def
 * @returns {NativeType}
 */
module.exports.getBinaryType = function (type_def) {
    if (type_def.native)
        return type_def.native;

    if (type_def.type === "Integer") {
        let unsigned = (undefined !== type_def.min && type_def.min >= 0);

        if (!type_def.size || type_def.size === 4)
            return unsigned ? rs.uint32 : rs.int32;
        else if (type_def.size === 1)
            return unsigned ? rs.uint8 : rs.int8;
        else if (type_def.size === 2)
            return unsigned ? rs.uint16 : rs.int16;
        else if (type_def.size === 8)
            return unsigned ? rs.uint64 : rs.int64;

        throw new Error("Invalid integral type with size=" + type_def.size + ".");
    }

    if (type_def.type === "Number") {
        if (type_def.size === 4)
            return rs.float;
        else if (type_def.size === 8)
            return rs.double;

        throw new Error("Invalid numerical type with size=" + type_def.size + ".");
    }

    if (type_def.type === "Boolean")
        return new rs.Boolean(rs.uint8);

    if (type_def.type === "Alpha") {
        if (isNaN(type_def.size))
            return new rs.String(rs.uint8, "utf8");

        return new rs.String(type_def.size);
    }
};


module.exports.getStructType = function (obj_class) {
    if (!obj_class._struct) {
        let self = this;

        obj_class._struct = {};
        for (let k in obj_class._attrs)
            obj_class._struct[k] = this.getBinaryType(obj_class._attrs[k]);

        for (let k in obj_class._refs) {
            let obj = obj_class._refs[k];
            let s = self.getStructType(obj.ref_class);
            if (obj.is_container) {
                obj_class._struct[obj.name] = new rs.Array(s, rs.uint32);
                obj_class._struct[obj.name].size = function (o, ctx) {
                    if (o && Array.isArray(o))
                        return o.length;
                    return 0;
                };
            }
            else
                obj_class._struct[obj.name] = s;
        }
    }

    return obj_class._struct;
};


/**
 *
 * @param {Buffer} s
 * @param {ObjClass} obj_class
 * @returns {Object}
 */
module.exports.toObj = function (s, obj_class) {
    if (!common.validObjClass(obj_class))
        throw new Error("Failed to convert struct reference to an object, the " +
            "object class is not valid.");
};


/**
 *
 * @param {Object} obj
 * @param {ObjClass} obj_class
 * @returns {Buffer}
 */
module.exports.fromObj = function (obj, obj_class) {
    if (!common.validObjClass(obj_class))
        throw new Error("Failed to convert object to a struct reference, the " +
            "object class is not valid.");

};


