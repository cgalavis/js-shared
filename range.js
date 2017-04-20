/**
 * Encapsulates list of non overlapping intervals. The interval object can be any object,
 * the extraction functions must be specified, these function return a comparable value
 * such as a string or a number. Specialized "Range' classes can be defined by providing
 * extraction function for the specific object type. The class RangeArray is an example of
 * how Range specialization.
 * @module twt/range
 * @author: Carlos Galavis <carlos@galavis.net>
 */
'use strict';

require("./proto");

// Creates an instance of 'DateRage' given two values
/**
 * The range object supports range style operations on any number of intervals. The
 * constructor takes two parameters each represent the property names of the two ends of
 * an interval object. Any object can be used as an interval as long as it supports these
 * two properties.
 * @param {string} p_from Name of the property that holds the left side of an interval.
 * @param {string] p_to Name of the property that holds the right side of the interval.
 * @constructor
 */
function Range(p_from, p_to) {
    if (undefined === p_from || undefined === p_to)
        throw new Error("Valid properties for 'from' and 'to' most be defined for the " +
            "new 'Range'");

    this.fromProp = p_from;
    this.toProp = p_to;
    this.intervals = [];
    var that = this;

    Object.defineProperty(this, "length", {
        get: function () {
            return that.intervals.length;
        },
        set: function (nvalue) {
            that.intervals.length = nvalue;
        }
    });
}

/**
 * Call this function to determine if the range is empty i.e. has no intervals.
 * @returns {boolean} True if the range has no intervals, false otherwise.
 */
Range.prototype.empty = function () {
    return this.intervals.empty();
};

/**
 * Returns the left side value of the n interval.
 * @param index Index of the interval.
 * @returns {number} Value of the left side of the range.
 */
Range.prototype.from = function (index) {
    if (index < 0 || index >= this.intervals.length)
        throw new Error("Invalid call to 'Range.from', the index is out of bounds.");

    return this.intervals[index][this.fromProp];
};

/**
 * Call this function to determine if the range is empty i.e. has no intervals.
 * @param index Index of the interval.
 * @returns {number} Value of the right side of the range
 */
Range.prototype.to = function (index) {
    if (index < 0 || index >= this.intervals.length)
        throw new Error("Invalid call to 'Range.to', the index is out of bounds.");

    return this.intervals[index][this.toProp];
};

/**
 * Converts the range to a JSON style string.
 * @returns {string} JSON string.
 */
Range.prototype.toString = function () {
    if (this.intervals.empty())
        return "(empty)";

    var res = "[ (" + this.from(0) + "," + this.to(0) + ")";

    for (var i = 1; i < this.intervals.length; ++i)
        res += ", (" + this.from(i) + "," + this.to(i) + ")";

    return res + " ]";
};

/**
 * Determines whether the value or interval is in the range. The parameters can be a
 * number, interval object or array of two values (from/to).
 * @param {number|interval|array} param Section to test for inclusion in the range.
 * @returns {boolean} True if the parameter is within the range.
 */
Range.prototype.inRange = function () {
    var from, to;
    if (1 == arguments.length) {
        if (isNaN(arguments[0])){
            var int = arguments[0];
            if (int.is(Array)) {
                from = int[0];
                to = int[1];
            }
            else {
                from = int[this.fromProp];
                to = int[this.toProp];
            }
        }
        else
            from = to = Number(arguments[0]);
    }
    else {
        from = arguments[0];
        to = arguments[1];
    }

    if (undefined === from || undefined === to)
        throw new Error("Invalid call to 'Range.inRange', the arguments must include " +
            "a valid interval.");

    for (var i = 0; i < this.intervals.length; ++i) {
        if (from > to[i])
            break;

        if (this.from(i) <= from && this.to(i) >= to)
            return true;
    }

    return false;
};

/**
 * Iterate through the intervals in the range calling 'iter_func' for every interval.
 * Iteration is interrupted when all items have been called, or when 'iter_func' returns
 * true indicating that is done.
 * @param {function} iter_func Callback function. Receives the <b>interval</b>,
 * <b>index</b< and <b>range</b> object by parameter.
 * */
Range.prototype.forEach = function (iter_func) {
    for (var i = 0; i < this.length; ++i) {
        if (iter_func(this.intervals[i], i, this))
            break;
    }
};

/**
 * Validates the given interval. If <b>array</b> it must have 2 elements and the forst
 * must be less or equal to the seconds. If <b>object</b> it must support the two interval
 * properties defined in the range and the left side (from) must be less or equal to the
 * right side (to). This function is used by other methods to verify the validity of input
 * parameters.
 * @param int Interval object or array with two elements.
 * @returns {boolean} True if the interval is valid.
 */
Range.prototype.validInterval = function (int) {
    if (int.is(Array))
        return 2 <= int.length && int[0] <= int[1];

    return (
        undefined !== int[this.fromProp] &&
        undefined !== int[this.toProp] &&
        int[this.fromProp] <= int[this.toProp]
    );
};

/**
 * Builds an interval object from the given array. The <b>from</b> and <b>to</b>
 * properties are set from the first two elements of the array.
 * @param aint
 * @returns {{}}
 */
Range.prototype.intervalFromArray = function (aint) {
    if (!this.validInterval(aint))
        throw new Error("The interval passed to 'intervalFromArray' is not valid.");

    var res = {};
    res[this.fromProp] = aint[0];
    res[this.toProp] = aint[1];

    return res;
};

/**
 * Removes all the intervals in the range.
 */
Range.prototype.clear = function () {
    this.intervals.length = 0;
};

/**
 * Adds the given interval to the range merging overlapping intervals. This methods allows
 * arrays and interval objects to be passed by parameter. Multiple intervals can be passed
 * in one call. If two numbers are passed, they are used to build a single interval.
 * @param {*} int Interval object or array.
 * @returns {Range} Returns the range to allow method chaining.
 */
Range.prototype.add = function (nint) {
    if (2 == arguments.length && !isNaN(arguments[0]) && !isNaN(arguments[1])) {
        this.add([arguments[0], arguments[1]]);
        return this;
    }

    if (1 < arguments.length) {
        for (var ai = 0; ai < arguments.length; ++ai)
            this.add(arguments[ai]);
        return this;
    }

    if (nint.is(Array))
        nint = this.intervalFromArray(nint);

    if (!this.validInterval(nint))
        throw new Error("An invalid interval '" + nint.toJSONEx() + "' was passed to " +
            "the 'add' method.");

    var from = nint[this.fromProp];
    var to = nint[this.toProp];

    // Avoid adding empty intervals
    if (from == to)
        return this;;

    for (let i = 0; i < this.length; ++i) {
        if (from <= this.to(i)) {
            // no overlap, nint is before the current interval
            if (to < this.from(i)) {
                this.intervals.splice(i, 0, nint);
                return this;
            }

            // partial left overlap
            if (to <= this.to(i)) {
                this.intervals[i][0] = nint[0];
                return this;
            }

            // right overlap or potentially multi-overlap
            if (this.from(i) < nint[this.fromProp])
                nint[this.fromProp] = this.from(i);
            this.intervals.splice(i, 1);
            this.add(nint);
            return this;
        }

    }   // for

    this.intervals.push(nint);
    return this;
};

/**
 * Subtracts the given interval from the range splitting intervals when needed. This
 * methods allows arrays and interval objects to be passed by parameter. Multiple
 * intervals can be passed in one call. If two numbers are passed, they are used to build
 * a single interval.
 * @param {*} int Interval object or array.
 * @returns {Range} Returns the range to allow method chaining.
 */
Range.prototype.subtract = function(int) {
    if (2 == arguments.length && !isNaN(arguments[0]) && !isNaN(arguments[1])) {
        this.subtract([arguments[0], arguments[1]]);
        return this;
    }

    if (1 < arguments.length) {
        for (var ai = 0; ai < arguments.length; ++ai)
            this.subtract(arguments[ai]);
        return this;
    }

    var from, to;
    if (1 == arguments.length) {
        var int = arguments[0];
        if (!this.validInterval(int))
            throw new Error("Invalid call to 'subtract', the interval '" +
                int.toJSONEx() + "' is not valid");
        if (int.is(Array)) {
            from = int[0];
            to = int[1];
        }
        else {
            from = int[this.fromProp];
            to = int[this.toProp];
        }
    }
    else if (2 == arguments.length) {
        from = arguments[0];
        to = arguments[1];
    }
    else
        throw new Error("Invalid call to 'subtract', either pass a from/to pair or an " +
            "interval object.");

    if (from > to)
        throw new Error("Invalid range passed to 'subtract', the 'from' parameter is " +
            "greater than the 'to' parameter. Make sure the parameters were passed in " +
            "the right order.");

    // If empty range, nothing to do
    if (from == to)
        return this;

    // No for or forEach loop here since some intervals may need to be removed
    var i = 0;
    while (i < this.intervals.length) {
        if (from < this.to(i)) {
            if (to <= this.from(i))
                break;  // nothing to do

            if (from > this.from(i)) {
                if (to >= this.to(i))
                    this.intervals[i][this.toProp] = from;
                else {
                    // Gotta partition this interval
                    var nint = this.intervals[i].clone();
                    nint[this.fromProp] = to;
                    nint[this.toProp] = this.to(i);
                    this.intervals[i][this.toProp] = from;
                    this.intervals.splice(i + 1, 0, nint);
                    return this;
                }
            }
            else if (to >= this.to(i)) {
                this.intervals.splice(i, 1);
                continue;
            }
            else {
                this.intervals[i][this.fromProp] = to;
                break;
            }
        }
        ++i;

    }   // while

    return this;
};

/**
 * Combines one or more ranges with this range.
 * @param range Range to be combined.
 * @returns {Range} Returns the range to allow method chaining.
 */
Range.prototype.combine = function (range) {
    if (1 < arguments.length) {
        for (var ai = 0; ai < arguments.length; ++ai)
            this.combine(arguments[ai]);
        return this;
    }

    if (!range || !range.is(Range))
        throw new Error("Invalid call to 'combine', one or more arguments are not " +
            "valid 'Range' objects.");
    this.add.apply(this, range.intervals);

    return this;
};

/**
 * Excludes one or more ranges from this range.
 * @param range Range to be excluded.
 * @returns {Range} Returns the range to allow method chaining.
 */
Range.prototype.exclude = function (range) {
    if (1 < arguments.length) {
        for (var ai = 0; ai < arguments.length; ++ai)
            this.exclude(arguments[ai]);
        return this;
    }

    if (!range || !range.is(Range))
        throw new Error("Invalid call to 'exclude', one or more arguments are not " +
            "valid 'Range' objects.");
    this.subtract.apply(this, range.intervals);

    return this;
};

/**
 * Determines whether the two ranges are equivalent.
 * @param range Range to compare with.
 * @returns {boolean} True if the two ranges are equivalent.
 */
Range.prototype.same = function (range) {
    if (range.is(Array)) {
        if (range.length != this.intervals.length)
            return false;

        for (let i = 0; i < range.length; ++i) {
            if (range[i].is(Array)) {
                if (range[i][0] != this.from(i) || range[i][1] != this.to(i))
                    return false;
            }
            else if (
                range[i][this.fromProp] != this.from(i) ||
                range[i][this.toProp] != this.to(i)
            )
                return false;
        }
        return true;
    }

    if (!range.is(Range))
        throw new Error("Range.same only accepts Arrays or Range objects");

    if (range.intervals.length != this.intervals.length)
        return false;

    for (let i = 0; i < this.intervals.length; ++i) {
        if (this.from(i) != range.from(i) || this.to(i) != range.to(i))
            return false;
    }

    return true;
};


// Specialized Ranges
function ArrayRange() {
    Range.call(this, 0, 1);
}

ArrayRange.prototype = Range.prototype;

module.exports.ArrayRange = ArrayRange;
module.exports.Range = Range;