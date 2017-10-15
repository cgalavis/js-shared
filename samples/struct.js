"use strict";

const objs = require("./data/gen-objects");
const schema = require("../schema");
const rs = require("restructure");
const fs = require("fs");

const obj = {
    TradeToOrderList: {
        ImmediateExecution: true,
        RenderOrder: false,
        RealtimeSendTime: Date.now(),
        TradeToOrder: [
            {
                OrderID: 1,
                ProgramID: 83,
                InstrumentID: 12560,
                InstrumentMasterID: 250,
                RTSymbolID: 12,
                RealtimeSendTime: Date.now(),
                Resting: false
            },
            {
                OrderID: 2,
                ProgramID: 83,
                InstrumentID: 12560,
                InstrumentMasterID: 250,
                RTSymbolID: 12,
                RealtimeSendTime: Date.now(),
                Resting: false
            }
        ]
    }
};

let tol = schema.struct.getStructType(objs.TradeToOrderList);
let tot_struct = new rs.Struct(tol);

var stream = new rs.EncodeStream();
stream.pipe(fs.createWriteStream('out.bin'));
let tol_bin = tot_struct.encode(stream, obj.TradeToOrderList);
stream.end();

