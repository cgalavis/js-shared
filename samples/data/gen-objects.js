"use strict";

/** @type {Restructure} */
const rs = require("restructure");
const schema = require("../../schema");

/**
 * Sent by the Trading Platform to the Trade Engine when submitting new Orders.
 * @param init_data
 * @returns {TradeToOrder}
 * @constructor
 */
let TradeToOrder = function (init_data) {
    if (!this)
        return new TradeToOrder(init_data);

    let self = this;

    if (!init_data)
        init_data = {};

    // Attributes
    this.OrderID = Number(init_data.OrderID) || null;
    this.ProgramID = Number(init_data.ProgramID) || null;
    this.InstrumentID = Number(init_data.InstrumentID) || null;
    this.InstrumentMasterID = Number(init_data.InstrumentMasterID) || null;
    this.RTSymbolID = Number(init_data.RTSymbolID) || null;
    this.Resting = Boolean(init_data.Resting) || null;
};

TradeToOrder._name = "TradeToOrder";
TradeToOrder._attrs = {
    OrderID: schema.types.uint64,
    ProgramID: schema.types.uint64,
    InstrumentID: schema.types.uint64,
    InstrumentMasterID: schema.types.int64,
    RTSymbolID: schema.types.int64,
    RealtimeSendTime: schema.types.int64,
    Resting: schema.types.bool,
};
TradeToOrder._refs = {};


/**
 * The list of TradeToOrders sent by the Trading Platform to the Trade Engine.
 * @param init_data
 * @returns {TradeToOrderList}
 * @constructor
 */
let TradeToOrderList = function (init_data) {
    if (!this)
        return new TradeToOrderList(init_data);

    let self = this;

    if (!init_data)
        init_data = {};

    // Attributes
    this.ImmediateExecution = Boolean(init_data.ImmediateExecution) || null;
    this.RenderOrder = Boolean(init_data.RenderOrder) || null;
    this.RealtimeSendTime = Number(init_data.RealtimeSendTime) || null;

    // References
    this.TradeToOrder = [];
    init_data.TradeToOrder.forEach(function (tto) {
        self.TradeToOrder = new TradeToOrder(tto);
    });
};

// Object Definition
TradeToOrderList._name = "TradeToOrderList";
TradeToOrderList._attrs = {
    ImmediateExecution: schema.types.bool,
    RenderOrder: schema.types.bool,
    RealtimeSendTime: schema.types.uint64,
};
TradeToOrderList._refs = {
    TradeToOrder: { name: "TradeToOrder", ref_class : TradeToOrder, is_container: true }
};


// Exports

module.exports.TradeToOrder = TradeToOrder;
module.exports.TradeToOrderLine = TradeToOrderList;
