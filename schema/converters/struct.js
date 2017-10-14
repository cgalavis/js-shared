"use strict";

/**
 * @type {Object}
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
 * @property Boolean
 * @property String
 */
const rs = require("restructure");
//
const validObjClass = require("../common").validObjClass;


/**
 *
 * @param {TypeDef} type_spec
 * @returns {Object}
 */
function getBinaryType(type_def) {
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
        if (type_def.size == 4)
            return rs.float;
        else if (type_def.size == 8)
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


}

module.exports = {

    toObj: function (s, obj_class) {
        if (!validObjClass(obj_class))
            throw new Error("Failed to convert struct reference to an object, the " +
                "object class is not valid.");
    },

    fromObj: function (obj, obj_class) {
        if (!validObjClass(obj_class))
            throw new Error("Failed to convert object to a struct reference, the " +
                "object class is not valid.");

    }
};
