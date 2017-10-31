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
const Member = require("./Member");


const doc_version = {
    major:      1,
    minor:      0,
    revision:   0,


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
    "file": "{{lang}}-file.template",
    "namespace": "{{lang}}-namespace.template",
    "struct": "{{lang}}-struct.template"
};

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
function Schema() {
    if (!this)
        return new Schema();

    // Hide a few properties
    Object.defineProperty(this, '_events', { writable: true, enumerable: false });
    Object.defineProperty(this, '_eventsCount', { writable: true, enumerable: false });
}

// Overwrites the prototype so must be called before prototype functions are added.
util.inherits(Schema, EventEmitter);


Schema.master = new Schema();
Schema.file = null;
Schema.path = null;
Schema.documents = {};

Schema.on = function () { Schema.master.on.apply(Schema.master, arguments); };
Schema.once = function () { Schema.master.once.apply(Schema.master, arguments); };
Schema.emit = function () { Schema.master.emit.apply(Schema.master, arguments); };

Schema.resolveTemplates = function (schema) {
    let def_templ = def_templates;
    if (schema !== Schema.master)
        def_templ = Schema.master.templates;

    for (let t in def_templ) {
        if (!def_templ.hasOwnProperty(t))
            continue;

        schema[t] = schema[t] || def_templ[t];
    }
};

/**
 *
 * @param {String} fname
 * @returns {null|Schema}
 */
Schema.load = function (fname) {
    Schema.file = path.basename(fname);
    Schema.path = path.dirname(fname);

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

    if (!fs.existsSync(fname))
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

    this.templates = Schema.resolveTemplates(this);

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
            if (Schema.isValidDocument(d)) {
                if (d !== s_file) {
                    d = relative(d);

                    if (!exp_deps_map[d]) {
                        exp_deps_map[d] = true;
                        exp_deps.push(d);
                    }
                }
            }
            else
                Schema.emit("warn", "Skipping invalid schema file '" + relative(d) + "'.");
        });


        function relative(p) {
            return p.substr(s_path.length + 1);
        }
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

    this.init(require(path.resolve(fname)));
    if (this.members.length > 0)
        Schema.documents[doc_name] = this;

    return this;
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


module.exports = Schema;
