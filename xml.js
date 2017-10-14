"use strict";

const escape = require("xml-escape");

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
