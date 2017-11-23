"use strict";

require("./proto").init();

const util = require("util");


module.exports = extend;


/**
 * This method provides prototipical inheritance between 'ctor' and 'super_ctor' classes.
 * the "util.inherits" Node method is used to connect the prototypes and to establish the
 * "super_" member.
 * 
 * Once two classes are linked, the method <tt>bindConstructor</tt>, <tt>bindFuncs</tt> 
 * and <tt>bindAll</tt> can be used to provide easy access to the inherited constructor 
 * as wel las other method in the super class's prototype.
 * @param {Function} ctor 
 * @param {Function} super_ctor 
 */
function extend(ctor, super_ctor) {
    if ("function" !== typeof ctor)
        throw new Error("Invalid call to 'extend', the target constructor (ctor) " +
        "is not optional");

    if ("function" !== typeof super_ctor)
        throw new Error("Invalid call to 'extend', the super constructor (super_ctor) " +
        "is not optional");

    if (ctor.super_)
        if (ctor.super_ === super_ctor)
            return;
        else
            throw new Error("Given target constructor has already been extended");

    if (this && this !== global)
        throw new Error("Creating instances of 'extend' is not allowed.");

    util.inherits(ctor, super_ctor);
    ctor.super$constructor = ctor.super_;

    addInheritedMethods(ctor, super_ctor.prototype);
}

function addInheritedMethods(ctor, proto) {
    for (let f in proto) {
        let sf = "super$" + f;
        if ("function" === typeof proto[f] && !f.includes("super$") && !ctor[sf])
            ctor[sf] = proto[f];
    }

    if (proto.prototype)
        addInheritedMethods(ctor, proto.prototype);
}