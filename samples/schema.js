"use strict";

const Schema = require("../schema/Schema");
const colors = require("colors");
const str_util = require("../str_util");

Schema.load("data/schema/schema.json");

console.log();

for (let sd in Schema.documents) {
    let sc = Schema.documents[sd];

    console.log(sd.bold);
    console.log(title("dependencies"));
    sc.dependencies.forEach(function (d) {
        console.log("        " + d.magenta);
    });

    console.log(title("members"));
    for (let sm in sc.member_map) {
        console.log("        " + sm.blue.bold);

        let doc = sc.member_map[sm];
        if (doc.doc)
            console.log(str_util.indent("        " + doc.doc.grey));
    }
}

console.log();



function title(t) {
    return "    [" + t.underline + "]";
}