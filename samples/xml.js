"use strict";

const fs = require("fs");
const path = require("path");
const xml = require("../xml");

let xstr = fs.readFileSync("samples/object.xml", "utf8");

let TradeToOrderList = {
    _name: "TradeToOrderList",
    _refs: {
        TradeToOrder: {_refs: {}, is_container: true},
        Name: {_refs: {}, is_container: false}
    }
};

xml.toObj(xstr, TradeToOrderList, function (err, obj, doc) {
    if (err)
        return console.error(err);

    console.log(JSON.stringify(obj, null, 4));
});

