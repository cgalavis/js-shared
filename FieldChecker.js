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
 * @typedef {Object} FieldSpecs
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


    // 1.  Validate field object.
    if (!fields || "object" !== typeof fields)
        throw new Error("Invalid call to FieldChecker constructor, the 'fields' " +
            "argument is not optional.");

    for (let field of fields) {
        if (!str_util.is_valid.varName(field.name))
            throw new Error("Invalid call to FieldChecker constructor, the fields " +
                "collection is not valid, one of the fields is missing it's name.");

        if (field.type && "function" !== typeof field.type)
            throw new Error("Invalid call to FieldChecker constructor, the fields " +
                `collection is not valid. Field "${field.name}" has an invalid type ` +
                "specified.");

        if (field.values) {
            if (!Array.isArray(field.values))
                throw new Error("Invalid call to FieldChecker constructor, the fields " +
                    `collection is not valid. Field "${field.name}" has an invalid ` +
                    `"values" collection.`);

            if (field.type !== Array)
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


        // 2.  Assign default getter and setter functions if non was supplied.
        if ("function" !== typeof field.get)
            field.get = (obj, name) => obj[name];

        if ("function" !== typeof field.set)
            field.set = (obj, name, val) => obj[name] = val;


        // 3.  Set default values for object fields.
        if (Object === field.type && field.field_specs) {
            if (field.default)
                throw new Error(`Invalid field ${field.name}. Fields of "type "Object" ` +
                    "can't have a default value, these are constructed from the " +
                    "default values of it's members.");

            field.default = {};
            let def = FieldChecker.buildDefaultObject(field);
            field.default.merge(def, false, true);
        }
    }

    this.fields = fields;

    //

    function validateValue(field, v) {
        if (!field.type)
            return;

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
};

FieldChecker.buildDefaultObject = function (field) {
    if (!field.field_specs)
        return undefined;

    let res = {};
    for (let k in field.field_specs) {
        let f = field.field_specs[k];
        if (f.type === Object) {
            let so_default = FieldChecker.buildDefaultObject(f);
            if (f)
                res[f.name] = so_default;
        }
        else if (f.default)
            res[f.name] = f.default;
    }

    return res;
};

FieldChecker.prototype.validate = function(obj) {
    for (let field of this.fields) {
        let k = field.name;

        let required;
        if ("function" === typeof field.required)
            required = field.required(obj);
        else
            required = Boolean(field.required);

        if (undefined === obj[k])
            obj[k] = field.default;

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
            if (!Array.isArray(obj[k])) {
                if (-1 === field.values.indexOf(obj[k]))
                    throw new Error(`Value "${obj[k]}" of field "${k}" is not allowed, ` +
                        `allowed values are: ${JSON.stringify(field.values)}`);
            }
            else for (let v of obj[k])
                if (-1 === field.values.indexOf(v))
                    throw new Error(`Value "${v}" of field "${k}" is not allowed, ` +
                        `allowed values are: ${JSON.stringify(field.values)}`);

        if (field.validate)
            field.validate(obj[k], obj);
    }

    // Order fields base on field_specs
    this.fields.forEach((fld) => {
        if (obj[fld.name]) {
            let val = obj[fld.name];
            delete obj[fld.name];
            obj[fld.name] = val;
        }
    });
};



//

function validType(field, obj, prop) {
    if (!field.type)
        return true;

    let val = field.get(obj, prop);
    switch (field.type) {
        case String:
            if ("function" !== typeof val.toString)
                return false;
            val = str_util.combineLines(val);
            field.set(obj, prop, val);
            break;
        case Number:
            if (isNaN(val))
                return false;
            val = Number(val);
            field.set(obj, prop, val);
            if (field.int && !Number.isInteger(val))
                return false;
            break;
        case Boolean:
            val = Boolean(val);
            field.set(obj, prop, val);
            break;
        case Date:
            let d = new Date(val);
            if (isNaN(d.getTime()))
                return false;
            break;
        case Array:
            if (!Array.isArray(val))
                return false;
            if (!Array.isArray(field.field_specs))
                return true;
            try {
                val.forEach((v) => FieldChecker.validate(field.field_specs, v));
            }
            catch (e) {
                throw new Error(`Invalid instance of "${field.name}". ${e.message}`);
            }
            break;
        case Object:
            if ("object" !== typeof val)
                return false;
            if (!Array.isArray(field.field_specs))
                return true;
            try {
                FieldChecker.validate(field.field_specs, val);
            }
            catch (e) {
                throw new Error(`Invalid instance of "${field.name}". ${e.message}`);
            }
            break;
        default:
            throw new Error(`Type "${Object.className(field.type)}" is not supported by the ` +
                "field checker.");
    }

    return true;
}



// Test Functions

FieldChecker.test = function () {
    const field_specs = [
        { name: "targets", type: Array, required: true, values: [ "cpp", "thrift", "node" ] },
        { name: "target_dir", type: String, required: true },
        { name: "schema", type: String, required: true },
        { name: "count", type: Number, default: 100 },
        {
            name: "type_id", type: Object, required: true,
            field_specs: [
                { name: "offset", type: Number, default: 10, range: { min: 0 } },
                {
                    name: "file_name", type: String, required: true,
                    validate(val) {
                        if ("type_id.csv" !== val)
                            throw new Error(`The field ${this.name} has the wrong value.`);
                    }
                },
            ]
        }
    ];

    let data = {
        targets: [ "cpp" ],
        target_dir: "./gen",
        schema: "schema.json",
        type_id: {
            file_name: "type_id.csv"
        }
    };

    FieldChecker.validate(field_specs, data);

    console.log(JSON.stringify(data, null, 4));
};






