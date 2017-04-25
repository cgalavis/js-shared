"use strict";

let fs = require("fs");
let os = require("os");

require("./proto").init();
let fs_util = require("./fs_util");
let str_util = require("./str_util");

/**
 * The StringList object provides access to a list of strings similar to a document
 * making it convenient for outputting  to log files or reports. The information stored
 * can be referenced as a string, a list, of saved/loaded from files.
 * @param {String} [delimiter=os.EOL]
 * @constructor
 */
function StringList(delimiter) {
    if (undefined === delimiter)
        delimiter = os.EOL;

    this.delimiter = delimiter;
    this.lines = [];
}

/**
 * Return true if the StringList is empty.
 * @returns {Boolean}
 */
StringList.prototype.empty = function () {
    return this.lines.empty();
};

/**
 * Returns the number of lines in the StringList.
 * @returns {Number}
 */
StringList.prototype.count = function () {
    return this.lines.length;
};

/**
 * Returns the line in the given index.
 * @param {Number} index
 * @returns {String}
 */
StringList.prototype.line = function (index) {
    if (0 < index || index >= this.lines.length)
        throw new Error("Index out of bounds");

    return this.lines[index];
};

/**
 * Converts the StringList into a string inserting an end-of-line sequence at the end of
 * every line. By default the os.EOL is used, this can be overwritten by passing a
 * different sequence by parameter.
 * @returns {String}
 */
StringList.prototype.toString = function () {
    if (this.lines.empty())
        return "";

    let res = this.lines.first();

    if (this.lines.length > 1) {
        for (let i = 1; i < this.lines.length; ++i)
            res += this.delimiter + this.lines[i];
    }
    return res;
};


/**
 * Inserts one or more new empty lines to the StringList.
 * @param {Number} [count]
 */
StringList.prototype.newLine = function (count) {
    if (undefined === count)
        count = 1;

    for (let i = 0; i < count; ++i)
        this.lines.push("");
};


/**
 * Writes the given "str" to the StringList, the string is appended to the current line.
 * Additional parameters can be passed, these parameters are used for substitution through
 * the 'format' function of the input string. The StringList is returned to allow method
 * chaining.
 * Usage:
 *      let st = new StringList();
 *      st.writeLine("Current date is: {0}", new Date());
 * @param {String} str
 * @returns {StringList}
 */
StringList.prototype.write = function (str) {
    if (undefined === str)
        throw new Error("Call to 'write' with missing argument.");

    let val;
    if (1 == arguments.length)
        val = str;
    else {
        let args = Array.prototype.slice.call(arguments);
        val = str_util.format.apply(str, args.slice(1, args.length));
    }

    if (this.lines.empty())
        this.lines.push(val);
    else {
        let i = this.lines.length - 1;
        this.lines[i] += val;
    }
    return this;
};


/**
 * Adds the given line to the StringList followed by an end-of-line. The StringList is
 * returned to allow method chaining.
 * @param {String} line
 * @returns {StringList}
 */
StringList.prototype.writeLine = function (line) {
    if (undefined === line)
        throw new Error("Call to 'writeLine' with missing argument, use 'newLine' to add an empty line.");

    this.write.apply(this, arguments);
    this.newLine();
    return this;
};


/**
 * Iterates through the StringList lines calling the callback on each iteration, the
 * callback receives the current line and its index.
 *      Callback Signature: function (line, index)
 * @param {Function} callback
 */
StringList.prototype.forEach = function (callback) {
    if (undefined === callback || "function" != typeof (callback))
        throw new Error("Invalid call to 'forEach', the callback function was not " +
            "passed or was not a function.");

    for (let i = 0; i < this.lines.length; ++i)
        callback.call(this, this.lines[i], i, this);
};


/**
 * Adds the content of other StringLists to this one. Multiple lists can be added in the
 * same call. Returns the StringList to allow method chaining.
 * @returns {StringList}
 */
StringList.prototype.merge = function () {
    for (let i = 0; i < arguments.length; ++i)
        if (undefined !== arguments[i].lines)
            this.lines.push.apply(this.lines, arguments[i].lines);

    return this;
};


/**
 * Deletes a single line from the StringList
 * @param {Number} index
 * @param {Number} count
 * @returns {String[]}
 */ StringList.prototype.remove = function (index, count)
{
    if (undefined === count)
        return this.lines.splice(index, 1);

    return this.lines.splice(index, count);
};


/**
 * Removes all content from the Stringlist. Returns the StringList to allow method
 * chaining.
 * @returns {StringList}
 */
StringList.prototype.clear = function () {
    this.lines.length = 0;
    return this;
};


/**
 * Stores the content of the Stringlist into the given file. The path to the file is
 * created if needed. Returns the StringList to allow method chaining.
 * @param {String} fname
 * @param {Boolean} safe
 * @returns {StringList}
 */
StringList.prototype.save = function (fname, safe) {
    fs_util.ensurePath(path.getParent(fname));
    fs_util.saveText(fname, this.toString(), safe);
    return this;
};


/**
 * Load the given file and add it's content to the StringList. This method completely
 * replaces the content of the StringList. Returns the StringList object to allow method
 * chaining.
 * @param {String} fname
 * @returns {StringList}
 */
StringList.prototype.load = function (fname) {
    if (!fs.exists(fname))

        throw new Error(str_util.format("Failed to load content for StringList, the " +
            "file '{0} does not exist.'", fname));

    // Process Windows formatted lines
    let content = fs_util.loadText(fname).split("\r\n");
    
    this.clear();
    for (let i = 0; i < content.length; ++i) {
        // Process Unix formatted lines
        let sub_content = content[i].split("\n");
        for (let j = 0; j < sub_content.length; ++j)
            this.lines.push(sub_content[j]);
    }
    return  this;
};

module.exports = StringList;