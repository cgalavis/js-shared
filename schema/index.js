"use strict";

/**
 *
 * @module schema
 * @author Carlos Galavis <cgalavis@crabel.com>
 */

require("../proto");

const EventEmitter = require('events');
const util = require('util');
const fs = require("fs");
const path = require("path");
const parseString = require("xml2js").parseString;

//
const fs_util = require("../fs_util");
const xml = require("../xml");


/**
 *
 * @param {Object} opts
 * @returns {Options}
 * @constructor
 */
function Options(opts) {
    if (!this)
        return new Options(opts);

    if (!opts)
        opts = {};

    this.path = opts.path || "gen";
    this.dump = opts.dump || false;
}


/**
 *
 * @param {Object} [opts]
 * @constructor
 */
function Schema(opts) {
    let object_map = {};
    let type_map = {};
    let group_map = {};

    Object.defineProperty(this, 'object_map',
        { writable: true, value: object_map, enumerable: false });
    Object.defineProperty(this, 'type_map',
        { writable: true, value: type_map, enumerable: false });
    Object.defineProperty(this, 'group_map',
        { writable: true, value: group_map, enumerable: false });

    this.clear();

    // Hide a few properties
    Object.defineProperty(this, '_events', { writable: true, enumerable: false });
    Object.defineProperty(this, '_eventsCount', { writable: true, enumerable: false });

    //

    this.options = new Options(opts);
    fs_util.ensurePath(this.options.path);
}

// Overwrites the prototype so must be called before prototype functions are added.
util.inherits(Schema, EventEmitter);

/**
 * Loads the given schema file and calls the function 'cb' with a reference to the loaded
 * schema object.
 * @param {String} file_name
 * @param {Object|Function} opts
 * @param {Function} [cb]
 */
Schema.load = function (file_name, opts, cb) {
    if (typeof opts === "function") {
        cb = opts;
        opts = undefined;
    }

    let s = new Schema(opts);
    s.load(file_name, cb);
};


/**
 * Loads the given schema file and calls the function 'cb' with a reference to the loaded
 * schema object.
 * @param {String} file_name
 * @param {Function} [cb]
 */
Schema.prototype.load = function (file_name, cb) {
    let self = this;

    this.clear();

    if (!fs.existsSync(file_name)) {
        let e = new Error("Failed to read schema file '" + file_name +
            "'. The file does not exist.");
        if (cb)
            cb(e, null);

        return self.emit("err", e);
    }

    fs.readFile(file_name, function (err, data) {
        if (err) {
            let e = new Error("Failed to read schema file '" + file_name + "'. " +
                err.message);

            if (cb)
                cb(e, null);

            return self.emit("err", e);
        }

        parseString(data, function (err, doc) {
            if (err)
                throw new Error("Failed to parse schema file '" + file_name + "'. " +
                    err.message);

            doc = doc.CrabelObjectSchema;
            if (!doc) {
                let e = new Error("The schema file '" + file_name + "' is not valid, " +
                    "the 'CrabelObjectSchema' element is missing.");

                if (cb)
                    cb("err", e);

                return self.emit("err", e);
            }

            self.emit("loaded", doc);

            if (doc.Groups && Array.isArray(doc.Groups))
                doc.Groups[0].Group.forEach(function (g) {
                    GroupDef.parse(self, null, g);
                });

            if (doc.AttributeTypes && Array.isArray(doc.AttributeTypes))
                doc.AttributeTypes[0].Attribute.forEach(function (t) {
                    TypeDef.parse(self, t);
                });

            if (cb)
                cb(null, self);

            self.emit("done", self);

            if (self.options.dump) {
                let dump_fn = path.join(self.options.path, "schema.json");
                self.save(dump_fn, function (err, doc) {
                    if (err)
                        return self.emit("error", err);
                    self.emit("dumped", self, dump_fn);
                });
            }
        });
    });
};

Schema.prototype.clear = function () {
    this.objects = [];
    this.types = [];
    this.groups = [];

    this.object_map = {};
    this.type_map = {};
    this.group_map = {};
};

Schema.prototype.getType = function (type_name) {
    return this.type_map[type_name];
};

Schema.prototype.getObject = function (obj_name) {
    return this.object_map[obj_name];
};

Schema.prototype.getNativeType = function (type) {
    let type_name = schema_util.getTypeName(type);
    while (!schema_util.isNativeType(type_name))
        type_name = schema_util.getTypeName(this.type_map[type_name]);

    return type_name;
};

Schema.prototype.save = function(file_name, cb) {
    if (!cb || typeof cb !== "function")
        throw new Error("Invalid call to 'Schema.save', the callback function is " +
            "not optional.");

    fs.writeFile(file_name, JSON.stringify(this, null, 4), "utf8", function (err) {
        cb(err);
    });
};


/**
 *
 * @param {Schema} schema
 * @param {GroupDef} parent
 * @param {String} name
 * @param {String} msg_type
 * @param {String} intent
 * @param {Object} attrs
 * @param {Object} refs
 * @returns {ObjectDef}
 * @constructor
 */
function ObjectDef(schema, parent, name, msg_type, intent, attrs, refs) {
    if (!this)
        return new ObjectDef(schema, parent, name, msg_type, intent, attrs, refs);

    if (schema.objects[name])
        throw new Error("Failed to create object '" + name + "', this object has " +
            "already been defined.");

    let self = this;

    Object.defineProperty(this, 'schema', { value: schema, enumerable: false });
    Object.defineProperty(this, 'parent', { value: parent, enumerable: false });

    if (parent)
        this.path = parent.getPath();

    // Attributes
    this.name = name;
    this.msg_type = msg_type;
    this.intent = intent;

    this.attrs = [];
    this.refs = [];

    if (attrs.Attribute)
        attrs.Attribute.forEach(function (a) {
            self.attrs.push({
                name: a.$.Name,
                index: xml.parse.number(a.$.Index),
                type: a.$.Type,
                min_value: xml.parse.number(a.$.MinValue),
                max_value: xml.parse.number(a.$.MaxValue),
                optional: xml.parse.bool(a.$.Optional),
                intent: xml.parse.string(a.Intent)
            });
        });

    if (refs.Object)
        refs.Object.forEach(function (o) {
            self.refs.push({
                name: o.$.Name,
                index: xml.parse.number(o.$.Index),
                type: o.$.Type,
                intent: o.$.Intent,
                link_name: o.$.LinkName,
                min_count: xml.parse.number(o.$.MinCount),
                max_count: xml.parse.number(o.$.MaxCount)
            });
        });

    this.schema.objects.push(this);
    this.schema.object_map[this.path + "::" + name] = this;
}

ObjectDef.parse = function (schema, parent, obj_def) {
    return new ObjectDef(
        schema,
        parent,
        obj_def.$.Name,
        obj_def.$.MessageType,
        xml.parse.string(obj_def.Intent),
        xml.parse.list(obj_def.Attributes),
        xml.parse.list(obj_def.References)
    );
};


/**
 *
 * @param {Schema} schema
 * @param {String} name
 * @param {String} type
 * @param {Number} size
 * @param {Number} min
 * @param {Number} max
 * @param {String} intent
 * @param {Array} values
 * @param {String} external_unit
 * @returns {TypeDef}
 * @constructor
 */
function TypeDef(schema, name, type, size, min, max, intent, values, external_unit) {
    if (!this)
        return new TypeDef(
            schema,
            name,
            type,
            size,
            min,
            max,
            intent,
            values,
            external_unit
        );

    let self = this;

    Object.defineProperty(this, 'schema', { value: schema, enumerable: false });

    // Attributes
    this.name = name;
    this.type = type;
    this.size = size;
    this.min = min;
    this.max = max;
    this.intent = intent;
    this.external_unit = external_unit;

    this.values = [];
    if (values.AllowedValue)
        values.AllowedValue.forEach(function (v) {
            self.values.push({
                value: v.$.Value,
                meaning: v.$.Meaning,
                intent: v.$.Intent
            });
        });

    this.schema.types.push(this);
    this.schema.type_map[name] = this;
}

TypeDef.parse = function (schema, type_def) {
    return new TypeDef(
        schema,
        type_def.$.Name,
        type_def.$.Type,
        xml.parse.number(type_def.$.Size),
        xml.parse.number(type_def.$.MinValue),
        xml.parse.number(type_def.$.MaxValue),
        xml.parse.string(type_def.Intent),
        xml.parse.list(type_def.AllowedValues),
        type_def.$.ExternalUnit
    );
};


/**
 *
 * @param {Schema} schema
 * @param {GroupDef} parent
 * @param {String} name
 * @param {Boolean} is_interface
 * @param {String} intent
 * @returns {GroupDef}
 * @constructor
 */
function GroupDef(schema, parent, name, is_interface, intent) {
    if (!this)
        return new GroupDef(schema, parent, name, is_interface);

    Object.defineProperty(this, 'schema', { value: schema, enumerable: false });
    Object.defineProperty(this, 'parent', { value: parent, enumerable: false });

    // Attributes
    this.name = parent ? parent.name + "::" + name : name;
    this.is_interface = is_interface;
    this.intent = (intent) ? intent.toString() : "<Missing>";

    this.schema.groups.push(this);
    schema.group_map[this.name] = this;
}

GroupDef.parse = function (schema, parent, group_def) {
    let group = new GroupDef(
        schema,
        parent,
        group_def.$.Name,
        group_def.$.IsInterface,
        group_def.Intent
    );

    let groups = xml.parse.list(group_def.Groups);
    let objects = xml.parse.list(group_def.ObjectTypes);

    if (groups.Group)
        groups.Group.forEach(function (g) {
            if (g.$ && g.$.Name)
                GroupDef.parse(schema, group, g);
        });

    if (objects.ObjectDef)
        objects.ObjectDef.forEach(function (o) {
            if (o.$ && o.$.Name)
                ObjectDef.parse(schema, group, o);
        });

    return group;
};

GroupDef.prototype.getPath = function () {
    if (!this.parent)
        return this.name;

    return this.parent.getPath() + "::" + this.name;
};


let schema_util = {
    def_size: {
        "Integer": 4,
        "Numeric": 8,
    },

    getRef: function (obj_class, is_container) {
        if (undefined === is_container)
            is_container = false;

        let name = obj_class.className();
        let res = {};
        res[name] = {
            name: name, ref_class: obj_class, is_container: is_container
        };
    },

    getTypeName: function (type) {
        if (typeof type === "object" && type.type)
            return type.type.toString();

        return type.toString();
    },

    isNativeType: function (type) {
        type = this.getTypeName(type);

        for (let k in native_types)
            if (k === type)
                return true;

        return false;
    },

    getJsType: function (type) {
        return native_types[type];
    },

    initAttr: function (obj_class, data, prop_name) {
        let attr = obj_class._attrs[prop_name];
        let val = data[prop_name];

        if (undefined === attr)
            throw new Error("Invalid call to 'initAttr', the object class does not " +
                "include the property '" + prop_name + "'");

        if (undefined === val) {
            if (!attr.optional)
                throw new Error("Failed to initialize instance of '" + obj_class._name +
                    "', non-optional property '" + prop_name + "' was not found.");

            return undefined;
        }

        if ("Number" === attr.type) {
            if (isNaN(val))
                throw new Error("Invalid data value for numeric property '" + prop_name +
                    "', value '" + val + "' is not a number.");

            return Number(val);
        }

        if ("Boolean" === attr.type)
            return Boolean(val);

        if ("String" === attr.type) {
            if (!val.toString)
                throw new Error("Invalid data value for string property '" + prop_name +
                    "', the value is not serializable to string.");

            return val.toString();
        }

        return val;
    },

    initRef: function (obj_class, data) {
        let ref_data = data[obj_class._name];
        if (Array.isArray(ref_data))
            return Array.from(ref_data, function(val) {
                return new obj_class(val);
            });

        return new obj_class(ref_data);
    }
};


// Map of native schema types to JS types.
const native_types = {
    Integer: "Number",
    Numeric: "Number",
    Alpha: "String",
    Boolean: "Boolean",
    Node: "Object",
};

function fixedString(optional, size) {
    let res = {
        type: native_types.Alpha,
        size: size
    };

    if (optional)
        res.optional = true;

    return res;
}

const common_types = {
    int8:   { type: native_types.Integer, size: 1 },
    int16:  { type: native_types.Integer, size: 2 },
    int32:  { type: native_types.Integer, size: 4 },
    int64:  { type: native_types.Integer, size: 8 },
    //
    uint8:  { type: native_types.Integer, min_value: 0, size: 1 },
    uint16: { type: native_types.Integer, min_value: 0, size: 2 },
    uint32: { type: native_types.Integer, min_value: 0, size: 4 },
    uint64: { type: native_types.Integer, min_value: 0, size: 8 },
    //
    float:  { type: native_types.Numeric, size: 4 },
    double: { type: native_types.Numeric, size: 8 },
    //
    bool:   { type: native_types.Boolean },
    string: { type: native_types.Alpha },
    fixedString: fixedString.bind(null, false),
    //
    optional: {
        fixedString: fixedString.bind(null, true)
    }
};

// Assign name to the common types to aid code generators
for (let t in common_types)
    if (typeof common_types[t] === "object")
        common_types[t].name = t;

// Create optional types
for (let t in common_types)
    common_types.optional[t] = Object.assign({ optional: true }, common_types[t]);


module.exports = {
    Schema: Schema,
    ObjectDef: ObjectDef,
    TypeDef: TypeDef,
    GroupDef: GroupDef,
    //
    xml: require("./converters/xml"),
    json: require("./converters/json"),
    struct: require("./converters/struct"),
    //
    types: common_types,
    //
    util: schema_util
};