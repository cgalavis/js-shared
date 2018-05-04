"use strict";

/**
 * @file
 *
 * This module contains extensions to common JavaScript objects such as <tt>Object</tt>,
 * <tt>Number</tt> and <tt>Date</tt>. Extensions need to be registered using the
 * <tt>init</tt> function. This function take a single optional parameter that indicates the
 * object to extend, if the parameter is omitted all extensions are registered.
 *
 * <hr>
 * <h4>Important</h4>
 * This is typically bad practice as some
 * of these functions may be introduced in future versions of JavaScript, but wrapping
 * them the way libraries like <b>moment</b> do compromises performance since a wrapper
 * object has to be created with a reference to the underlying object instance, so
 * here we buy the bullet and pray!!
 *
 * For the most part instance members are the ones at most risk, most of the functions
 * defined here are very unlikely to be introduced in future version of JS except perhaps
 * for single word functions such as <tt>clone</tt>, <tt>copy</tt> and
 * <tt>contains</tt>, etc. as well as some of the most commonly named functions like
 * <tt>className</tt>, <tt>isType</tt>, <tt>isPrimitive</tt> etc.
 *
 * @example
 * // Register all extensions
 * require("@crabel/proto").init();
 *
 * // Registers "Object" extensions only
 * require("@crabel/proto").init(Object);
 *
 * //Registers "Date" and "Array" extensions
 * require("@crabel/proto").init(Date, Array);
 * @module @crabel/shared/proto
 * @exports init
 */



// =======================
// == Object Extensions ==
// =======================


/**
 * @alias Object
 * @constructor
 */
function ObjExt() {}

/**
 * Returns true of the object matches the given type. objType should be a function
 * constructor such as <tt>Number</tt>, <tt>Date</tt>, <tt>String</tt>, etc.
 * @param {Object} obj
 * Object instance to test.
 * @param {Function} type
 * Constructor function defining the type to test against.
 * @returns {Boolean}
 */
ObjExt.isType = function (obj, type) {
    for (let i = 1; i < arguments.length; ++i) {
        type = arguments[i];
        if (undefined === obj || null === obj)
            if (obj === type)
                return true;

        if ("number" === typeof obj) if (type === Number) return true;
        if ("string" === typeof obj) if (type === String) return true;
        if ("boolean" === typeof obj) if (type === Boolean) return true;

        if (obj instanceof type)
            return true;
    }

    return false;
};

/**
 * Returns true if the given value <tt>val</tt> is one of the primitive types
 * <tt>Number</tt>, <tt>String</tt>, <tt>Boolean</tt>, <tt>null</tt> or
 * <tt>undefined</tt>.
 * @param {*} val
 * Variable to inspect.
 * @returns {Boolean}
 */
ObjExt.isPrimitive = function (val) {
    if (undefined === val || null === val)
        return true;

    if ("object" === typeof val)
        return ObjExt.isType(val, Number, String, Boolean);

    return (
        "number" === typeof val ||
        "string" === typeof val ||
        "boolean" === typeof val
    );
};


/** Get name of the constructor function. This is used during registration to determine
 * which object is being registered. This function does not rely on <b>arguments</b> so
 * it is compatible with ES6 and <tt>strict</tt> mode.
 * @param {Object} obj
 * Object to inspect.
 * @returns {String}
 * Name of the function used to construct the object.
 */
ObjExt.className = function (obj) {
    let funcNameRegex = /function ([^(]*)/;
    let results = (funcNameRegex).exec((obj).toString());
    return (results && results.length > 1) ? results[1] : "";
};

/**
 * Creates a copy of the given object. By default the <tt>clone</tt> function
 * performs a deep copy of the object, passing <tt>deep = false</tt> will only clone
 * the properties directly owned by the object are transfer to the object includinig
 * <tt>Date</tt> objects.
 *
 * NOTE: <tt>clone</tt> is replaceable, <tt>copy</tt> is not since is a static method.
 * @param {Object} src
 * Reference to the object to be copied.
 * @param {Boolean} [deep=true]
 * Determines if child objects are copied too.
 * @returns {Object}
 * Copy of the object given by <tt>src</tt>
 */
ObjExt.copy = function (src, deep) {
    if (!src)
        return src;

    // if primitive, just return the value
    if (ObjExt.isPrimitive(src))
        return src.valueOf();

    if (ObjExt.isType(src, Date))
        return new Date(src.getTime());

    if (undefined === deep)
        deep = true;

    let res;
    if (ObjExt.isType(src, Array))
        res = [];
    else
        res = {};

    for (let attr in src) {
        if (src.hasOwnProperty(attr)
            && null != src[attr] && "object" == typeof (src[attr])
        ) {
            // Recursion when cloning the Date object fails on return, who knows why...
            // Try it if you don't believe me :)
            if (src[attr] instanceof Date)
                res[attr] = new Date(src[attr].getTime());
            else if (deep)
                res[attr] = ObjExt.copy(src[attr], true);
        }
        else
            res[attr] = src[attr];
    }
    return res;
};

/**
 * Returns true if <tt>src</tt> fully contains <tt>child</tt>. The comparison is
 * recursive so all properties and children's properties of 'tgt' must also exist in
 * <tt>src</tt> and have the same values.
 * @param {*} src
 * @param {*} child
 * @returns {Boolean}
 */
ObjExt.contains = function (src, child) {
    if (ObjExt.isPrimitive(src)) {
        if (ObjExt.isPrimitive(child))
            return (child === src);

        return false;
    }

    if (ObjExt.isPrimitive(child)) {
        for (let k in src)
            if (src.hasOwnProperty(k))
                if (ObjExt.contains(src[k], child))
                    return true;

        return false;
    }

    for (let k in child)
        if (child.hasOwnProperty(k)) {
            if (!src.hasOwnProperty(k))
                return containedByChild();

            // Compare primitive, 'undefined' or 'null' child[k]
            if (src[k] instanceof Date) {
                if (child[k] instanceof Date)
                    return src[k].getTime() === child[k].getTime();
                return false;
            }
            if (ObjExt.isPrimitive(src[k])) {
                if (ObjExt.isPrimitive(child[k])) {
                    if (child[k] === src[k])
                        continue;
                    else
                        return containedByChild();
                }
                return false;
            }

            // If source branch doesn't contain child branch, try other children of source
            if (!ObjExt.contains(src[k], child[k]))
                return containedByChild();
        }

    return true;


    function containedByChild() {
        for (let s in src)
            if (src.hasOwnProperty(s))
                if (ObjExt.contains(src[s], child))
                    return true;
        return false;

    }
};

/**
 * Returns true of the object matches the given type. objType should be a function
 * constructor such as 'Number', 'Date', 'String', etc.
 * @param {Function} objType
 * @returns {Boolean}
 */
ObjExt.prototype.is = function (objType) {
    return ObjExt.isType.bind(null, this).apply(null, arguments);
};

/**
 * Returns true if this object is one of the primitive types <tt>Number</tt>,
 * <tt>String</tt> or <tt>Boolean</tt>.
 * @returns {Boolean}
 */
ObjExt.prototype.isPrimitive = function () {
    return ObjExt.isPrimitive(this);
};

/**
 * Makes a copy of the current object. All attributes are copied including dates and
 * strings. The returned object has no common references with the original object. If the
 * optional parameter "deep" is set to true, the object is recursively cloned, all
 * aggregated objects and arrays are also cloned.
 * @param deep
 * @returns {Object}
 */
ObjExt.prototype.clone = function (deep) {
    return Object.copy(this, deep);
};

/**
 * Returns true of 'this' fully contains 'tgt'. The comparison is recursive so all
 * properties and children's properties of 'tgt' must also exist in this' and have the
 * same values.
 * @param {Object} tgt
 * @returns {Boolean}
 */
ObjExt.prototype.contains = function (tgt) {
    return ObjExt.contains(this, tgt);
};

/**
 * Merges the attributes from <b>src</b> into '<b>this</b> object. If <b>replace</b> is
 * true, all overlapping attributes are replaced.
 * NOTE: Recursion when cloning the Date object fails on return, who knows why... try it
 * if you don't believe me :)
 * @param {Object} src
 * @param {Boolean} replace
 * @param {Boolean} deep
 * @returns {Object}
 */
ObjExt.prototype.merge = function (src, replace, deep) {
    if (undefined === src || null === src)
        return this;

    if (undefined === deep)
        deep = true;

    for (let attr in src) {
        if (src.hasOwnProperty(attr) && undefined !== src[attr]) {
            if (!src[attr] || ObjExt.isPrimitive(src[attr])) {
                if (undefined === this[attr] || replace)
                    if (src[attr] instanceof Date)
                        this[attr] = new Date(src[attr].getTime());
                    else
                        this[attr] = src[attr];
            }
            else if (deep) {
                if (undefined === this[attr] ||
                    (replace && ObjExt.isPrimitive(this[attr]))
                )
                    this[attr] = ObjExt.copy(src[attr], true);
                else
                    this[attr].merge(src[attr], replace, true);
            }
        }
    }

    return this;    // allow method to be called on object assignment
};

/**
 * Returns the name of the constructor function that was used to create the instance.
 * @returns {String}
 */
ObjExt.prototype.className = function () {
    return ObjExt.className((this).constructor);
};



// =======================
// == Number Extensions ==
// =======================


/**
 * @alias Number
 * @constructor
 */
function NumExt() {}


/**
 * Rounds the number <b>this</b> to the given integer amount.
 * @param {Number} amount
 * @returns {Number}
 */
NumExt.prototype.roundToInt = function (amount) {
    return Math.round(this / amount) * amount;
};

/**
 * Truncates the number <b>this</b> to the given integer amount.
 * @param {Number} amount
 * @returns {number}
 */
NumExt.prototype.truncToInt = function (amount) {
    return Math.floor(this / amount) * amount;
};

/**
 * Calculates the next closest power of 2 number.
 * @returns {Number}
 */
NumExt.prototype.nextPow2 = function () {
    let x = Math.ceil(this);

    x -= 1;
    x |= (x >> 1);
    x |= (x >> 2);
    x |= (x >> 4);
    x |= (x >> 8);
    x |= (x >> 16);

    return x + 1;
};

/**
 * Calculates the previous closest power of 2 number.
 * @returns {Number}
 */
NumExt.prototype.prevPow2 = function () {
    return Number(Math.floor(this) + 1).nextPow2() >> 1;
};

/**
 * Returns a string pre-appending any necessary 0s to reach the given width
 * @param {Number} width
 * @returns {String}
 */
NumExt.prototype.zeroPad = function (width) {
    let num_str = this.toString();
    let len = width - num_str.length;
    for (let i = 0; i < len; ++i)
        num_str = "0" + num_str;
    return num_str;
};

/**
 * Assumes the input is in milliseconds (straight from dateExt.getTime)
 * Format Specs:
 * <ul>
 *      <li>h[h]    = hours
 *      <li>m[m]    = minutes
 *      <li>s[s]    = seconds
 *      <li>f       = hundreds of a second
 *      <li>ff      = tens of a seconds
 *      <li>fff     = milliseconds
 * </ul>
 * Text enclosed within {} brackets is excluded from substitution however the brackets
 * are removed. To preserve the braces use double braces: {{test}} = {test}
 * @param {String} [format]
 * @returns {String}
 */
NumExt.prototype.toTime = function (format) {
    if (undefined === format)
        format = "hh:mm:ss";

    let time = Math.abs(this);
    let seconds = time/ 1000;
    let hours = (this >= 0) ?
        Math.floor(seconds / 3600) : -1 * Math.floor(seconds / 3600);
    let minutes = Math.floor((seconds % 3600) / 60);
    seconds = Math.floor(seconds % 60);
    let millis = Math.floor(time% 1000);
    let tens_of_millis = Math.floor(millis / 10);
    let hundreds_of_millis = Math.floor(tens_of_millis / 10);

    return formatTime();

    function formatTime()
    {
        let bits = [];
        let closeSplit = format.split("}");
        for (let i = 0; i < closeSplit.length; ++i)
        {
            let openSplit = closeSplit[i].split("{");

            openSplit[0] = openSplit[0].replace("hh", hours.zeroPad(2));
            openSplit[0] = openSplit[0].replace("h", hours);

            openSplit[0] = openSplit[0].replace("mm", minutes.zeroPad(2));
            openSplit[0] = openSplit[0].replace("m", minutes);

            openSplit[0] = openSplit[0].replace("ss", seconds.zeroPad(2));
            openSplit[0] = openSplit[0].replace("s", seconds);

            openSplit[0] = openSplit[0].replace("fff", millis.zeroPad(3));
            openSplit[0] = openSplit[0].replace("ff", tens_of_millis.zeroPad(2));
            openSplit[0] = openSplit[0].replace("f", hundreds_of_millis.zeroPad(1));

            if (millis > 0)
                openSplit[0] = openSplit[0].replace("FFF", millis);
            if (tens_of_millis > 0)
                openSplit[0] = openSplit[0].replace("FF", tens_of_millis);
            if (hundreds_of_millis > 0)
                openSplit[0] = openSplit[0].replace("F", hundreds_of_millis);

            bits.push(openSplit.join(""));
        }

        return bits.join("");
    }
};

/**
 * Returns a string with the number as an enumeration (1st, 2nd, 3rd, 4th, etc)
 * @returns {String}
 */
NumExt.prototype.toEnum = function () {
    let val = Math.abs(Number(this));
    if (1 == val) return this + "st";
    if (2 == val) return this + "nd";
    if (3 == val) return this + "rd";
    return this + "th";

};

/**
 * Returns true if the number is within the given range. By default the range is
 * interpreted as a close range, passing 'inclusive = false' will make it an open range.
 * @param {Number} first
 * @param {Number} second
 * @param {Boolean} inclusive
 * @returns {Boolean}
 */
NumExt.prototype.between = function (first, second, inclusive)
{
    if (isNaN(first) || isNaN(second))
        throw new Error("Invalid cal to \"between\", the input parameters must " +
            "be numeric.");

    first = Number(first);
    second = Number(second);

    let low = Math.min(first, second);
    let high = Math.max(first, second);

    if (undefined === inclusive || inclusive)
        return (this >= low && this <= high);

    return (this > low && this < high);
};



// ===================
// ==Date Extensions==
// ===================

/**
 * @alias Date
 * @constructor
 */
function DateExt() {}


/**
 * Formats the given date "dt" using the formatting specifications in fstr. The following
 * formatting tokens apply:
 *  <table style="width: 100%">
 *      <tr></td><td><b>yyyy</b></td><td style="width: 6px"></td><td>Four digit year</td></tr>
 *      <tr><td><b>yy</b></td><td></td><td>Two digit year</td></tr>
 *      <tr><td><b>MM</b></td><td></td><td>Two digit month</td></tr>
 *      <tr><td><b>M</b></td><td></td><td>Single digit month (when less than 10)</td></tr>
 *      <tr><td><b>MMMM</b></td><td></td><td>Month of the year, full name</td></tr>
 *      <tr><td><b>MMM</b></td><td></td><td>Month of the year, short name</td></tr>
 *      <tr><td><b>dd</b></td><td></td><td>Two digit day</td></tr>
 *      <tr><td><b>d</b></td><td></td><td>Single digit day (when less than 10)</td></tr>
 *      <tr><td><b>dddd</b></td><td></td><td>Day of the week, full name</td></tr>
 *      <tr><td><b>ddd</b></td><td></td><td>Day of the week, short name</td></tr>
 *      <tr><td><b>HH</b></td><td></td><td>Two digit hour, 24 hour clock</td></tr>
 *      <tr><td><b>H</b></td><td></td><td>Single digit hour (when less than 10), 24 hour clock</td></tr>
 *      <tr><td><b>hh</b></td><td></td><td>Two digit hour, 12 hour clock</td></tr>
 *      <tr><td><b>h</b></td><td></td><td>Single digit hour (when less than 10), 12 hour clock</td></tr>
 *      <tr><td><b>TT</b></td><td></td><td>Time of day (AM/PM)</td></tr>
 *      <tr><td><b>T</b></td><td></td><td>Time of day (A/P)</td></tr>
 *      <tr><td><b>tt</b></td><td></td><td>Time of day in lowercase (am/pm)</td></tr>
 *      <tr><td><b>t</b></td><td></td><td>Time of day in lowercase (a/b)</td></tr>
 *      <tr><td><b>mm</b></td><td></td><td>Two digit minute</td></tr>
 *      <tr><td><b>m</b></td><td></td><td>Single digit minute (when less than 10)</td></tr>
 *      <tr><td><b>ss</b></td><td></td><td>Two digit second</td></tr>
 *      <tr><td><b>s</b></td><td></td><td>Single digit second (when less than 10)</td></tr>
 *      <tr><td><b>fff</b></td><td></td><td>Milliseconds, zero padded 3 digit number</td></tr>
 *      <tr><td><b>ff</b></td><td></td><td>Tens of milliseconds, zero padded 2 digit number</td></tr>
 *      <tr><td><b>f</b></td><td></td><td>Hundreds of milliseconds</td></tr>
 *      <tr><td><b>FFF</b></td><td></td><td>Milliseconds with no padding</td></tr>
 *      <tr><td><b>FF</b></td><td></td><td>Tens of milliseconds, with no padding</td></tr>
 *      <tr><td><b>F</b></td><td></td><td>Hundreds of milliseconds, with no padding</td></tr>
 *      <tr><td><b>KKK</b></td><td></td><td>Timezone long description > GMT-0700 (PDT)</td></tr>
 *      <tr><td><b>KK</b></td><td></td><td>Timezone short description > PDT</td></tr>
 *      <tr><td><b>K</b></td><td></td><td>Timezone offset from GMT > -0700</td></tr>
 *  </table>
 *
 * Use the "{" and "}" brackets to enclose text where date substitution should be avoided.
 * @param {Date} dt Instance of <tt>date</tt> to format.
 * @param {String} fstr Format string, e.g. "yyyy/MM/dd"
 * @param {Function} [replacer] Optional function to replace the date/time tokens. If
 * omitted, the default substitution is used.
 * @returns {String}
 */
DateExt.format = function (dt, fstr, replacer)
{
    if (!replacer || !ObjExt.isType(replacer, Function))
        replacer = function () { return null; };

    if (undefined === fstr)
        fstr = "MM/dd/yyyy hh:mm:ss";

    // First resolve all name related tokens and enclose within {} to avoid the
    // token substitution from affecting the month and day of week names.

    fstr = protectEscapedChars(fstr);
    fstr = resolveNames(dt, fstr);

    let h12 = (dt.getHours() > 12) ? dt.getHours() - 12 : dt.getHours();
    let millis = dt.getMilliseconds();
    let tens_of_millis = Math.round(millis / 10);
    let hundreds_of_millis = Math.round(tens_of_millis / 10);

    let bits = [];
    let closeSplit = fstr.split("}");
    for (let i = 0; i < closeSplit.length; ++i)
    {
        let openSplit = closeSplit[i].split("{");

        // Long tokens first to avoid partial match substitution
        openSplit[0] = openSplit[0].replace("yyyy", replacer(dt, "yyyy") ||
            dt.getFullYear());
        openSplit[0] = openSplit[0].replace("yy", replacer(dt, "yy") ||
            dt.getYear());

        openSplit[0] = openSplit[0].replace("MM", replacer(dt, "MM") ||
            (dt.getMonth() + 1).zeroPad(2));
        openSplit[0] = openSplit[0].replace("M", replacer(dt, "M") ||
            (dt.getMonth() + 1));

        openSplit[0] = openSplit[0].replace("dd", replacer(dt, "dd") ||
            dt.getDate().zeroPad(2));
        openSplit[0] = openSplit[0].replace("d", replacer(dt, "d") ||
            dt.getDate());

        openSplit[0] = openSplit[0].replace("HH", replacer(dt, "HH") ||
            dt.getHours().zeroPad(2));
        openSplit[0] = openSplit[0].replace("H", replacer(dt, "H") ||
            dt.getHours());
        openSplit[0] = openSplit[0].replace("hh", replacer(dt, "hh") ||
            h12.zeroPad(2));
        openSplit[0] = openSplit[0].replace("h", replacer(dt, "h") ||
            h12);

        openSplit[0] = openSplit[0].replace("mm", replacer(dt, "mm") ||
            dt.getMinutes().zeroPad(2));
        openSplit[0] = openSplit[0].replace("m", replacer(dt, "m") ||
            dt.getMinutes());

        openSplit[0] = openSplit[0].replace("ss", replacer(dt, "ss") ||
            dt.getSeconds().zeroPad(2));
        openSplit[0] = openSplit[0].replace("s", replacer(dt, "s") ||
            dt.getSeconds());

        openSplit[0] = openSplit[0].replace("fff", replacer(dt, "fff") ||
            millis.zeroPad(3));
        openSplit[0] = openSplit[0].replace("ff", replacer(dt, "ff") ||
            tens_of_millis.zeroPad(2));
        openSplit[0] = openSplit[0].replace("f", replacer(dt, "f") ||
            hundreds_of_millis.zeroPad(1));

        openSplit[0] = openSplit[0].replace("FFF", replacer(dt, "FFF") ||
            millis);
        openSplit[0] = openSplit[0].replace("FF", replacer(dt, "FF") ||
            tens_of_millis);
        openSplit[0] = openSplit[0].replace("F", replacer(dt, "F") ||
            hundreds_of_millis);

        bits.push(openSplit.join(""));
    }

    return replaceTokens(bits.join(""));

    function protectEscapedChars(str)
    {
        str = str.replace(/{{/g, "{:OBRACKET:}");
        str = str.replace(/}}/g, "{:CBRACKET:}");
        return str;
    }

    function replaceTokens(str)
    {
        str = str.replace(/:OBRACKET:/g, "{", "g");
        str = str.replace(/:CBRACKET:/g, "}", "g");
        return str;
    }

    function resolveNames(dt, fstr)
    {
        let dow = [
            "Sunday",       "Monday",       "Thuesday",     "Wednesday",
            "Thursday",     "Friday",       "Saturday"];
        let dow_short = [
            "Sun", "Mon", "Tue", "Wed",
            "Thu", "Fri", "Sat"];
        let month = [
            "January",      "Februaty",     "March",        "April",        "May",
            "June",         "July",         "August",       "September",    "October",
            "November",     "December"];
        let month_short = [
            "Jan", "Feb", "Mar", "Apr", "May", "Jun",
            "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

        let bits = [];
        let closeSplit = fstr.split("}");
        let pm = (dt.getHours() >= 12);
        for (let i = 0; i < closeSplit.length; ++i)
        {
            let openSplit = closeSplit[i].split("{");

            openSplit[0] = openSplit[0].replace("TT", "{" + (replacer(dt, "tt") ||
                (pm ? "PM" : "AM")) + "}");
            openSplit[0] = openSplit[0].replace("T", "{" + (replacer(dt, "t") ||
                (pm ? "P" : "A")) + "}");
            openSplit[0] = openSplit[0].replace("tt", "{" + (replacer(dt, "tt") ||
                (pm ? "pm" : "am")) + "}");
            openSplit[0] = openSplit[0].replace("t", "{" + (replacer(dt, "t") ||
                (pm ? "p" : "a")) + "}");

            openSplit[0] = openSplit[0].replace("MMMM", "{" + (replacer(dt, "MMMM") ||
                month[dt.getMonth()]) + "}");
            openSplit[0] = openSplit[0].replace("MMM", "{" + (replacer(dt, "MM") ||
                month_short[dt.getMonth()]) + "}");

            openSplit[0] = openSplit[0].replace("dddd", "{" + (replacer(dt, "dddd") ||
                dow[dt.getDay()]) + "}");
            openSplit[0] = openSplit[0].replace("ddd", "{" + (replacer(dt, "ddd") ||
                dow_short[dt.getDay()]) + "}");

            // TODO : Timezone replacement has not yet been implemented.
            openSplit[0] = openSplit[0].replace("KKK", "{" + (replacer(dt, "KKK") ||
                "KKK") + "}");
            openSplit[0] = openSplit[0].replace("KK", "{" + (replacer(dt, "KK") ||
                "KK") + "}");
            openSplit[0] = openSplit[0].replace("K", "{" + (replacer(dt, "K") ||
                "K") + "}");

            bits.push(openSplit.join("{"));
        }

        return bits.join("}");
    }
};

/**
 * Compares the two dates and returns true if they point to the same day.
 * @param {Date} date1 First date to compare.
 * @param {Date} date2 Second date to compare.
 * @returns {Boolean}
 */
DateExt.sameDay = function (date1, date2)
{
    return date1.getFullYear() == date2.getFullYear()
        && date1.getMonth() == date2.getMonth()
        && date1.getDate() == date2.getDate();
};

/**
 * Returns the maximum length that the given format string can yield after a date is
 * formatted.
 * Usage:
 * <ul>
 *      <li><tt>let len = DateExt.formatLength("yyyy/mm/dd");  // len = 10</tt>
 *      <li><tt>let len = DateExt.formatLength("yyy/m/d");     // len = 10</tt>
 * </ul>
 * @param {String} format_str
 * @param {Function} [replacer] Function to replace date/time tokens.
 * @returns {Number}
 */
DateExt.formatLength = function (format_str, replacer)
{
    // using a date that has 2 digit month, day, hour, minute and second,
    // and 3 digits for milliseconds that won't round to zero when doing
    // tens or hundreds of millis.
    let full_date = new Date(2015, 10, 17, 12, 45, 45, 123);
    return full_date.format(format_str, replacer).length;
};


// == Instance Members ==

/**
 * Returns copy of <tt>this</tt> and adds <tt>y</tt> number of years to it. The number of
 * years to add can be negative.
 * @param {Number} [y=1] Number of years to add.
 * @returns {Date} Returns a new instance of <tt>Date</tt>.
 */
DateExt.prototype.addYears = function (y)
{
    if (isNaN(y)) y = 1;
    return new Date(
        this.getFullYear() + y, this.getMonth(), this.getDate(),
        this.getHours(), this.getMinutes(), this.getSeconds(), this.getMilliseconds()
    );
};

/**
 * Adds <tt>y</tt> number of years to <tt>this</tt> and returns it to allow chaining.
 * @param {Number} [y=1] Number of years to add.
 * @returns {Date} Returns <tt>this</tt> after incrementing it's value.
 */
DateExt.prototype.incYear = function (y)
{
    if (isNaN(y)) y = 1;
    this.setFullYear(this.getFullYear() + y);
    return this;
};

/**
 * Returns copy of <tt>this</tt> and adds <tt>m</tt> number of months to it. The number of
 * months can be negative.
 * @param {Number} [m=1] Number of months to add.
 * @returns {Date} Returns a new instance of <tt>Date</tt>.
 */
DateExt.prototype.addMonths = function (m)
{
    if (isNaN(m)) m = 1;
    let res = new Date(this.getTime());
    res.setMonth(res.getMonth() + m);
    return res;
};

/**
 * Adds <b>m</b> number of months to <b>this</b> and returns it to allow chaining.
 * @param {Number} [m=1] Number of months to add.
 * @returns {Date} Returns <tt>this</tt> after incrementing it's value.
 */
DateExt.prototype.incMonth = function (m)
{
    if (isNaN(m)) m = 1;
    this.setMonth(this.getMonth() + m);
};

/**
 * Returns copy of <b>this</b> and adds <b>d</b> number of days to it. The number of days
 * can be negative.
 * @param {Number} [d=1] Number of days to add.
 * @returns {Date} Returns a new instance of <tt>Date</tt>.
 */
DateExt.prototype.addDays = function (d)
{
    if (isNaN(d)) d = 1;
    return new Date(this.getTime() + (d * 36e5 * 24));
};

/**
 * Adds <tt>d</tt> number of days to <tt>this</tt> and returns it to allow chaining.
 * @param {Number} [d=1] Number of days to add.
 * @returns {Date} Returns <tt>this</tt> after incrementing it's value.
 */
DateExt.prototype.incDay = function (d)
{
    if (isNaN(d)) d = 1;
    this.setTime(this.getTime() + (d * 36e5 * 24));
};

/**
 * Returns copy of <tt>this</tt> and adds <tt>h</tt> number of hours to it.
 * @param {Number} [h=1] Number of hours to add.
 * @returns {Date} Returns a new instance of <tt>Date</tt>.
 */
DateExt.prototype.addHours = function (h)
{
    if (isNaN(h)) h = 1;
    return new Date(this.getTime() + (h * 36e5));
};

/**
 * Adds <tt>h</tt> number of hours to <tt>this</tt> and returns it to allow chaining.
 * @param {Number} [h=1] Number of hours to add.
 * @returns {Date} Returns <tt>this</tt> after incrementing it's value.
 */
DateExt.prototype.incHour = function (h)
{
    if (isNaN(h)) h = 1;
    this.setTime(this.getTime() + (h * 36e5));
};

/**
 * Returns copy of <tt>this</tt> and adds <tt>m</tt> number of minutes to it. The number
 * of minutes can be negative.
 * @param {Number} [m=1] Number of minutes to add.
 * @returns {Date} Returns a new instance of <tt>Date</tt>.
 */
DateExt.prototype.addMinutes = function (m)
{
    if (isNaN(m)) m = 1;
    return new Date(this.getTime() + (m * 6e4));
};

/**
 * Adds <tt>h</tt> number of minutes to <tt>this</tt> and returns it to allow chaining.
 * @param {Number} [m=1] Number of minutes to add.
 * @returns {Date} Returns <tt>this</tt> after incrementing it's value.
 */
DateExt.prototype.incMinute = function (m)
{
    if (isNaN(m)) m = 1;
    this.setTime(this.getTime() + (m * 6e4));
};

/**
 * Returns copy of <tt>this</tt> and adds <tt>d</tt> number of seconds to it. The number of
 * seconds can be negative.
 * @param {Number} [s=1] Number of seconds to add.
 * @returns {Date} Returns a new instance of <tt>Date</tt>.
 */
DateExt.prototype.addSeconds = function (s)
{
    if (isNaN(s)) s = 1;
    return new Date(this.getTime() + (s * 1000));
};

/**
 * Adds <tt>h</tt> number of seconds to <tt>this</tt> and returns it to allow chaining.
 * @param {Number} [s=1] Number of seconds to add.
 * @returns {Date} Returns <tt>this</tt> after incrementing it's value.
 */
DateExt.prototype.incSecond = function (s)
{
    if (isNaN(s)) s = 1;
    return this.setTime(this.getTime() + (s * 1000));
};

/**
 * Returns copy of <tt>this</tt> and adds <tt>d</tt> number of milliseconds to it. The number
 * of milliseconds can be negative.
 * @param {Number} [ms=1] Number of milliseconds to add.
 * @returns {Date} Returns a new instance of <tt>Date</tt>.
 */
DateExt.prototype.addMillis = function (ms)
{
    if (isNaN(ms)) ms = 1;
    return new Date(this.getTime() + ms);
};

/**
 * Adds <tt>h</tt> number of milliseconds to <tt>this</tt> and returns it to allow
 * chaining.
 * @param {Number} [ms=1] Number of milliseconds to add.
 * @returns {Date} Returns <tt>this</tt> after incrementing it's value.
 */
DateExt.prototype.incMilli = function (ms)
{
    if (isNaN(ms)) ms = 1;
    return this.setTime(this.getTime() + ms);
};

/**
 * Returns the difference between <tt>this</tt> and <tt>date</tt> in the given units
 * (milliseconds by default). Supported units are: "day/d", "hour/h", "minute/m",
 * "second/s", "millisecond/msec/f"
 * @param {Date} date The date to compare against
 * @param {String} units Units to compare (day, hour, minute, second, msec).
 * @returns {Number} Returns the difference between the two dates.
 * @throws Throws an error if <tt>units</tt> are not supported.
 */
DateExt.prototype.diff = function (date, units)
{
    if (!ObjExt.isType(date, Date))
        throw new Error("Invalid call to 'Date.diff', the input is not " +
            "a data.");
    if (!units)
        units = "f";

    if (units === "f" || units === "millisecond" || units === "msec")
        return Math.floor(Math.abs(date.getTime() - this.getTime()));

    if (units === "s" || units === "second")
        return Math.floor(Math.abs(date.getTime() - this.getTime()) / 1000);

    if (units === "m" || units === "minute")
        return Math.floor(Math.abs(date.getTime() - this.getTime()) / 6e4);

    if (units === "h" || units === "hour")
        return Math.floor(Math.abs(date.getTime() - this.getTime()) / 36e6);

    if (units === "d" || units === "day")
        return Math.floor(Math.abs(date.getTime() - this.getTime()) / (36e6 * 24));

    throw new Error("The '" + units + "' units are not supported.");
};

/**
 * Returns a new date object representing the same date/time but in UTC. This is a nasty
 * hack since the returned date still shows the local timezone (no way to change this as
 * far as I know), however it is very convenient to be able to operate on a Date that's
 * already adjusted.
 * @returns {Date}
 */
DateExt.prototype.toUtc = function ()
{
    return new Date(this.getTime() + this.getTimezoneOffset() * 60000);
};


/**
 // Formats the date with the given specification. See <tt>Date.format</tt> for more
 detail.
 * @param {String} fstr Format string in the form <code>yyyy/MM/dd</code>
 * @param {Function} [replacer] Optional function to replace the date/time tokens.
 * @returns {string} Returns a string with the formatted date/time
 */
DateExt.prototype.format = function (fstr, replacer)
{
    return DateExt.format(this, fstr, replacer);
};

/**
 * Returns true if <tt>this</tt> and <tt>date</tt> point to the same day.
 * @param {Date} date
 * @returns {Boolean}
 */
DateExt.prototype.sameDay = function (date)
{
    return DateExt.sameDay(this, date);
};

/**
 * Returns true if <tt>this</tt> day is earlier than <tt>date</tt> ignoring the time.
 * @param {Date} date
 * @returns {Boolean}
 */
DateExt.prototype.earlierDayThan = function (date)
{
    if (this.getFullYear() < date.getFullYear())
        return true;
    else if (this.getFullYear() > date.getFullYear())
        return false;

    if (this.getMonth() < date.getMonth())
        return true;
    else if (this.getMonth() > date.getMonth())
        return false;

    return (this.getDate() < date.getDate());
};

/**
 * Returns true if <b>this</b> day is later than <b>date</b> ignoring the time.
 * @param {Date} date
 * @returns {Boolean}
 */
DateExt.prototype.laterDayThan = function (date)
{
    return date.earlierDayThan(this);
};

/**
 * Zeros out the time component of <tt>this</tt>.
 * @returns {DateExt} Returns <tt>this</tt> after truncating time.
 */
DateExt.prototype.truncTime = function () {
    this.setHours(0, 0, 0, 0);
    return this;
};



// ======================
// == Array Extensions ==
// ======================

/**
 * @alias Array
 * @constructor
 */
function ArrayExt() {}

// == Instance Members ==

/**
 * Returns the first element in the array. The optional offset parameter can be used to
 * iterate through the array from first to last.
 * @param {Number} [offset=0]
 * Optionally returns the element <tt>offset</tt> from the first.
 * @returns {*}
 */
ArrayExt.prototype.first = function (offset)
{
    if (!offset)
        offset = 0;

    if (this.length <= offset)
        return null;

    return this[offset];
};

/**
 * Returns the last element in the array. The optional offset parameter can be used to
 * iterate through the array from last to first.
 * @param {Number} [offset=0]
 * Optionally returns the element <tt>offset</tt> from the last.
 * @returns {*}
 */
ArrayExt.prototype.last = function (offset)
{
    if (!offset)
        offset = 0;

    if (this.length <= offset)
        return null;

    return this[this.length - 1 - offset];
};

/**
 * Returns <tt>true</tt> if the given index points to the last element in the
 * <tt>Array</tt>.
 * @param {Number} index
 * @returns {Boolean}
 */
ArrayExt.prototype.isLast = function (index) {
    return ((index + 1) === this.length);
};

/**
 * Returns <tt>true</tt> if the array has no elements.
 * @returns {Boolean}
 */
ArrayExt.prototype.empty = function () {
    return this.length === 0;
};





// ===============

function registerExtension(orig, ext) {
    for (let k in ext)
        if (ext.hasOwnProperty(k)) {
            if (orig.hasOwnProperty(k))
                continue;

            Object.defineProperty(orig, k, {value: ext[k], writable: true});
        }

    if (ext.prototype && orig.prototype)
        registerExtension(orig.prototype, ext.prototype)
}

module.exports = {
    /**
     * Register the extensions for the given object type, or all extensions if no
     * specific type is provided. Currently only <tt>Object</tt>, <tt>Number</tt>,
     * <tt>Date</tt> and <tt>Array</tt> are supported.
     * @param {Function} [targets...]
     * The constructor function of the object to extend.
     */
    init: function (targets) {
        let args = Array.prototype.slice.call(arguments);

        if (hasType(Object))    registerExtension(Object, ObjExt);
        if (hasType(Number))    registerExtension(Number, NumExt);
        if (hasType(Array))     registerExtension(Array, ArrayExt);

        if (hasType(Date)) {
            registerExtension(Number, NumExt);
            registerExtension(Date, DateExt);
        }


        function hasType(type) {
            if (0 === args.length)
                return true;

            for (let i = 0; i < args.length; i++)
                if (args[i] === type)
                    return true;

            return false;
        }
    }
};

