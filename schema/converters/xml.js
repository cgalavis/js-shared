"use strict";

const parseString = require("xml2js").parseString;
const escape = require("xml-escape");
//
const str_util = require("../../str_util");
const def_class = require("../common").def_class;

/** @type {Converter} */
module.exports = {

    /**
     * Converts the given XML string into a Javascript object.
     * NOTE : The 'xml2js' library is not asynchronous despite of the pretences with the
     * callback argument. Here we make this explicit by converting to a traditional
     * synchronous call.
     * @param {String} xml
     * @param {ObjClass} [obj_class]
     * @returns {Object}
     */
    toObj: function (xml, obj_class) {
        if (!obj_class || typeof obj_class !== "object")
            obj_class = def_class;

        let res;

        // IMPORTANT : 'parseString' is not asynchronous
        parseString(xml, function (err, doc) {
            if (err)
                throw err;

            let root_name = Object.keys(doc)[0];
            if (!obj_class._name)
                obj_class._name = root_name;

            if (root_name !== obj_class._name)
                throw new Error("Failed to convert XML document to an object, the " +
                    "object class '" + obj_class._name + "' is not for object '" +
                    root_name + "'.");

            res = parseChild(doc, obj_class._refs);
        });

        if (!res)
            throw new Error("'parseString' was not called, did 'xml2js' become async?");

        return res;


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
    },


    /**
     * Converts the given object into XML consistent with Crabel IPC.
     * @param {Object} obj
     * @param {ObjClass} [obj_class]
     * @returns {string}
     */
    fromObj: function (obj, obj_class) {
        let root_name = obj_class._name || Object.keys(obj)[0];

        return parseChild(0, root_name, obj[root_name], obj_class);


        //

        function parseChild(indent, name, obj, obj_class) {
            if (Array.isArray(obj)) {
                let res = "";
                obj.forEach(function (child) {
                    res += parseChild(indent, name, child, obj_class);
                });

                return res;
            }

            let indent_str = "";
            if (indent)
                indent_str = str_util.fill(indent * 4, " ");

            if (typeof obj === "string")
                return indent_str + "<" + name + ">" + obj + "</" + name + ">\n";

            if (!obj_class)
                obj_class = def_class;

            let res = indent_str + "<" + name;
            let children = "";

            for (let k in obj)
                if (obj.hasOwnProperty(k)) {
                    if (obj_class._refs[k] || typeof obj[k] === "object")
                        children += parseChild(indent + 1, k, obj[k], obj_class._refs[k]);
                    else
                        res += " " + k + "=\"" + escape(obj[k]) + "\"";
                }

            if (children.length === 0)
                return res + "/>\n";

            return res + ">\n" + children + indent_str + "</" + name + ">\n";
        }
    }

};

