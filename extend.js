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

    if (super_ctor.super_) {
        let ctor_cn = Object.className(ctor);
        let super_ctor_cn = Object.className(super_ctor);
        let super_ctor_super_cn = Object.className(super_ctor.super_);
        throw new Error("Mutil level inheritance is not supported. Class " +
            `"${ctor_cn}" can't descent from class "${super_ctor_cn}" because ` +
            `"${super_ctor_cn}" is a descendant of "${super_ctor_super_cn}".`);
    }

    if (ctor.super_)
        if (ctor.super_ === super_ctor)
            return;
        else
            throw new Error("Given target constructor has already been extended");

    if (this && this !== global)
        throw new Error("Creating instances of 'Extend' is not allowed.");

    util.inherits(ctor, super_ctor);

    ctor.prototype["super$constructor"] = function () {
        super_ctor.apply(this, arguments);
        return this;
    };

    for (let f in super_ctor.prototype) 
        if ("function" === typeof super_ctor.prototype[f])
            ctor.prototype["super$" + f] = function () {
                return super_ctor.prototype[f].apply(this, arguments);
            }

}
