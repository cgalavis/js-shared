"use strict";

require("./proto").init();
let file = require("./file");
let StringList = require("./StringList");

function CsvReader(file_name, with_header)
{
    if (!file.exists(file_name))
        throw new Error("file {0} does not exist.".format(file_name));

    let that = this;

    this.headers = [];
    this.doc = [];

    this._sl = new StringList();
    this._sl.load(file_name);
    this._sl.forEach(
        function (data, i)
        {
            if (0 == i && with_header)
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

CsvReader.prototype.toString = function ()
{
    return this._sl.toString();
};

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