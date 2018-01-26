"use strict";

const fs = require("fs");
const path = require("path");
const fs_util = require("./fs_util");
const FieldChecker = require("./FieldChecker");

class Config {
    constructor(app_name, field_specs) {
        if (!app_name || !field_specs)
            throw new Error("Failed to create 'Config', the application name and " +
                "field specs are not optional.");

        this.app_name = app_name;
        this.field_specs = field_specs;
        this.data = {};

        this.defaults = {};
        this.field_specs.forEach(f => {
            if (f.default)
                this.defaults[f.name] = f.default;
        });
    }

    init(data, opts) {
        if (!opts) opts = {};
        if (!data) data = {};

        data.merge(this.defaults, false, true);
        data.merge(opts, true, true);
        FieldChecker.validate(this.field_specs, data);

        this.data = data;
    }

    load(fname, opts) {
        if ("object" === typeof fname) {
            opts = fname;
            fname = undefined;
        }

        if (!fname)
            fname = path.join(fs_util.common_dirs.home, "crabel", this.app_name + ".config");

        this.data = {};
        if (fs.exists(fname))
            this.init(eval("(" + fs.readFileSync(fname, "utf8") + ")"));
        else
            this.init({}, opts);
    }



    // Test Functions

    static __test() {
        let opts = { target: "some file" };
        let field_specs = [
            { name: "target", type: String, required: true },
            {
                name: "known_msgs", type: Array, required: true,
                default: [ "8", "9", "0", "1", "A", "5", "3" ]
            },
            {
                name: "known_tags", type: Array, required: true, default: [
                    1, 6, 8, 9, 10, 11, 14, 17, 34, 35, 37, 38, 39, 40, 41, 44, 48,
                    49, 50, 52, 54, 55, 56, 57, 59, 60, 107, 143, 150, 151, 167,
                    369, 432, 1028
                ]
            },
            {
                name: "custom_fix_tags", type: Array,
                field_specs: [
                    { name: "Tag", type: Number, required: true },
                    { name: "Name", type: String, required: true },
                    { name: "Type", type: String },
                    { name: "Description", type: String }
                ]
            },
        ];

        let cfg = new Config("TestApp", field_specs);
        cfg.init({
            custom_fix_tags: [
                {
                    "Tag": "20",
                    "Name": "ExecTransType",
                    "Type": "char",
                    "Description": "Identifies transaction type. No longer used as of FIX 4.3. Included here for reference to prior versions."
                },
                {
                    "Tag": "1603",
                    "Name": "ApplicationSystemName",
                    "Description": "Provides the name of the application system being used to generate FIX application messages. This will normally be a trading system, OMS, or EMS. This tag is required on the Logon (tag 35-MsgType=A) message header only."
                },
                {
                    "Tag": "1604",
                    "Name": "ApplicationSystemVersion",
                    "Description": "Provides the version of the application system being used to initiate FIX application messages. This tag is required on the Logon (tag 35-MsgType=A) message header only."
                },
                {
                    "Tag": "37711",
                    "Name": "CME-MDTradeEntryID",
                    "Description": "A common identifier tag 37711-MDTradeEntryID associates order routing, market data, and Clearing messages for a given trade."
                },
                {
                    "Tag": "1605",
                    "Name": "ApplicationSystemVendor",
                    "Description": "Provides the vendor of the application system. This tag is required on the Logon (tag 35-MsgType=A) message header only."
                },
                {
                    "Tag": "5979",
                    "Name": "CME-RequestTime",
                    "Description": "Information carried on a response to convey the time (UTC) when the request was received by the MSGW application.UTC timestamps are sent in number of nanoseconds since UNIX epoch with microsecond precision."
                },
                {
                    "Tag": "7928",
                    "Name": "CME-SelfMatchPreventionID",
                    "Description": "Customers who opt to leverage Self-Match Prevention functionality by registering via the Firm Admin Dashboard will submit tag 7928-SelfMatchPreventionID on each quote and order message to prevent trading against an opposite side order with the same SMP ID."
                },
                {
                    "Tag": "9717",
                    "Name": "CME-CorrelationClOrdID",
                    "Description": "This tag contain the same value as tag 11-ClOrdID for use in correlating all iLink messages associated with the order chain originating with this New Order message."
                }
            ]
        }, opts);
    }
}



//

module.exports = Config;