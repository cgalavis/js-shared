"use strict";

require("./proto").init();
const str_util = require("./str_util");

module.exports = FieldChecker;

/**
 * @typedef Range
 * @property {*} min
 * @property {*} max
 */

/**
 * @typedef FieldSpecs
 * @property {String} name
 * @property {Function} type
 * @property {Boolean|Function} [required]
 * @property {Boolean} [int]
 * @property {Array.<*>} [values]
 * @property {Range} [range]
 * @property {Function} [validate]
 */


/**
 * 
 * @param {Array.<FieldSpecs>} fields 
 */
function FieldChecker(fields) {
    if (!this || this === global)
        return new FieldChecker(fields);

    if (!fields || "object" !== typeof fields)
        throw new Error("Invalid call to FieldChecker constructor, the 'fields' " + 
            "argument is not optional.");

    for (let field of fields) {
        if (!str_util.is_valid.varName(field.name))
            throw new Error("Invalid call to FieldChecker constructor, the fields " +
                "collection is not valid, one of the fields is missing it's name.");

        if ("function" !== typeof field.type)
            throw new Error("Invalid call to FieldChecker constructor, the fields " +
                `collection is not valid. Field "${field.name}" has an invalid type` +
                "specified.");

        if (field.values) {
            if (!Array.isArray(field.values))
                throw new Error("Invalid call to FieldChecker constructor, the fields " +
                    `collection is not valid. Field "${field.name}" has an invalid ` +
                    `"values" collection.`);

            field.values.forEach(function (v) { validateValue(field, v); });
        }

        if (!field.range)
            field.range = {};

        if (undefined !== field.range.min) 
            validateValue(field, field.range.min);
        if (undefined !== field.range.max)
            validateValue(field, field.range.max);

        if (undefined !== field.range.min && undefined !== field.range.max)
            if (field.range.min > field.range.max)
                throw new Error("Invalid call to FieldChecker constructor, the fields " +
                    "collection is not valid. The minimum value allowed for field " +
                    `"${field.name}" is greater than the maximum value allowed.`);
    }

    this.fields = fields;

    //

    function validateValue(field, v) {
        if (v.constructor !== field.type)
            throw new Error("Invalid call to FieldChecker constructor, the fields " + 
                `collection is not valid, value "${v}" of field "${field.name}" ` +
                `is not a valid "${Object.className(field.type)}"`);
    }
};

FieldChecker.validate = function (fields, data) {
    if (!fields)
        return;

    let fc = new FieldChecker(fields);
    fc.validate(data);
}

FieldChecker.prototype.validate = function(obj) {
    for (let field of this.fields) {
        let k = field.name;
        let required;
        
        if ("function" === typeof field.required)
            required = field.required(obj);
        else
            required = Boolean(field.required);

        if (undefined === obj[k]) {
            if (required)
                throw new Error(`Required field "${k}" was not found.`);

            continue;
        }

        if (!validType(field, obj, k))
            throw new Error(`Field "${k}" is of the wrong type.`);

        if (field.range)
            if (
                (undefined !== field.range.min && obj[k] < field.range.min) ||
                (undefined !== field.range.max && obj[k] > field.range.max)
            )
                throw new Error(`Value of field "${k}" is outside of the allowed range.`);


        if (field.values)
            if (-1 === field.values.indexOf(obj[k]))
                throw new Error(`Value of field "${k}" is not allowed.`);

        if (field.validate)
            field.validate(obj[k], obj);
    }
};




//

function validType(field, obj, prop) {
    if (!field.type)
        return true;

    switch (field.type) {
        case String:
            if ("function" !== typeof obj[prop].toString)
                return false;
            obj[prop] = str_util.combineLines(obj[prop]);
            break;
        case Number:
            if (isNaN(obj[prop]))
                return false;
            obj[prop] = Number(obj[prop]);
            if (field.int && !Number.isInteger(obj[prop]))
                return false;
            break;
        case Boolean:
            obj[prop] = Boolean(obj[prop]);
            break;
        case Date:
            let d = new Date(obj[prop]);
            if (isNaN(d.getTime()))
                return false;
            break;
        case Array:
            if (!Array.isArray(obj[prop]))
                return false;
            break;
        case Object:
            if ("object" !== typeof obj[prop])
                return false;
            break;
        default:
            throw new Error(`Type "${Object.className(field.type)}" is not supported by the ` +
                "field checker.");
    }

    return true;
}