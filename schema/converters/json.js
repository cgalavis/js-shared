"use strict";

/** * @type {Converter} */
module.exports = {

    /**
     *
     * @param {String} json
     * @param {ObjClass} obj_class
     * @returns {Object}
     */
    toObj: function (json, obj_class) {
        return JSON.parse(json);
    },


    /**
     *
     * @param {Object} obj
     * @param {ObjClass} obj_class
     * @returns {String}
     */
    fromObj: function (obj, obj_class) {
        return JSON.stringify(obj);
    }

};
