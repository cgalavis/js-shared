"use strict";

/**
 * Provides simple but convenient classes and functions to manipulate CSV documents.
 * @module @crabel/shared/csv
 */

require("./proto").init();
let fs = require("fs");
let StringList = require("./StringList");

/**
 * Simple class to load CSV file. The first <tt>row</tt> is used as the header, values of
 * other rows can be access via the column name provided in the header.
 * @param {String} file_name
 * Name of the file to load.
 * @constructor
 */
function CsvReader(file_name)
{
    if (!fs.existsSync(file_name))
        throw new Error("file {0} does not exist.".format(file_name));

    let that = this;

    /**
     * List of column names provided by the header row (the first column)
     * @type {Array}
     */
    this.headers = [];

    /**
     * Array of rows from the loaded CSV document. Each cell can be access by row index
     * and column name, i.e. <tt>sl.doc[0].name</tt>.
     * @type {Array}
     */
    this.doc = [];

    this._sl = new StringList();
    this._sl.load(file_name);
    this._sl.forEach(
        function (data, i)
        {
            if (0 == i)
                setHeaders(data);
            else
            {
                addRow(data);
            }
        }
    );

    function setHeaders(str)
    {
        let h = str.split(",");
        for (let i = 0; i < h.length; ++i)
        {
            let specs = { Name: h[i].trim(), Index: i, MaxWidth: 0 };
            that.headers.push(specs);
        }
    }

    function addRow(str)
    {
        let fields = str.split(",");
        if (0 == fields.length || "" == str.trim())
            return;

        let row = {};
        for (let i = 0; i < Math.min(that.headers.length, fields.length); ++i)
        {
            let field = fields[i].trim();
            if (field.length > that.headers[i].MaxWidth)
                that.headers[i].MaxWidth = field.length;
            row[that.headers[i].Name] = field;
        }

        that.doc.push(row);
    }
}

/**
 * Outputs the content of the CSV document as a string.
 * @returns {String}
 */
CsvReader.prototype.toString = function ()
{
    return this._sl.toString();
};

/**
 * Converts a comma separated string into an array of values. This function applies at
 * the line level, line breaks are consider part of the current value and returned as
 * such. To parse CSV multi-line strings split the string into lines and call this
 * function for each line.
 * @param {String} text
 * CSV string to convert to an array.
 * @param {Function} [trans]
 * An optional function to further process each value.
 * @returns {Array}
 * Array of values from the CSV input text.
 */
function csvToArray(text, trans) {
    if (!trans)
        trans = function (value) { return value; };
    
    let re_valid = /^\s*(?:'[^'\\]*(?:\\[\S\s][^'\\]*)*'|"[^"\\]*(?:\\[\S\s][^"\\]*)*"|[^,'"\s\\]*(?:\s+[^,'"\s\\]+)*)\s*(?:,\s*(?:'[^'\\]*(?:\\[\S\s][^'\\]*)*'|"[^"\\]*(?:\\[\S\s][^"\\]*)*"|[^,'"\s\\]*(?:\s+[^,'"\s\\]+)*)\s*)*$/;
    let re_value = /(?!\s*$)\s*(?:'([^'\\]*(?:\\[\S\s][^'\\]*)*)'|"([^"\\]*(?:\\[\S\s][^"\\]*)*)"|([^,'"\s\\]*(?:\s+[^,'"\s\\]+)*))\s*(?:,|$)/g;
    // Return NULL if input string is not well formed CSV string.
    if (!re_valid.test(text)) return null;
    let a = [];                     // Initialize array to receive values.
    text.replace(re_value, // "Walk" the string using replace with callback.
        function(m0, m1, m2, m3) {
            // Remove backslash from \' in single quoted values.
            if(m1 !== undefined) 
                a.push(trans(m1.replace(/\\'/g, "'")));
            // Remove backslash from \" in double quoted values.
            else if (m2 !== undefined) 
                a.push(trans(m2.replace(/\\"/g, '"')));
            else if (m3 !== undefined) 
                a.push(trans(m3));
            
            return ''; // Return empty string.
        });
    // Handle special case of empty last value.
    if (/,\s*$/.test(text)) a.push(trans(''));
    return a;
}

module.exports = {
    Reader: CsvReader,
    toArray: csvToArray
};
