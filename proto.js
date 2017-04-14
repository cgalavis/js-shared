"use strict";

/**
 * This file contains a list of enhancements to common JavaScript objects. This is
 * typically bad practice as some of these functions may be introduced in future versions
 * of JavaScript, but wrapping the way libraries like "moment" do compromises performance
 * since a wrapper object has to be created with a reference to the underlying object
 * instance, so here we buy the bullet and pray!!
 *
 * For the most part instance members are the ones at most risk, most of the functions
 * defined here are very unlikely to be introduced in future version of JS except perhaps
 * for single word functions such as "clone", "copy", "contains", etc. as well as some
 * of the most commonly named functions like "className", "isType", isPrimitive" etc.
 */


// =======================
// == Object Extensions ==
// =======================


let ObjExt = {};
let objExt = {};

// == Static Members ==

/**
 * Returns true of the object matches the given type. objType should be a function
 * constructor such as 'Number', 'Date', 'String', etc.
 * @memberof! Object
 * @param obj
 * @param {Function} type
 * @returns {Boolean}
 */
ObjExt.isType = function (obj, type) {
    if (undefined === obj || null === obj)
        return obj === type;

    if ("number" === typeof obj) return type === Number;
    if ("string" === typeof obj) return type === String;
    if ("boolean" === typeof obj) return type === Boolean;

    return obj instanceof type;
};

/**
 * Returns true if the given value 'val' is one of the primitive types.
 * @memberof Object
 * @param val
 * @returns {Boolean}
 */
ObjExt.isPrimitive = function (val) {
    if (undefined === val || null === val)
        return false;

    if ("object" === typeof val)
        return (
            ObjExt.isType(val, Number) ||
            ObjExt.isType(val, String) ||
            ObjExt.isType(val, Boolean)
        );

    return (
        "number" === typeof val ||
        "string" === typeof val ||
        "boolean" === typeof val
    );
};


/** Get name of the constructor function. This is used during registration to determine
 * which object is being registered.
 * @memberof! Object
 * @param {Object} obj
 */
ObjExt.className = function (obj) {
    let funcNameRegex = /function ([^(]*)/;
    let results = (funcNameRegex).exec((obj).toString());
    return (results && results.length > 1) ? results[1] : "";
};

/**
 * Clone is replaceable, copy is not since is a static method.
 * @memberof! Object
 * @param {Object} src
 * @param {Boolean} [deep]
 * @returns {Object}
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
 * Returns true of 'src' fully contains 'tgt'. The comparison is recursive so all
 * properties and children's properties of 'tgt' must also exist in 'src' and have the
 * same values.
 * @memberof! Object
 * @param {Object} src
 * @param {Object} tgt
 * @returns {Boolean}
 */
ObjExt.contains = function (src, tgt) {
    for (let k in tgt)
        if (tgt.hasOwnProperty(k)) {

            // If property is tgt missing in src, tgt is not contained
            if (!src.hasOwnProperty(k))
                return false;

            // Compare primitive, 'undefined' or 'null' tgt[k]
            if (ObjExt.isPrimitive(tgt[k]) || !tgt[k]) {
                if (tgt[k] !== src[k])
                    return false;
            }
            // Compare object tgt[k] recursively
            // If source property is not an object tgt is not contained
            else if (ObjExt.isPrimitive(src[k]) || !src[k])
                return false;
            else if (!ObjExt.contains(src[k], tgt[k]))
                return false;

        }

    return true;
};


// == Instance Members ==

/**
 * Returns true of the object matches the given type. objType should be a function
 * constructor such as 'Number', 'Date', 'String', etc.
 * @memberof! Object#
 * @param {Function} objType
 * @returns {Boolean}
 */
objExt.is = function (objType) {
    return ObjExt.isType(this, objType);
};

/**
 * @memberof Object#
 * @returns {boolean}
 */
objExt.isPrimitive = function () {
    return ObjExt.isPrimitive(this);
};

/**
 * Makes a copy of the current object. All attributes are copied including dates and
 * strings. The returned object has no common references with the original object. If the
 * optional parameter "deep" is set to true, the object is recursively cloned, all
 * aggregated objects and arrays are also cloned.
 * @memberof! Object#
 * @param deep
 * @returns {Object}
 */
objExt.clone = function (deep)
{
    return Object.copy(this, deep);
};

/**
 * Returns true of 'this' fully contains 'tgt'. The comparison is recursive so all
 * properties and children's properties of 'tgt' must also exist in this' and have the
 * same values.
 * @param {Object} tgt
 * @returns {Boolean}
 */
objExt.contains = function (tgt) {
    return ObjExt.contains(this, tgt);
};

/**
 * Merges the attributes from <b>src</b> into '<b>this</b> object. If <b>replace</b> is
 * true, all overlapping attributes are replaced.
 * NOTE: Recursion when cloning the Date object fails on return, who knows why... try it
 * if you don't believe me :)
 * @memberof! Object#
 * @param src
 * @param replace
 * @param deep
 * @returns {Object}
 */
objExt.merge = function (src, replace, deep)
{
    if (undefined === src || null === src)
        return this;

    if (undefined === deep)
        deep = true;

    for (let attr in src) {
        if (src.hasOwnProperty(attr)) {
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
 * @memberof! Object#
 * @returns {string}
 */
objExt.className = function () {
    return ObjExt.className((this).constructor);
};


// =======================
// == Number Extensions ==
// =======================

let NumExt = {};
let numExt = {};

// == Static Members ==


// == Instance Members ==

/**
 * Rounds the number <b>this</b> to the given integer amount.
 * @memberof! Number#
 * @param {Number} amount
 * @returns {Number}
 */
numExt.roundToInt = function (amount) {
    return Math.round(this / amount) * amount;
};

/**
 * Truncates the number <b>this</b> to the given integer amount.
 * @memberof! Number#
 * @param {Number} amount
 * @returns {number}
 */
numExt.truncToInt = function (amount) {
    return Math.floor(this / amount) * amount;
};

/**
 * Calculates the next closest power of 2 number.
 * @memberof! Number#
 * @returns {Number}
 */
numExt.nextPow2 = function () {
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
 * @memberof! Number#
 * @returns {Number}
 */
numExt.prevPow2 = function () {
    return Number(Math.floor(this) + 1).nextPow2() >> 1;
};

/**
 * Returns a string pre-appending any necessary 0s to reach the given width
 * @memberof! Number#
 * @param {Number} width
 * @returns {String}
 */
numExt.zeroPadd = function (width) {
    let num_str = this.toString();
    let len = width - num_str.length;
    for (let i = 0; i < len; ++i)
        num_str = "0" + num_str;
    return num_str;
};

/**
 * Assumes the input is in milliseconds (straight from dateExt.getTime)
 * Format Specs:
 *      h[h]    = hours
 *      m[m]    = minutes
 *      s[s]    = seconds
 *      f       = hundreds of a second
 *      ff      = tens of a seconds
 *      fff     = milliseconds
 * Text enclosed within {} brackets is excluded from substitution however the brackets
 * are removed. To preserve the braces use double braces: {{test}} = {test}
 * @memberof! Number#
 * @param {String} [format]
 * @returns {String}
 */
numExt.toTime = function (format) {
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

            openSplit[0] = openSplit[0].replace("hh", hours.zeroPadd(2));
            openSplit[0] = openSplit[0].replace("h", hours);

            openSplit[0] = openSplit[0].replace("mm", minutes.zeroPadd(2));
            openSplit[0] = openSplit[0].replace("m", minutes);

            openSplit[0] = openSplit[0].replace("ss", seconds.zeroPadd(2));
            openSplit[0] = openSplit[0].replace("s", seconds);

            openSplit[0] = openSplit[0].replace("fff", millis.zeroPadd(3));
            openSplit[0] = openSplit[0].replace("ff", tens_of_millis.zeroPadd(2));
            openSplit[0] = openSplit[0].replace("f", hundreds_of_millis.zeroPadd(1));

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
 * @memberof! Number#
 * @returns {string}
 */
numExt.toEnum = function () {
    let val = Math.abs(Number(this));
    if (1 == val) return this + "st";
    if (2 == val) return this + "nd";
    if (3 == val) return this + "rd";
    return this + "th";

};

/**
 * Returns true if the number is within the given range. By default the range is
 * interpreted as a close range, passing 'inclusive = false' will make it an open range.
 * @memberof! Number#
 * @param first
 * @param second
 * @param inclusive
 * @returns {boolean}
 */
numExt.between = function (first, second, inclusive)
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

let DateExt = {};
let dateExt = {};

// == Static Members ==

/**
 * <pre>
 * Formats the given date "dt" using the formatting specifications in fstr. The following
 * formatting tokens apply:
 *      1) Year:    yyyy    = four digit year, yy = two digit year
 *      2) Month:   MM      = two digit month, M = single digit month (when less than 10)
 *      3) Day:     dd      = two digit day, d = single digit day (when less than 10
 *      4) Hours:   hh      = two digit hour, h = single digit hour
 *      5) Minutes: mm      = two digit minutes, m = single digit minute
 *      6) Second:  ss      = two digit seconds, s = single digit seconds
 *      7) Millis:  z       = milliseconds, always 3 digit number
 *
 * Day:         d, dd, ddd, dddd
 * Month:       M, MM, MMM, MMMM
 * Year:        y, yy, yyy, yyyy
 *
 * Hour:        h, hh, H, HH
 * Minute:      m, mm
 * Second:      s, ss
 * Seq. Fraq:   f, ff, fff
 * Timezone:    K
 * AM/PM:       t, tt

 * Use the "{" and "}" brackets to enclose text where date substitution should be avoided.
 * </pre>
 *
 * @memberof! Date
 * @param {Date} dt
 * @param {String} fstr
 * @param {Function} [replacer] Optional function to replace the date/time tokens. If
 * 'null' not value is returned the default substitution is used.
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
            (dt.getMonth() + 1).zeroPadd(2));
        openSplit[0] = openSplit[0].replace("M", replacer(dt, "M") ||
            (dt.getMonth() + 1));

        openSplit[0] = openSplit[0].replace("dd", replacer(dt, "dd") ||
            dt.getDate().zeroPadd(2));
        openSplit[0] = openSplit[0].replace("d", replacer(dt, "d") ||
            dt.getDate());

        openSplit[0] = openSplit[0].replace("HH", replacer(dt, "HH") ||
            dt.getHours().zeroPadd(2));
        openSplit[0] = openSplit[0].replace("H", replacer(dt, "H") ||
            dt.getHours());
        openSplit[0] = openSplit[0].replace("hh", replacer(dt, "hh") ||
            h12.zeroPadd(2));
        openSplit[0] = openSplit[0].replace("h", replacer(dt, "h") ||
            h12);

        openSplit[0] = openSplit[0].replace("mm", replacer(dt, "mm") ||
            dt.getMinutes().zeroPadd(2));
        openSplit[0] = openSplit[0].replace("m", replacer(dt, "m") ||
            dt.getMinutes());

        openSplit[0] = openSplit[0].replace("ss", replacer(dt, "ss") ||
            dt.getSeconds().zeroPadd(2));
        openSplit[0] = openSplit[0].replace("s", replacer(dt, "s") ||
            dt.getSeconds());

        openSplit[0] = openSplit[0].replace("fff", replacer(dt, "fff") ||
            millis.zeroPadd(3));
        openSplit[0] = openSplit[0].replace("ff", replacer(dt, "ff") ||
            tens_of_millis.zeroPadd(2));
        openSplit[0] = openSplit[0].replace("f", replacer(dt, "f") ||
            hundreds_of_millis.zeroPadd(1));

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

            openSplit[0] = openSplit[0].replace("tt", "{" + (replacer(dt, "tt") ||
                (pm ? "PM" : "AM")) + "}");
            openSplit[0] = openSplit[0].replace("t", "{" + (replacer(dt, "t") ||
                (pm ? "P" : "A")) + "}");

            openSplit[0] = openSplit[0].replace("MMMM", "{" + (replacer(dt, "MMMM") ||
                month[dt.getMonth()]) + "}");
            openSplit[0] = openSplit[0].replace("MMM", "{" + (replacer(dt, "MM") ||
                month_short[dt.getMonth()]) + "}");

            openSplit[0] = openSplit[0].replace("dddd", "{" + (replacer(dt, "dddd") ||
                dow[dt.getDay()]) + "}");
            openSplit[0] = openSplit[0].replace("ddd", "{" + (replacer(dt, "ddd") ||
                dow_short[dt.getDay()]) + "}");

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
 * Returns true if the two dates point to the same day
 * @memberof! Date
 * @param date1
 * @param date2
 * @returns {boolean}
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
 *      let len = DateExt.formatLength("yyyy/mm/dd");  // len = 10
 *      let len = DateExt.formatLength("yyy/m/d");     // len = 10
 * @memberof! Date
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
 * Returns copy of <b>this</b> and adds <b>y</b> number of years to it.
 * @memberof! Date#
 * @param y
 * @returns {Date}
 */
dateExt.addYears = function (y)
{
    if (isNaN(y)) y = 1;
    return new Date(
        this.getFullYear() + y, this.getMonth(), this.getDate(),
        this.getHours(), this.getMinutes(), this.getSeconds(), this.getMilliseconds()
    );
};

/**
 * Adds <b>y</b> number of years to <b>this</b> and returns it to allow method chaining.
 * @memberof! Date#
 * @param y
 * @returns {Date}
 */
dateExt.incYear = function (y)
{
    if (isNaN(y)) y = 1;
    this.setFullYear(this.getFullYear() + y);
    return this;
};

/**
 * Returns copy of <b>this</b> and adds <b>m</b> number of months to it.
 * @memberof! Date#
 * @param m
 * @returns {Date}
 */
dateExt.addMonths = function (m)
{
    if (isNaN(m)) m = 1;
    let res = new Date(this.getTime());
    res.setMonth(res.getMonth() + m);
    return res;
};

/**
 * Adds <b>m</b> number of months to <b>this</b> and returns it to allow method chaining.
 * @memberof! Date#
 * @param m
 * @returns {Date}
 */
dateExt.incMonth = function (m)
{
    if (isNaN(m)) m = 1;
    this.setMonth(this.getMonth() + m);
};

/**
 * Returns copy of <b>this</b> and adds <b>d</b> number of days to it.
 * @memberof! Date#
 * @param d
 * @returns {Date}
 */
dateExt.addDays = function (d)
{
    if (isNaN(d)) d = 1;
    return new Date(this.getTime() + (d * 36e5 * 24));
};

/**
 * Adds <b>d</b> number of days to <b>this</b> and returns it to allow method chaining.
 * @memberof! Date#
 * @param d
 * @returns {Date}
 */
dateExt.incDay = function (d)
{
    if (isNaN(d)) d = 1;
    this.setTime(this.getTime() + (d * 36e5 * 24));
};

/**
 * Returns copy of <b>this</b> and adds <b>h</b> number of hours to it.
 * @memberof! Date#
 * @param h
 * @returns {Date}
 */
dateExt.addHours = function (h)
{
    if (isNaN(h)) h = 1;
    return new Date(this.getTime() + (h * 36e5));
};

/**
 * Adds <b>h</b> number of hours to <b>this</b> and returns it to allow method chaining.
 * @memberof! Date#
 * @param h
 * @returns {Date}
 */
dateExt.incHour = function (h)
{
    if (isNaN(h)) h = 1;
    this.setTime(this.getTime() + (h * 36e5));
};

/**
 * Returns copy of <b>this</b> and adds <b>m</b> number of minutes to it.
 * @memberof! Date#
 * @param m
 * @returns {Date}
 */
dateExt.addMinutes = function (m)
{
    if (isNaN(m)) m = 1;
    return new Date(this.getTime() + (m * 6e4));
};

/**
 * Adds <b>m</b> number of minutes to <b>this</b> and returns it to allow method chaining.
 * @memberof! Date#
 * @param m
 * @returns {Date}
 */
dateExt.incMinute = function (m)
{
    if (isNaN(m)) m = 1;
    this.setTime(this.getTime() + (m * 6e4));
};

/**
 * Returns copy of <b>this</b> and adds <b>s</b> number of seconds to it.
 * @memberof! Date#
 * @param s
 * @returns {Date}
 */
dateExt.addSeconds = function (s)
{
    if (isNaN(s)) s = 1;
    return new Date(this.getTime() + (s * 1000));
};

/**
 * Adds <b>s</b> number of seconds to <b>this</b> and returns it to allow method chaining.
 * @memberof! Date#
 * @param s
 * @returns {Date}
 */
dateExt.incSecond = function (s)
{
    if (isNaN(s)) s = 1;
    return this.setTime(this.getTime() + (s * 1000));
};

/**
 * Returns copy of <b>this</b> and adds <b>ms</b> number of milliseconds to it.
 * @memberof! Date#
 * @param ms
 * @returns {Date}
 */
dateExt.addMillis = function (ms)
{
    if (isNaN(ms)) ms = 1;
    return new Date(this.getTime() + ms);
};

/**
 * Adds <b>ms</b> number of milliseconds to <b>this</b> and returns it to allow method
 * chaining.
 * @memberof! Date#
 * @param ms
 * @returns {Date}
 */
dateExt.incMilli = function (ms)
{
    if (isNaN(ms)) ms = 1;
    return this.setTime(this.getTime() + ms);
};

/**
 * Returns the difference between <b>this</b> and <b>date</b> in the given units
 * (milliseconds by default). Supported units are: "day/d", "hour/h", "minute/m",
 * "second/s", "millisecond/fff"
 * @memberof! Date#
 * @param date
 * @param units
 * @returns {number}
 */
dateExt.diff = function (date, units)
{
    if (!ObjExt.isType(date, Date))
        throw new Error("Invalid call to 'Date.diff', the input is not " +
            "a data.");
    if (!units)
        units = "fff";

    if (units == "fff" || units == "millisecond")
        return Math.floor(Math.abs(date.getTime() - this.getTime()));

    if (units == "s" || units == "second")
        return Math.floor(Math.abs(date.getTime() - this.getTime()) / 1000);

    if (units == "m" || units == "minute")
        return Math.floor(Math.abs(date.getTime() - this.getTime()) / 6e4);

    if (units == "h" || units == "hour")
        return Math.floor(Math.abs(date.getTime() - this.getTime()) / 36e6);

    if (units == "d" || units == "day")
        return Math.floor(Math.abs(date.getTime() - this.getTime()) / (36e6 * 24));
};

/**
 * Returns a new date object representing the same date/time but in UTC. This is a nasty
 * hack since the returned date still shows the local timezone (no way to change this as
 * far as I know), however it is very convenient to be able to operate on a Date that's
 * already adjusted.
 * @memberof! Date#
 * @returns {Date}
 */
dateExt.toUtc = function ()
{
    return new Date(this.getTime() + this.getTimezoneOffset() * 60000);
};


/**
 // Formats the date with the given specification. See <b>Date.format</b> for more detail.
 * @memberof! Date#
 * @param {String} fstr
 * @param {Function} [replacer] Optional function to replace the date/time tokens.
 * @returns {string}
 */
dateExt.format = function (fstr, replacer)
{
    return DateExt.format(this, fstr, replacer);
};

/**
 * Returns true if <b>this</b> and <b>date</b> point to the same day.
 * @memberof! Date#
 * @param date
 * @returns {boolean}
 */
dateExt.sameDay = function (date)
{
    return DateExt.sameDay(this, date);
};

/**
 * Returns true if <b>this</b> day is earlier than <b>date</b> ignoring the time.
 * @memberof! Date#
 * @param date
 * @returns {boolean}
 */
dateExt.earlierDayThan = function (date)
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
 * @memberof! Date#
 * @param date
 * @returns {boolean}
 */
dateExt.laterDayThan = function (date)
{
    return date.earlierDayThan(this);
};

dateExt.truncTime = function () {
    this.setHours(0, 0, 0, 0);
    return this;
};


// ======================
// == Array Extensions ==
// ======================

let arrayExt = {};

// == Instance Members ==

/**
 * Returns the first element in the array. The optional offset parameter can be used to
 * iterate through the array from first to last.
 * @memberof! Array#
 * @param offset
 * @returns {*}
 */
arrayExt.first = function (offset)
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
 * @memberof! Array#
 * @param offset
 * @returns {*}
 */
arrayExt.last = function (offset)
{
    if (!offset)
        offset = 0;

    if (this.length <= offset)
        return null;

    return this[this.length - 1 - offset];
};

/**
 * Returns 'true' if the array has no elements
 * @memberof! Array#
 * @returns {boolean}
 */
arrayExt.empty = function ()
{
    return this.length == 0;
};


function registerExtension(orig, ext)
{
    for (let k in ext)
        if (ext.hasOwnProperty(k))
        {
            if (orig.hasOwnProperty(k))
                continue;

            Object.defineProperty(orig, k, { value: ext[k], writable: true });
        }
}

registerExtension(Object.prototype, objExt);
registerExtension(Object, ObjExt);
registerExtension(Number.prototype, numExt);
registerExtension(Number, NumExt);
registerExtension(Date.prototype, dateExt);
registerExtension(Date, DateExt);
registerExtension(Array.prototype, arrayExt);
