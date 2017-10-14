"use strict";

/**
 *
 * @module schema
 * @author Carlos Galavis <cgalavis@crabel.com>
 */

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
 * @param {String} file_name
 * @param {Options} opts
 * @constructor
 */
function Schema(file_name, opts) {
    let self = this;

    if (!fs.existsSync(file_name))
        throw new Error("Failed to read schema file '" + file_name +
            "'. The file does not exist.");

    this.objects = [];
    this.types = [];
    this.groups = [];
    this.options = new Options(opts);

    let object_map = {};
    let type_map = {};
    let group_map = {};

    Object.defineProperty(this, 'object_map', { value: object_map, enumerable: false });
    Object.defineProperty(this, 'type_map', { value: type_map, enumerable: false });
    Object.defineProperty(this, 'group_map', { value: group_map, enumerable: false });

    // Hide a few properties
    Object.defineProperty(this, '_events', { writable: true, enumerable: false });
    Object.defineProperty(this, '_eventsCount', { writable: true, enumerable: false });

    //

    fs_util.ensurePath(this.options.path);

    fs.readFile(file_name, function (err, data) {
        if (err)
            throw new Error("Failed to read schema file '" + file_name + "'. " +
                err.message);

        parseString(data, function (err, doc) {
            if (err)
                throw new Error("Failed to parse schema file '" + file_name + "'. " +
                    err.message);

            doc = doc.CrabelObjectSchema;
            if (!doc)
                throw new Error("The schema file '" + file_name + "' is not valid, " +
                    "the 'CrabelObjectSchema' element is missing.");

            self.emit("loaded", doc);

            if (doc.Groups && Array.isArray(doc.Groups))
                doc.Groups[0].Group.forEach(function (g) {
                    GroupDef.parse(self, null, g);
                });

            if (doc.AttributeTypes && Array.isArray(doc.AttributeTypes))
                doc.AttributeTypes[0].Attribute.forEach(function (t) {
                    TypeDef.parse(self, t);
                });

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
}

// Overwrites the prototype so must be called before prototype functions are added.
util.inherits(Schema, EventEmitter);

Schema.prototype.getType = function (type_name) {
    return this.type_map[type_name];
};

Schema.prototype.getObject = function (obj_name) {
    return this.object_map[obj_name];
};

Schema.prototype.save = function(file_name, cb) {
    if (!cb || typeof cb !== "function")
        throw new Error("Invalid call to 'Schema.save', the callback function is " +
            "not optional.");

    fs.writeFile(file_name, JSON.stringify(this, null, 4), "utf8", function (err) {
        cb(err);
    });
};

function getTypeName(type) {
    let t;
    if (typeof type === "object" && type.type)
        return type.type.toString();

    return type.toString();
}

Schema.prototype.isNativeType = function (type) {
    type = getTypeName(type);
    return type === "Integer" ||
        type === "Numeric" ||
        type === "Boolean" ||
        type === "Alpha" ||
        type === "Node";
};

Schema.prototype.getNativeType = function (type) {
    type = getTypeName(type);
    while (!this.isNativeType(type))
        type = getTypeName(this.type_map[type]);

    return type;
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



module.exports = {
    Schema: Schema,
    ObjectDef: ObjectDef,
    TypeDef: TypeDef,
    GroupDef: GroupDef,
    //
    xml: require("./converters/xml"),
    json: require("./converters/json"),
    struct: require("./converters/struct"),
};