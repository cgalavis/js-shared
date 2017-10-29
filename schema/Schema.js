"use strict";

/**
 * This module contains classes and definitions needed to parse the schema file
 * @module parser
 */

require("../proto");

const EventEmitter = require('events');
const util = require('util');
const fs = require("fs");
const path = require("path");
const mkdirp = require("mkdirp");
const glob = require("glob");

const fs_util = require("../fs_util");
const common = require("./common");


const doc_version = {
    major: 1,
    minor: 0,
    revision: 0,
    //
    /**
     * Verifies the version of a schema document.
     * RULES:
     *      1.  The major version number must match.
     *      2.  The minor version number of the document must be the same or older than
     *          the supported version of the schema.
     *      3.  The revision number does not matter.
     * @param v
     * @returns {boolean}
     */
    isValid: function (v) {
        if (!v)
            return false;

        let valid_version = true;
        if ("string" === typeof v)
            v = v.split(".").map(function (i) {
                if (isNaN(i)){
                    valid_version = false;
                    return;
                }

                return Number(i.trim());
            });

        if (!valid_version || !Array.isArray(v)|| v.length < 2)
            return false;

        return (v[0] === this.major) &&
            (v[1] <= this.minor);
    }
};

const def_templates = {
    "file": "file.template",
    "namespace": "namespace.template",
    "struct": "struct.template",
    "union": "union.template",
    "enum": "enum.template"
};

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
 * @typedef {Object} Member
 * @property {Member} parent
 * @property {String} name
 * @property {String} type
 * @property {String} [inherits_from]
 * @property {String} [value_type]
 * Only for enums.
 * @property {Object} [values]
 * Key value pair collection for enum types.
 * @property {String} [doc]
 * @property {Array.<Member>} [members]
 */

/**
 * @typedef {Object} Templates
 * @property {String} file
 * @property {String} namespace
 * @property {String} struct
 * @property {String} union
 * @property {String} enum
 */

/**
 * Object use to parse, validate and use schema objects.
 * @param {Object} opts
 * @property {String} name
 * @property {String|Array.<Number>} version
 * @property {String} [author]
 * @property {String} [doc]
 * @property {String} [root_namespace]
 * @property {Templates} [templates]
 * @property {Array.<String>} [dependencies]
 * @property {Array.<Member>} members
 * @returns {Schema}
 * @constructor
 */
function Schema(opts) {
    if (!this)
        return new Schema(opts);

    // Hide a few properties
    Object.defineProperty(this, '_events', { writable: true, enumerable: false });
    Object.defineProperty(this, '_eventsCount', { writable: true, enumerable: false });

    this.options = new Options(opts);
}

// Overwrites the prototype so must be called before prototype functions are added.
util.inherits(Schema, EventEmitter);


Schema.master = null;
Schema.file = null;
Schema.path = null;
Schema.documents = {};


/**
 *
 * @param {String} fname
 * @param {Object} [opts]
 * @returns {null|Schema}
 */
Schema.load = function (fname, opts) {
    Schema.file = path.basename(fname);
    Schema.path = path.dirname(fname);

    Schema.master = new Schema(opts);
    Schema.master.load(Schema.file);

    // Expand dependencies
    for (let doc_name in Schema.documents)
        if (Schema.documents.hasOwnProperty(doc_name))
            expandDependencies(Schema.documents[doc_name]);

    return Schema.master;


    //

    function expandDependencies(doc) {
        let dep_map = {};
        doc.dependencies.forEach(function (d) {
            dep_map[d] = true;
        });

        doc.dependencies.forEach(function (dep_name) {
            let d_doc = Schema.documents[dep_name];
            if (d_doc)
                applyDeps(expandDependencies(d_doc));
        });

        return doc.dependencies;


        //

        function addDep(d_name) {
            if (!dep_map[d_name]) {
                dep_map[d_name] = true;
                doc.dependencies.push(d_name);
            }
        }

        function applyDeps(deps) {
            deps.forEach(function (d_name) {
                addDep(d_name);
            });
        }
    }

};

Schema.isValidDocument = function (fname) {
    if (".json" !== path.extname(fname))
        return false;

    try {
        let doc = JSON.parse(fs.readFileSync(fname, "utf8"));
        validateSchema(doc);
        return true;
    }
    catch (e) {
        return false;
    }
};

/**
 * Initializes the schema document referenced by the 'this' property.
 * @param {Object} doc
 */
Schema.prototype.init = function (doc) {
    let self = this;

    // Initialize optional defaulted attributes
    this.members = [];
    this.dependencies = [];
    this.templates = def_templates;


    // Remove other optional attributes
    if (this.author) delete this.author;
    if (this.doc) delete this.doc;
    if (this.root_namespace) delete this.root_namespace;

    // Following values must be present in the 'doc' object, so set to null for the
    // validator.
    this.version = null;

    for (let k in doc)
        if (doc.hasOwnProperty(k))
            this[k] = doc[k];

    validateSchema(doc);

    let member_map = {};
    this.members.forEach(function (m, i) {
        self.members[i] = new Member(null, self, i, m);
        for (let sm in self.members[i].member_map)
            if (self.members[i].member_map.hasOwnProperty(sm))
                member_map[sm] = self.members[i].member_map[sm];
    });

    Object.defineProperty(this, 'member_map',
        { writable: false, value: member_map, enumerable: false });

    let exp_deps_map = {};
    let exp_deps = [];
    let s_path = path.resolve(Schema.path);
    let s_file = path.join(s_path, Schema.file);
    this.dependencies.forEach(function (dep) {
        let dep_path = path.resolve(path.join(Schema.path, dep));
        glob.sync(dep_path, {cmd: Schema.path, nodir: true}).forEach(function (d) {
            // Make path relative to the schema document
            if (Schema.isValidDocument(d) && d !== s_file) {
                d = d.substr(s_path.length + 1);

                if (!exp_deps_map[d]) {
                    exp_deps_map[d] = true;
                    exp_deps.push(d);
                }
            }
        });
    });

    this.dependencies = exp_deps;

    // Load all the dependencies
    this.dependencies.forEach(function (dep) {
        if (!Schema.documents[dep]) {
            Schema(self.options).load(dep);
        }
    });
};

/**
 *
 * @param {String} doc_name
 * @returns {Schema}
 */
Schema.prototype.load = function (doc_name) {
    if (Schema.documents[doc_name])
        throw new Error("Invalid call to Schema constructor for document '" + doc_name +
            "', a document with the same name has already been processed.");

    let fname = doc_name;
    if (!path.isAbsolute(fname))
        fname = path.join(Schema.path, fname);

    if (!fs.existsSync((fname)))
        throw new Error("Failed to read schema file '" + fname + "'. The file " +
            "does not exist.");

    try {
        this.init(require(path.resolve(fname)));
        if (this.members.length > 0)
            Schema.documents[doc_name] = this;

        return this;
    }
    catch (err) {
        throw new Error("Failed to read schema file '" + fname + "'. " + err.message);
    }
};

/**
 *
 * @param {String} m_name
 * @returns {Member|undefined}
 */
Schema.prototype.findMember = function (m_name) {
    return this.member_map[m_name];
};

/**
 *
 * @param {Function} cb
 */
Schema.prototype.parse = function (cb) {
    if (!cb || typeof cb !== "function")
        cb = function () {};

    this.members.forEach(function (m) {
        m.parse(0, cb);
    });
};


/**
 *
 * @param {Member|null} parent
 * @param {Schema} schema
 * @param {Number} index
 * @param {Object} data
 * @returns {Member}
 * @constructor
 */
function Member(parent, schema, index, data) {
    if (!this)
        return new Member(parent, schema, index, data);

    validateMember(parent, index, data);

    this.schema = schema;
    this.parent = parent;
    this.index = index;

    Object.defineProperty(this, 'schema', { writable: false, enumerable: false });
    Object.defineProperty(this, 'parent', { writable: false, enumerable: false });
    Object.defineProperty(this, 'index', { writable: false, enumerable: false });

    for (let k in data)
        if (data.hasOwnProperty(k) && undefined === this[k])
            this[k] = data[k];

    if (Array.isArray(this.doc))
        this.doc = this.doc.join("\n");
    else if (!this.doc)
        this.doc = "";

    this.template = getTemplateForType(this);

    let self = this;
    let member_map = {};

    this.mapMembers = function (mem) {
        member_map[mem.fullName()] = mem;
        for (let mm in mem.member_map)
            if (mem.member_map.hasOwnProperty(mm)) {
                if (!common.types.isInline(mem.member_map[mm].type) &&
                    common.types.isInline(mem.type)
                )
                    continue;

                member_map[mm] = mem.member_map[mm];
            }
    };

    if (Array.isArray(this.members))
        this.members.forEach(function (m, i) {
            let m_name = getFullName(parent, i, m);
            if (member_map[m_name])
                throw new Error("Invalid schema document, the definition of '" +
                     self.fullName() + "' has duplicate member '" + m_name + "'.");

            self.members[i] = new Member(self, schema, i, m);
            self.mapMembers(self.members[i]);
        });

    Object.defineProperty(this, 'member_map',
        { writable: false, value: member_map, enumerable: false });
}

Member.prototype.fullName = function () {
    return getFullName(this.parent, this.index, this);
};

Member.prototype.parse = function (level, cb) {
    cb(this, level);

    if (common.types[this.type] && common.types[this.type].type === Object)
        this.emit(this.type, this, level);

    this.members.forEach(function (m) {
        m.parse(level + 1, cb);
    });
};



// Private Functions


/**
 * Verifies that the schema document is valid. This method checks the version and
 * required properties.
 * @param doc
 */
function validateSchema(doc) {

    if (!doc_version.isValid(doc.version))
        throw new Error("Schema document not supported, either the version is " +
            "not supported, or version information is missing or invalid.");
}


/**
 *
 * @param {Member} parent
 * @param {Number} index
 * @param {Object} data
 */
function validateMember(parent, index, data) {
    const mname = getFullName(parent, index, data);
    const msg = "Invalid schema document. ";

    if (!data.type)
        throw new Error(msg + "Member '" + mname + "' is missing the 'type' " +
            "specification.");

    validateName();

    switch(data.type) {
        case "struct":
        case "union":
            validateStruct();
            break;
        case "enum":
            validateEnum();
            break;
        case "array":
            validateArray();
            break;
        default:
    }



    function validateName() {
        if (data.type !== "struct" && data.type !== "union")
            if (undefined === data.name)
                throw new Error("Member '" + mname + "' has no name, only 'struct' and " +
                    "'union' types can be anonymous.");

        if (undefined !== data.name)
            if (!validName(data.name))
                throw new Error("Member '" + mname + "' has an invalid name.");

    }

    function validateStruct() {
        if (!Array.isArray(data.members) || data.members.length === 0)
            throw new Error(msg + "'" + data.type + "' type '" + mname +
                "' has no members.");
    }

    function validateEnum() {
        const err_msg = msg + "'" + data.type + "' type '" + mname + "' ";
        const err_invalid_value = err_msg + "has invalid values.";

        if (!data.value_type)
            data.value_type = "int32";

        if (!common.types.isPrimitive(data.value_type))
            throw new Error(err_msg + "has non-primitive value type.");

        if (!Array.isArray(data.values) || data.values.length === 0)
            throw new Error(err_msg + "has no values");

        data.values.forEach(function (v, i) {
            if (undefined === v.name || undefined === v.value)
                throw new Error(err_invalid_value);

            if (!validName(v.name))
                throw new Error(err_invalid_value);

            if (common.types.isNumeric(data.value_type))
                if (isNaN(v.value))
                    throw new Error(err_invalid_value);

                data.values[i] = Number(v);
        });
    }

    function validateArray() {
        if (!data.value_type || undefined === common.types[data.value_type])
            throw new Error("Invalid 'array' in member '" + mname + "', a valid " +
                "'value_type' was not specified.");
    }
}


function validName(name) {
    // TODO : Implement this
    return true;
}

/**
 *
 * @param {Number} index
 * @param {Object} data
 * @returns {string}
 */
function getName(index, data) {
    let postfix = "";
    if ("function" === data.type) {
        data.params.forEach(function (p) {
            if (postfix) postfix += ", ";
            postfix += p.type;
        });
        postfix ="(" + postfix + ")";
    }

    if (data.name)
        return data.name + postfix;

    return "<anonymous>[" + index + "]" + postfix;
}

/**
 *
 * @param {Member} parent
 * @param {Number} index
 * @param {Object} data
 * @returns {String}
 */
function getFullName(parent, index, data) {
    if (parent)
        return parent.fullName() + "::" + getName(index, data);

    return getName(index, data);
}

/**
 *
 * @param {Member} member
 * @param {String} [type]
 * @returns {String}
 */
function getTemplateForType(member, type) {
    if (undefined === type)
        type = member.type;

    if (member.template)
        return member.template;

    if (member.parent)
        return getTemplateForType(member.parent, type);

    return member.schema.templates[type];
}


module.exports = Schema;
