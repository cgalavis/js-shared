"use strict";

let Log = require("../Log");
let expect = require("chai").expect;
let fs = require("fs");
let file = require("../file");


describe("Test Log object", function () {
    describe("Test Global Log", function () {
        it("Default Options", function (done) {
            Log.info("Hello World!", function () {
                expect(fs.existsSync(Log.global().file_name));
                done();
            });
        });
    });
});


function resetLog(log) {
    if (fs.exists(log.file_name))
        file.erase(log.file_name);
}
