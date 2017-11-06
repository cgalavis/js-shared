"use strict";

const Schema = require("../schema").Schema;
const colors = require("colors");
const str_util = require("../str_util");

Schema.load("data/MessageSchema.xml", function (err, doc) {
    console.log(JSON.stringify(doc, null, 4));
});

