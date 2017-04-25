"use strict";

let Log = require("../Log");
let expect = require("chai").expect;
let fs = require("fs");
let path = require("path");
let fs_util = require("../fs_util");

const logs_path = "tests/logs";

const output_default_test = " - [I] - Hello World!";
const output_wrap_test =
                  ` - [I] - This test is designed to verify the text-wrap option built into the 
                            logging component. The message is intended to be large enough to require 
                            several lines, the output is then compared against the expected results.`;

describe("Test Log object", function () {
    describe("Test Global Log", function () {
        it("Default Options", function (done) {
            setupGlobalLog({ name: "default_options.log" });
            Log.info("Hello World!", function (err, event) {
                expect(fs.existsSync(Log.global().file_name));
                Log.global().shutdown(function () {
                    let content = fs_util.loadText(Log.global().file_name).trim();
                    expect(content).to.equal(
                        event.timestamp.format(Log.global().timeFormat) +
                        output_default_test
                    );
                    done();
                });
            });
        });

        it("Test with some options", function (done) {
            waitForPreviousTest(Log.global(), function () {
                setupGlobalLog({ name: "wrap-text.log", line_style: "wrap" });
                Log.info("This test is designed to verify the text-wrap " +
                    "option built into the logging component. The message is intended " +
                    "to be large enough to require several lines, the output is then " +
                    "compared against the expected results.",
                    function (err, event) {
                        expect(fs.existsSync(Log.global().file_name));
                        Log.global().shutdown(function () {
                            let content = fs_util.loadText(Log.global().file_name).trim();
                            expect(content).to.equal(
                                event.timestamp.format(Log.global().timeFormat) +
                                output_wrap_test
                            );
                            done();
                        });
                    }
                );
            });
        });
    });
});


/**
 *
 * @param {LogOptions} [options]
 */
function setupGlobalLog(options) {
    if (!options) options = {};

    if (!options.name) options.name = "TestLogFile.log";
    if (!options.path) options.path = logs_path;
    if (!options.header) options.header = [];

    let log_file = path.join(options.path, options.name);
    if (fs.existsSync(log_file))
        fs.unlinkSync(log_file);

    Log.global(options);
}


function waitForPreviousTest(log, cb) {
    if (log.active())
        setImmediate(function () {
            waitForPreviousTest(log, cb);
        });
    else
        cb();
}