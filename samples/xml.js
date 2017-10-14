"use strict";

const fs = require("fs");
const path = require("path");
const schema = require("../schema/index");

let xstr = fs.readFileSync("samples/object.xml", "utf8");

let TradeToOrderList = {
    _name: "TradeToOrderList",
    _attrs: {
        ImmediateExecution: { type: "Boolean", optional: true },
        RenderOrder: { type: "Boolean", optional: true },
        RealtimeSendTime: { type: "Number", optional: true }
    },
    _refs: {
        TradeToOrder: { _refs: {}, is_container: true },
        Name: { _refs: {}, is_container: false }
    },
};

let obj = schema.xml.toObj(xstr, TradeToOrderList);

console.log(JSON.stringify(obj, null, 4));
console.log();
console.log(schema.xml.fromObj(obj, TradeToOrderList));
