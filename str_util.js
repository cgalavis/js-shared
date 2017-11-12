"use strict";

/**
 * This module is part of the Crabel core library, it contains utility functions that
 * extend the standard <b>String</b> interface adding support for string transformation
 * and formatting including token replacement, text layout construction and more.
 * Formatting function (format and expand) provide token substitution services using the
 * familiar handlebars notation i.e. {{ token }}.
 * @module @crabel/shared/str_util
 * @author: Carlos Galavis <cgalavis@crabel.com>
 */

require("./proto").init();
const os = require("os");
const xnv = require("xml-name-validator");
const columnify = require("columnify");


/**
 * @typedef {Object} Token
 * @property {String} name
 * @property {String[]} args
 */


/**
 * Callback function given to the 'expand' function to evaluate and determine value to be
 * used for substitution.
 * @callback SubstCallback
 * @param {Token} token Object representing the token. The object has a 'name' and 'args'
 * properties.
 * @param {...any} [arg] Additional arguments passed to the expand function.
 * @return {String|null} Value returned by the substitution callback function or null if
 * no substitution was
 * possible.
 */


/**
 * Callback function given to the 'str_util.substProp' function to format a given
 * property value.
 * @callback FormatterCallback
 * @param {Object} obj Object container object from which a value is used for
 * substitution.
 * @param {String} prop_name Name of the property of 'obj' whose value is being fetch for
 * substitution.
 * @return {String} Formatted value of obj[prop_name].
 */


/**
 * Callback function given to the 'toObject' function to customize the conversion of JSON
 * values to object property values.
 * @callback ReviverCallback
 * @param {String} key Key being assigned to the resulting object instance.
 * @param {String} value Value being assigned to the 'key' property.
 * @return {*} Value processed by the ReviverCallback function. This value is assigned
 * to the 'key' property in place
 * of the 'value' string that was in the JSON document.
 */


/**
 * @typedef {Object} TableColumn
 * @property {Number|String} width
 * @property {String} align
 */


/**
 * @typedef {Object} TableSpecs
 * @property {Array.<TableColumn>} columns
 * @property {Array.<Array.<String>>} rows
 */


//

module.exports = {
    /**
     * Returns a string of given width filled with the given character.
     * @param {Number} width number of characters to add to the strin returned.
     * @param {String} [fill_char] the character to use when generaring the string.
     * @return {string} String containing the repeated sequence
     */
    fill: function (width, fill_char) {
        if (isNaN(width))
            throw new Error("Invalid call to 'str_util.fill', the 'width' parameter " +
                "is not optional.");

        if (0 >= width)
            return "";

        fill_char = _normStr(fill_char, "str_util.fill", " ", 1);
        return (new Array(width + 1)).join(fill_char);
    },


    /**
     * Capitalizes the first letter of every word in the given <tt>str</tt>.
     * @param {String} str
     * String to be capitalized.
     * @returns {String}
     * Returns a string with the first letter of every word capitalized.
     */
    capitalize: function (str) {
        if (!str || !str.toString)
            throw new Error("Invalid call to 'str_util.capitalize', an invalid " +
                "parameter was passed.");

        return str.replace(/(?:^|\s)\S/g, function (a) {
            return a.toUpperCase();
        });
    },


    /**
     * Replaces tokens of the form {N} where N indicates the index of the value to use
     * for replacement. Replacement values are passed as parameters to the function.
     * @param {String} str
     * String to be formatted. All the known tokens present in 'str' are replaced with
     * the values given by the rest of the function arguments.
     * @param {*} [subs...]
     * Values to be used during substitution.
     * @return {String}
     * Returns the formatted string.
     * @example
     *  <caption>Converts text="Name: {{0}}, Last: {{1}}, Age: {{2}}" into
     *  formatted_text="Name: John, Last: Doe, Age: 43"</caption>
     *      let date_util = require("twt/date_util");
     *      let person = { Name: "John", Last: "Doe", Age: 43 };
     *      let text = "Name: {{0}}, Last: {{1}}, Age: {{2}}";
     *      let formatted_text = str_util.format(text, person.Name, person.Last person.Age);
     */
    format: function (str, subs /*, [subs2, ...]*/) {
        if (0 === arguments.length)
            throw new Error("Invalid call to 'str_util.format', no string was supplied");

        if (!str.toString)
            throw new Error("Invalid call to 'str_util.format', the 'str' parameter " +
                "must be a 'String' or support the 'toString' method.");


        str = str.toString();       // Make sure we have a string to work with
        if (1 === arguments.length)
            return str;

        let args = Array.prototype.slice.call(arguments).slice(1, arguments.length);
        if ("function" === typeof arguments[1])
            throw new Error("Invalid call to 'str_util.format', the first substitution " +
                "value is a function. Use 'expand' to use a substitution function.");

        return str.replace(/{{([^}}]+)}}/g, function (match, token) {
            let number = Number(token.trim());
            if (isNaN(number))
                return match;

            if (number < args.length)
                return args[number];

            return match;
        });
    },


    /**
     * Returns an <b>Error</b> object with the text <b>str</b> expanded via the
     * <b>format</b> function.
     * @param {String} str
     * String to be formatted. All the known tokens present in 'str' are replaced with
     * the values given by the rest of the function arguments.
     * @param {*} [subs...]
     * Values to be used during substitution.
     * @return {Error}
     */
    formatError: function (str, subs /*, [subs2, ...]*/) {
        return new Error(this.format.call(this, arguments));
    },


    /**
     * Expands substitutable tokens (text surrounded by handlebars) by invoking the
     * callback function. Parameters can be given along within the substitution token to
     * customize the behaviour of the substitution function, these parameters are
     * separated by a comma and can be enclosed within double quotes, for instance the
     * token {{ date, "yyyy/MM/dd" }} could be used to tell the substitution function to
     * format that date using the given date formatting string. If the callback function
     * returns 'null', the token is left alone.<br><br>
     *
     * Additional parameters can be passed after 'subst_fn', these parameters are passed
     * through to the callback function every time it is invoked.
     *
     * @param {String} str
     * String to be expanded. Tokens found in this string are given to the callback
     * function for substitution.
     * @param {SubstCallback} [subst_fn]
     * Substitution callback function.
     * @param {*} [arg...]
     * Arguments to be passed on to the callback function.
     * @return {String}
     * Returns the expanded string.
     * @example
     *  <caption>Converts text="date: yyyy/MM/dd" into expanded_text =
     *  "date: 2016/02/07"</caption>
     *   require(twt/proto);
     *   let date_util = require("twt/date_util");
     *   let text = "Current date: {{date, yyyy/MM/dd}}";
     *   let expanded_text = str_util.expand(text, function (token, date) {
     *      if ("date" === token.Name) {
     *          if (undefined !== token.Args[0] && Object.isType(String))
     *              return date_util.format(date, token.Args[0]);
     *          return date.toString(); // no formatting string was given, use default
     *      }
     *
     *      return null; // token not supported
     *  }, new Date());
     */
    expand: function (str, subst_fn, arg /*[arg2, ...]*/) {
        let args = Array.prototype.slice.call(arguments).slice(2, arguments.length);
        return str.replace(/{{([^}}]+)}}/g, function (match, token) {
            token = token.trim();
            if (0 === token.length)
                return match;

            if (!subst_fn)
                return match;

            let tkparts = token.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || [];
            if (!tkparts.empty()) {
                tkparts.forEach(function (val, i, args) {
                    args[i] = val.trim();
                });

                let tkname, tkalign, tkargs;
                tkname = tkparts[0];
                tkargs = tkparts.slice(1, tkparts.length);
                tkalign = "left";
                if ("-" === tkname.charAt(0)) {
                    tkname = tkname.substr(1);
                    if ("-" === tkname.slice(-1)) {
                        tkalign = "center";
                        tkname = tkname.substr(0, tkname.length - 1);
                    }
                    else
                        tkalign = "right";
                }

                let tk = {
                    name: tkname,
                    align: tkalign,
                    args: tkargs
                };

                let local_args = args.slice();
                local_args.unshift(tk);

                let subs = subst_fn.apply(str, local_args);
                if (undefined !== subs && null !== subs && subs.toString)
                    return subs.toString();
            }
            return match;
        });
    },


    /**
     * For internal use only, use one of the specialized methods 'alignL', alignR' and
     * 'alignC'.<br> Pads the given string (str) to fit in the given 'width'. Padding is
     * added to the beginning, the end or both depending on the value of the 'alignment'
     * attribute, possible values are: <b>"left"</b>, <b>"right"</b> and <b>"center"</b>.
     * The padding character can be defined through the 'fill_char' argument, if the
     * argument is omitted, an space character (" ") is used. If the given string is
     * longer than the given width, no padding is added and the original string is
     * returned back to the caller.
     * @param {String} str
     * The string (or string serializable object) to be aligned.
     * @param {Number} width
     * The number of characters the resulting string should have.
     * @param {String} [alignment="left"]
     * Indicates whether the string should be aligned to the right, left or center.
     * @param {String} [fill_char]
     * Character to be appended or prepended to the given string.
     * @returns {String}
     * Returns the padded string.
     */
    align: function (str, width, alignment, fill_char) {
        str = _normStr(str, "str_util.align");
        if (!width || isNaN(width) || 0 >= width)
            return str;

        width = Number(width);  // Make sure we are working with a number
        fill_char = _normStr(fill_char, "str_util.align", " ", 1);

        if (!alignment) alignment = "left";
        switch (alignment) {
            case "left":
                if (width <= str.length)
                    return str;

                return str + new Array(width - str.length + 1).join(fill_char);
            case "center":
                // Using space if fill_char is not given or if it is an empty string

                if (width <= str.length)
                    return str;

                let padd = new Array(
                    Math.floor((width - str.length) / 2) + 1).join(fill_char);
                let res = padd + str + padd;

                // Remainder added to the end
                if (res.length < width)
                    res += fill_char;
                return res;
            case "right":
                if (width <= str.length)
                    return str;

                return new Array(width - str.length + 1).join(fill_char) + str;
            default:
                throw new Error("Invalid call to 'str_util.align', the alignment " +
                    "method is not supported.");
        }
    },


    /**
     * Pads the given string (str) to fit in the given 'width'. Padding is added to the
     * beginning and end of the string such that 'str' is centered within the given
     * number of characters. The padding character can be defined through the
     * <b>fill_char</b> argument, if the argument is omitted, the space character (" ")
     * is used. If the given string is longer than the given width, no padding is added
     * and the original * string is returned back to the caller.
     * @param {String} str
     * The string (or string serializable object) to be aligned.
     * @param {Number} width
     * The number of characters the resulting string should have.
     * @param {String} [fill_char]
     * Character to be appended or prepended to the given string.
     * @returns {String}
     * Returns the padded string.
     */
    alignC: function (str, width, fill_char) {
        return this.align(str, width, "center", fill_char);
    },


    /**
     * Pads the given string (str) to fit in the given 'width'. Padding is added to the
     * end of the string. The padding character can be defined through the
     * <b>fill_char</b> argument, if the argument is omitted, the space character (" ")
     * is used. If the given string is longer than the given width, no padding is added
     * and the original string is returned back to the caller.
     * @param {String} str
     * The string (or string serializable object) to be aligned.
     * @param {Number} width
     * The number of characters the resulting string should have.
     * @param {String} [fill_char]
     * Character to be appended or prepended to the given string.
     * @returns {String}
     * Returns the padded string.
     */
    alignL: function (str, width, fill_char) {
        return this.align(str, width, "left", fill_char);
    },


    /**
     * Pads the given string (str) to fit in the given 'width'. Padding is added to the
     * beginning of the string. The padding character can be defined through the
     * <b>fill_char</b> argument, if the argument is omitted, the space character (" ")
     * is used. If the given string is longer than the given width, no padding is added
     * and the original string is returned back to the caller.
     * @param {String} str
     * The string (or string serializable object) to be aligned.
     * @param {Number} width
     * The number of characters the resulting string should have.
     * @param {String} [fill_char]
     * Character to be appended or prepended to the given string.
     * @returns {String}
     * Returns the padded string.
     */
    alignR: function (str, width, fill_char) {
        return this.align(str, width, "right", fill_char);
    },


    /**
     * Indent each line of the given string by the number of spaces.
     * @param {String} str
     * @param {Number} spaces
     * @return {String}
     */
    indent: function (str, spaces) {
        if (isNaN(spaces))
            spaces = str.search(/\S|$/) || 0;

        let indent = this.fill(spaces);
        let lines = this.splitLines(str.trim());
        let res = "";
        lines.forEach(function (line) {
            if (res)
                res += "\n";
            res += indent + line;
        });

        return res;
    },


    /**
     * Splits the given string into an array of strings with each line becoming an
     * element in the array. This function handles Linux as well Windows style EOL
     * characters.
     * @param {String} text
     * @returns {Array.<String>}
     */
    splitLines: function (text) {
        let res = [];
        let lines = text.split("\r\n");

        for (let i = 0; i < lines.length; ++i) {
            // Process Unix formatted lines
            let sub_lines = lines[i].split("\n");
            for (let j = 0; j < sub_lines.length; ++j)
                res.push(sub_lines[j]);
        }

        return res;
    },


    /**
     * Combines the given array of strings into a multi-line string.
     * @param {Array.<String>|String} lines
     * @param {String} [eol=os.EOL]
     */
    combineLines: function (lines, eol = os.EOL) {
        if (Array.isArray(lines))
            return lines.join(eol);

        return lines;
    },


    /**
     * Creates and object by de-serializing the string. The string must contain a valid
     * JSON document or an error will be thrown by the "eval" function. To use the JSON
     * safe parser, pass a parameter of "null" in "reviver", or  valid reviver function.
     * @param {String} doc
     * JSON document to be parsed and converted to an object.
     * @param {ReviverCallback} reviver
     * Callback function use to customize value conversion when parsing the json document.
     * @returns {Object}
     * Returns an 'Object' that contains all the properties of the JSON document.
     */
    toObject: function (doc, reviver) {
        if (undefined === reviver)
            return eval('(' + doc.toString() + ')');

        return JSON.parse(doc.toString(), reviver);
    },


    /**
     * Generates a CRC32 checksum for the given string.
     * @param {String} str
     * The string (or string serializable object) to use for crc32 checksum generation.
     */
    crc32: function (str) {
        if (!str)
            throw new Error("Invalid call to 'str_util.crc32', the str parameter is " +
                "not optional.");

        if (!str.toString)
            throw new Error("Invalid call to 'str_util.align', the 'str' parameter " +
                "must be a 'String' or support the 'toString' method.");
        str = str.toString();       // Make sure we have a string to work with

        let crc_table = makeCRCTable();
        let crc = 0 ^ (-1);

        for (let i = 0; i < str.length; i++)
            crc = (crc >>> 8) ^ crc_table[(crc ^ str.charCodeAt(i)) & 0xFF];

        return (crc ^ (-1)) >>> 0;

        function makeCRCTable() {
            let c;
            let crc_table = [];
            for (let n = 0; n < 256; n++) {
                c = n;
                for (let k = 0; k < 8; k++)
                    c = ((c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1));
                crc_table[n] = c;
            }
            return crc_table;
        }
    },


    /**
     * Substitutes date/time tokens with the given date/time with optional formatting,
     * e.g. {{date[, frmStr: String}}.
     * @param {string} str
     * String where token substitution is to be applied.
     * @param {Date} [date]
     * Optional date to be used for substitution, if not provided, the current
     * date/time is used.
     * @param {Number} [width]
     * Width used for alignment
     * @returns {String}
     */
    substDate: function (str, date, width) {
        if (undefined === str)
            throw new Error("Invalid call to 'str_util.subst.date', the 'str' " +
                "argument is not optional.");

        return module.exports.expand(str, function (token, dt) {
            if ("date" === token.name) {
                if (Object.isType(token.args[0], String))
                    return module.exports.align(dt.format(token.args[0]), width,
                        token.align);

                return module.exports.align(dt, width, token.align);
            }
        }, date || new Date());
    },


    /**
     * Substitutes the a token with an object property. Properties of child objects
     * can be specified as tokens using dot notation, e.g. "{{process.path}}".
     * @param {string} str
     * String where token substitution is to be applied.
     * @param {Object} obj
     * Object where properties are to be used for substitution.
     * @param {Number} [width]
     * Width used for alignment
     * @param {FormatterCallback} [cb]
     * @return {String}
     */
    substProp: function (str, obj, width, cb) {
        if (!obj || undefined === obj)
            throw new Error("Invalid call to 'str_util.subst.prop', the 'obj' and " +
                "'obj' arguments are not optional");

        if (Object.isType(width, Function)) {
            cb = width;
            width = undefined;
        }

        return module.exports.expand(str, function (token, obj) {
            let val = getPropValue(obj, token.name.split("."), token.args, cb);
            if (undefined !== val && null !== val)
                return module.exports.align(val, width, token.align);
        }, obj);

        function getPropValue(obj, props, args, cb) {
            let prop_name = props.shift();
            if (0 === props.length) {
                if (cb) {
                    let val = cb(obj, prop_name);
                    if (undefined !== val && null !== val)
                        return valueToStr(val, args);
                }
                return valueToStr(obj[prop_name], args);
            }

            if (undefined !== obj[prop_name] && null !== obj[prop_name])
                if (Object.isType(obj[prop_name], Object))
                    return getPropValue(obj[prop_name], props, args, cb);
        }

        function valueToStr(val, args) {
            if (Object.isPrimitive(val))
                return val.toString();

            if (Object.isType(val, Date)) {
                if (Object.isType(args[0], String))
                    return val.format(args[0]);

                return val.toString();
            }

            if (Object.isType(val, Object)) {
                if (val.toString)
                    return val.toString();
                return val.toJSONEx();
            }

            return null;
        }
    },


    /**
     * Expands environment variables in the given string. substitution tokens are of the form
     * $(ENV_NAME)
     * @param {string} str
     * String to be expanded.
     * @return {string}
     * Expanded string.
     */
    substEnv: function (str) {
        return str.replace(/\$\(([^%]+)\)/g,
            function (_, env_var) {
                return process.env[env_var.trim()];
            }
        );
    },


    /**
     * Creates a table with the given data, specifications and width. The <b>table_data</b>
     * contains columns specifications through the <b>columns</b> property, and data through
     * the <b>rows</b> property and rows of data
     * @param {*} table_data
     * @param {Number} width
     * @returns {string}
     */
    buildTable: function (table_data, width) {
        if (Object.isPrimitive(table_data))
            table_data = {rows: [table_data.toString()]};

        if (Object.isType(table_data, Array)) {
            let res = "";
            table_data.forEach(function (val) {
                res += this.buildTable(val, width) + os.EOL;
            });

            return res;
        }

        if (!Object.isType(table_data.columns, Array))
            if (table_data.columns && 0 === table_data.columns.length)
                delete table_data.columns;

        if (!table_data.columns)
            table_data.columns = [{width: "auto", align: "left"}];

        if (!table_data.rows || !Object.isType(table_data.columns, Array))
            throw new Error("Invalid call to 'buildTable', the table data is not valid, " +
                "either the 'columns' or 'rows' collection is missing or invalid.");


        // Need to adjust width down since Columnify adds a character between columns.
        let unadj_width = width;
        width -= table_data.columns.length - 1;

        let col_width = calcColumnWidth(table_data.columns, table_data.rows);
        let specs = {};
        specs.showHeaders = false;
        specs.config = [];
        col_width.forEach(function (col) {
            specs.config.push({
                minWidth: col.width,
                maxWidth: col.width
            });
        });

        let tables = [];
        let table = [];
        table_data.rows.forEach(function (row) {
            if (Object.isType(row, String)) {
                if (!table.empty()) {
                    tables.push(table);
                    table = [];
                }
                tables.push(row);
            }
            else
                table.push(row);
        });

        // Add last table table if it was not empty
        if (!table.empty())
            tables.push(table);

        let res = "";
        let config = buildConfig(col_width);
        tables.forEach(function (t) {
            if (Object.isType(t, String)) {
                if ("=" === t)
                    res += module.exports.fill(unadj_width, "=") + os.EOL;
                else {
                    let align = "left";
                    if ("-" === t.charAt(0)) {
                        t = t.substr(1);
                        if ("-" === t.slice(-1)) {
                            align = "center";
                            t = t.substr(0, t.length - 1);
                        }
                        else
                            align = "right";
                    }

                    res += columnify([[t.toString()]], {
                            showHeaders: false,
                            config: [{
                                minWidth: unadj_width,
                                maxWidth: unadj_width,
                                align: align
                            }]
                        }) + os.EOL;
                }
            }
            else
                res += columnify(t, config) + os.EOL;
        });
        return res;

        function buildConfig(columns) {
            let res = {
                showHeaders: false,
                config: []
            };

            columns.forEach(function (col) {
                res.config.push({
                    minWidth: col.width,
                    maxWidth: col.width,
                    align: col.align
                });
            });
            return res;
        }

        function calcColumnWidth(columns, rows) {
            if (!columns) {
                columns = [{width: "auto"}];
            }

            let res = [];
            columns.forEach(function (col, i) {
                res[i] = {};
                res[i].maxWidth = 0;
            });

            rows.forEach(function (row) {
                if (Object.isType(row, Array)) {
                    row.forEach(function (cell, i) {
                        if (i < res.length) {
                            res[i].maxWidth =
                                Math.max(res[i].maxWidth, cell.toString().length);
                            if (Object.isType(columns[i].maxWidth, Number))
                                res[i].maxWidth =
                                    Math.min(res[i].maxWidth, columns[i].maxWidth);
                        }
                    });
                }
            });

            let fit_col = -1;
            let non_fit_width = 0;
            let fixed_width = 0;
            let auto_width_count = 0;
            columns.forEach(function (col, i) {
                if ("fit" === col.width && -1 === fit_col)
                    fit_col = i;
                else {
                    if (!isNaN(col.width)) {
                        res[i].width = Number(col.width);
                        fixed_width += res[i].width;
                    }
                    else {
                        res[i].width = res[i].maxWidth;
                        auto_width_count++;
                    }
                    non_fit_width += res[i].width;
                }
                res[i].align = col.align;
            });

            if (0 <= fit_col) {
                let fit_width = res[fit_col].maxWidth;

                if ((non_fit_width + fit_width / 2) <= width)
                    res[fit_col].width = width - non_fit_width;
                else {
                    non_fit_width += res[fit_col].maxWidth;
                    res[fit_col].width = res[fit_col].maxWidth;
                }
            }

            if (non_fit_width > width) {
                let ratio = width / non_fit_width + fit_width;
                res.forEach(function (r) {
                    r.width = Math.trunc(r.width * ratio);
                });
            }
            else if (0 > fit_col && 0 < auto_width_count) {
                let auto_width = Math.trunc((width - fixed_width) / auto_width_count);
                let rem = width - fixed_width - (auto_width * auto_width_count);
                let last;
                if (0 < auto_width) {
                    res.forEach(function (val, i, arr) {
                        if ("auto" === columns[i].width) {
                            arr[i].width = auto_width;
                            last = arr[i];
                        }
                    });
                    if (last && rem)
                        last.width += rem;
                }
            }


            return res;
        }
    },

    is_valid: {
        varName: function (str) {
            return xnv.qname(str) && !str.includes(":");
        }
    }
};
//


/**
 * For internal use only. This method normalizes the given 'str'. If necessary the string
 * is truncated to 'len' number of characters. 'def_value' is returned if 'str' is empty
 * or null. The method throws if 'str' can't be converted to a string or if it is shorter
 * than the required number of characters 'len'.
 * @private
 * @param {String} str The string to be processed
 * @param {String} caller Name of the function that called '_normStr'. Used in
 * exception messages.
 * @param {String} [def_value] The value to be used if 'str' is empty, null or not
 * defined.
 * @param {Number} [len] If provided, '_normStr' truncates the resulting string to
 * 'len' number of
 * @returns {String} Returns the processed string.
 */
function _normStr(str, caller, def_value, len) {
    if (str && !str.toString)
        throw new Error("Invalid call to '" + caller + "', the 'str' argument must be " +
            "a string or support the 'toString' method.");

    if (!str) {
        if (!def_value)
            throw new Error("Invalid call to '" + caller + "', the 'str' argument is " +
                "not optional.");
        return def_value;
    }

    str = str.toString();   // Make sure we are working with a string
    if (0 == str.length) {
        if (!len)
            return str;

        if (def_value)
            return def_value;
    }

    if (len) {
        if (len > str.length)
            throw new Error("Invalid call to '" + caller + "', the 'str' parameter " +
                "does not meet the length requirement.");

        return str.substring(0, len);
    }

    return str;
}

