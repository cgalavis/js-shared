"use strict";

const rs = require("restructure");
//
const validObjClass = require("../common").validObjClass;


/**
 *
 * @param {TypeDef} type_spec
 */
function getNativeType(type_def) {
    if (type_def.type === "Integer") {
        let res;
        if (!type_def.size || type_def.size === 4)
            res = "int32";
        else if (type_def.size === 1)
            res = "int8";
        else if (type_def.size === 2)
            res = "int16";
        else if (type_def.size === 8)
            res = "int64";

        if (undefined !== type_def.min && type_def.min >= 0)
            return "u" + res;

        return res;
    }

    if (type_def.type === "Number") {
        if (type_def.size <= 4)
            return "float";

        return "double";
    }

    if (type_def.type === "Boolean")
        return "bool";
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
