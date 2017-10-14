"use strict";

let schema = require("../schema");

let s = new schema.Schema("samples/Schema.xml");

s.on("done", function () {
    let cat = {};
    s.objects.forEach(function (o) {
        o.attrs.forEach(function (a) {
            let nt = s.getNativeType(a);
            if (nt !== a.type)
                cat[a.type] = nt;
        });
    });
    for (let k in cat) {
        console.log(k + "=" + cat[k]);
    }
});

