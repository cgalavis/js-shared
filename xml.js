"use strict";

const xml2js = require("xml2js");
const XMLParser = xml2js.Parser;


/**
 * @typedef {Object} ObjClass
 * @property {Object} _refs
 */

const def_obj_class = {
    _refs: {}
};


/**
 * Converts the given XML string into a Javascript object.
 * @param {String} xml
 * @param {ObjClass|Function} obj_class
 * @param {Function} cb
 */
exports.toObj = function (xml, obj_class, cb) {
    if (typeof obj_class === "function") {
        cb = obj_class;
        obj_class = def_obj_class;
    }

    if (!cb || (typeof cb !== "function"))
        throw new Error("Invalid call to xmlToJson, the callback argument is not " +
            "optional");

    if (typeof obj_class !== "object")
        obj_class = def_obj_class;

    let parser = new XMLParser();

    try {
        parser.parseString(xml, function (err, doc) {
            if (err)
                return cb(err);

            let root;
            if (doc[obj_class._name])
                root = doc[obj_class._name];
            else
                root = doc[Object.keys(doc)[0]];

            try {
                cb(null, parseChild(root, obj_class._refs), doc);
            }
            catch (err) {
                cb(err);
            }
        });
    }
    catch(err) {
        setImmediate(function () { cb(err); });
    }


    //

    function addAttrs(obj, attrs) {
        for (let k in attrs)
            if (attrs.hasOwnProperty(k))
                obj[k] = attrs[k];
    }

    function parseChild(elem, refs) {
        if (typeof elem === "string")
            return elem;

        let res = {};

        for (let k in elem)
            if (elem.hasOwnProperty(k)) {
                if ("$" === k)
                    addAttrs(res, elem[k]);
                else {
                    if (Array.isArray(elem[k]) && elem[k].length > 0)  {
                        if (elem[k].length === 1) {
                            let child = parseChild(elem[k][0],
                                refs[k] ? refs[k]._refs : {});

                            if (refs[k] && refs[k].is_container)
                                res[k] = [ child ];
                            else
                                res[k] = child;
                        }
                        else {
                            if (!res[k])
                                res[k] = [];

                            for (let i=0; i < elem[k].length; ++i)
                                res[k].push(parseChild(elem[k][i],
                                    refs[k] ? refs[k]._refs : {}));
                        }
                    }
                    else {
                        let child = parseChild(elem[k], refs[k] ? refs[k]._refs : {});
                        if (refs[k] && refs[k].is_container)
                            res[k].push(child);
                        else
                            res[k] = child;
                    }
                }
            }

        return res;
    }
};


exports.parse = {
    list: function (p, def) {
        if (def === undefined)
            def = [];

        if (!p || !Array.isArray(p) || p.length === 0)
            return def;

        return p[0];
    },

    string: function (s, def) {
        if (def === undefined)
            def = "<missing>";

        if (s === undefined || s.toString === undefined)
            return def;

        return s.toString();
    },

    number: function (n, def) {
        return isNaN(n) ? def : Number(n);
    },

    bool: function (b) {
        if (typeof b === "boolean")
            return b;

        if (!isNaN(b))
            return Boolean(Number(b));

        return (b === "True") ||
            (b === "true") ||
            (b === "TRUE") ||
            (b === "T") ||
            (b === "t") ||
            (b === "YES") ||
            (b === "Yes") ||
            (b === "yes") ||
            (b === "Y") ||
            (b === "y");
    }
};
