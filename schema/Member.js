"use strict";

const common = require("./common");


/**
 *
 * @param {Member|null} parent
 * @param {Schema} schema
 * @param {Number} index
 * @param {Object} data
 * @returns {Member}
 * @constructor
 */
function Member(parent, schema, index, data) {
    if (!this)
        return new Member(parent, schema, index, data);

    validateMember(parent, index, data);

    this.schema = schema;
    this.parent = parent;
    this.index = index;

    Object.defineProperty(this, 'schema', { writable: false, enumerable: false });
    Object.defineProperty(this, 'parent', { writable: false, enumerable: false });
    Object.defineProperty(this, 'index', { writable: false, enumerable: false });

    for (let k in data)
        if (data.hasOwnProperty(k) && undefined === this[k])
            this[k] = data[k];

    if (Array.isArray(this.doc))
        this.doc = this.doc.join("\n");
    else if (!this.doc)
        this.doc = "";

    this.template = getTemplateForType(this);

    let self = this;
    let member_map = {};

    this.mapMembers = function (mem) {
        member_map[mem.fullName()] = mem;
        for (let mm in mem.member_map)
            if (mem.member_map.hasOwnProperty(mm)) {
                if (!common.types.isInline(mem.member_map[mm].type) &&
                    common.types.isInline(mem.type)
                )
                    continue;

                member_map[mm] = mem.member_map[mm];
            }
    };

    if (Array.isArray(this.members))
        this.members.forEach(function (m, i) {
            let m_name = getFullName(parent, i, m);
            if (member_map[m_name])
                throw new Error("Invalid schema document, the definition of '" +
                     self.fullName() + "' has duplicate member '" + m_name + "'.");

            self.members[i] = new Member(self, schema, i, m);
            self.mapMembers(self.members[i]);
        });

    Object.defineProperty(this, 'member_map',
        { writable: false, value: member_map, enumerable: false });
}

Member.prototype.fullName = function () {
    return getFullName(this.parent, this.index, this);
};

Member.prototype.parse = function (level, cb) {
    cb(this, level);

    if (common.types[this.type] && common.types[this.type].type === Object)
        Schema.emit(this.type, this, level);

    this.members.forEach(function (m) {
        m.parse(level + 1, cb);
    });
};


module.exports = Member;


// Private Functions

/**
 *
 * @param {Member} parent
 * @param {Number} index
 * @param {Object} data
 */
function validateMember(parent, index, data) {
    const mname = getFullName(parent, index, data);
    const msg = "Invalid schema document. ";

    if (!data.type)
        throw new Error(msg + "Member '" + mname + "' is missing the 'type' " +
            "specification.");

    validateName();

    switch(data.type) {
        case "struct":
        case "union":
            validateStruct();
            break;
        case "enum":
            validateEnum();
            break;
        case "array":
            validateArray();
            break;
        default:
    }



    function validateName() {
        if (data.type !== "struct" && data.type !== "union")
            if (undefined === data.name)
                throw new Error("Member '" + mname + "' has no name, only 'struct' and " +
                    "'union' types can be anonymous.");

        if (undefined !== data.name)
            if (!common.validName(data.name))
                throw new Error("Member '" + mname + "' has an invalid name.");

    }

    function validateStruct() {
        if (!Array.isArray(data.members) || data.members.length === 0)
            throw new Error(msg + "'" + data.type + "' type '" + mname +
                "' has no members.");
    }

    function validateEnum() {
        const err_msg = msg + "'" + data.type + "' type '" + mname + "' ";
        const err_invalid_value = err_msg + "has invalid values.";

        if (!data.value_type)
            data.value_type = "int32";

        if (!common.types.isPrimitive(data.value_type))
            throw new Error(err_msg + "has non-primitive value type.");

        if (!Array.isArray(data.values) || data.values.length === 0)
            throw new Error(err_msg + "has no values");

        data.values.forEach(function (v, i) {
            if (undefined === v.name || undefined === v.value)
                throw new Error(err_invalid_value);

            if (!common.validName(v.name))
                throw new Error(err_invalid_value);

            if (common.types.isNumeric(data.value_type))
                if (isNaN(v.value))
                    throw new Error(err_invalid_value);

                data.values[i] = Number(v);
        });
    }

    function validateArray() {
        if (!data.value_type || undefined === common.types[data.value_type])
            throw new Error("Invalid 'array' in member '" + mname + "', a valid " +
                "'value_type' was not specified.");
    }
}

/**
 *
 * @param {Number} index
 * @param {Object} data
 * @returns {string}
 */
function getName(index, data) {
    let postfix = "";
    if ("function" === data.type) {
        data.params.forEach(function (p) {
            if (postfix) postfix += ", ";
            postfix += p.type;
        });
        postfix ="(" + postfix + ")";
    }

    if (data.name)
        return data.name + postfix;

    return "<anonymous>[" + index + "]" + postfix;
}

/**
 *
 * @param {Member} parent
 * @param {Number} index
 * @param {Object} data
 * @returns {String}
 */
function getFullName(parent, index, data) {
    if (parent)
        return parent.fullName() + "::" + getName(index, data);

    return getName(index, data);
}

/**
 *
 * @param {Member} member
 * @param {String} [type]
 * @returns {String}
 */
function getTemplateForType(member, type) {
    if (undefined === type)
        type = member.type;

    if (member.template)
        return member.template;

    if (member.parent)
        return getTemplateForType(member.parent, type);

    return member.schema.templates[type];
}
