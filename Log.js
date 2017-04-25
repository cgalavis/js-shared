/**
 * This module is part of the Crabel core library. The 'Log' module exports a class
 * that encapsulates the usage and management of log files. The <tt>Log</tt> class can be
 * used directly to access the global log object, this object must first be defined via
 * the <tt>setGlobal</tt> function, then it can be used by any other source file directly
 * after requiring the module.<br><br>
 *
 * The <b>Log</b> class supports 3 modes for log file management, these are:
 *  <ul>
 *      <li>
 *          <u>Append</u>: New log messages are appended to an existing
 *          log file.
 *      </li>
 *      <li>
 *          <u>Replace</u>: Existing log files are overwritten.
 *      </li>
 *      <li>
 *          <u>Unique</u>: A unique name is synthesized by appending a
 *          two digit number.
 *      </li>
 *      <li>
 *          <u>Unique-Pre</u>: A unique name is synthesized by
 *          pre-pending a two digit number.
 *      </li>
 *  </ul>
 *
 * The <tt>Log</tt> class supports several types for messages including: <tt>text</tt>,
 * <tt>err</tt>, <tt>war</tt>, <tt>info</tt> and <tt>trace</tt>. These message types form
 * a hierarchy of visibility controlled by the <tt>Log.level</tt> property. Messages can
 * be logged using one of the built-in functions <tt>Log.out</tt>, <tt>Log.err</tt>,
 * <tt>Log.warn</tt>, <tt>Log.info</tt> and <tt>Log.trace</tt>. If the <tt>Log.level</tt>
 * property is set to <tt>eventType.info</tt> (the default), <tt>eventType.trace</tt>
 * messages are excluded from the log file or console.
 *
 * @example
 * // Attach a global 'Log' instance and output a 'Log.eventType.info' message.
 *
 * let Log = require("@crabel/shared/Log");
 * Log.setGlobal(new Log());
 *
 * log.info("Hello world!");
 *
 * @module @crabel/shared/Log
 * @author: Carlos Galavis <carlos@galavis.net>
*/

"use strict";

const fs = require("fs");
const path = require("path");
const os = require("os");
const EventEmitter = require('events');
const util = require('util');
const wrap = require("word-wrap");
const colors = require("colors");
//
require("./proto.js").init();
let str_util = require("./str_util");
let fs_util = require("./fs_util");

//

let global_log = null;


/**
 * @typedef {Object} Column
 * @property {Number|String} width
 * @property {String} align
 */

/**
 * @typedef {Object} Table
 * @property {Array.<TableColumn>} [columns]
 * @property {Array.<String|Array.<String>>} rows
 */

/**
 * @typedef {Object} LogOptions
 * 
 * @property {String|Undefined} [caption]
 * Optional caption used when echoing log messages.
 * 
 * @property {String|Undefined} [path]
 * (def=__dirname) Path were log files are stored.
 * 
 * @property {String|Undefined} [name]
 * (def=baseName(__filename)) Base name of the log file, the '.log' extension is appended 
 * as well as a two digit index is mode is 'unique'.
 * 
 * @property {Log.mode|String|Undefined} [mode]
 * (def=Log.defMode) Can be 'append', 'replace', 'unique' or 'unique_pre'.
 * 
 * @property {Boolean|Undefined} [echo]
 * (def=true) If true, logged messages are echoed to the console.
 * 
 * @property {Log.eventType|String|Undefined} [level]
 * (def=Log.eventType.info) Logging level. Events with higher precedence are ignored 
 * (not logged).
 * 
 * @property {String|Undefined} [timeFormat]
 * (def=defTimeFormat) Format string use to convert event timestamps to string.
 * 
 * @property {Object|Undefined} [typeLabels]
 * (def=defTypeLabels) Labels use to identify the type of event logged.
 *
 * @property {String|Undefined} [separator]
 * (def=defSeparator) Separator between log entry components.
 *
 * @property {Table|Array.<String>|String|Undefined} [header]
 * (def=defHeader) Header added to the log when the log object is created.
 * 
 * @property {Number|Undefined} [lineWidth]
 * (def=90) Maximum line width.
 * 
 * @property {String|Undefined} [line_style]
 * (def="none") Style use to format lines of an event message, possible values are:
 * ["wrap", "trunc", "none"].
 */

/**
 * @typedef {Object} Event
 * @property {Date} timestamp
 * @property {Number} type
 * @property {String} message
 * @property {Boolean} ignored
 */

/**
 * @callback LogCallback
 * @param {Error|null} err
 * @param {Event} [event] Original event
 * @param {String} [fmsg] Formatter message.
 */

/**
 * Creates a <b>Log</b> object to handle logging to a file and/or the standard output
 * stream.
 * @param {LogOptions} [options]
 * @param {Object} [subst_obj] Any Object used for string substitution.
 * stream.
 * @constructor
 */
function Log(options, subst_obj)
{
    if (!options)
        options = {};

    if (!options.path)
        options.path = __dirname;

    if (!options.name)
        options.name = fs_util.swapExt(path.basename(__filename), ".log");

    let self = this;
    if (undefined === options.mode)
        options.mode = Log.defMode;
    if (isNaN(options.mode))
        options.mode = Log._modeFromStr(options.mode);

    if (undefined === options.echo)
        options.echo = Log.defEcho;

    if (undefined === options.level)
        options.level = Log.eventType.info;
    if (isNaN(options.level))
        options.level = Log._levelFromStr(options.level);

    if (!options.timeFormat)
        options.timeFormat = Log.defTimeFormat;

    if (!options.typeLabels)
        options.typeLabels = Log.defTypeLabels;

    if (!options.separator)
        options.separator = Log.defSeparator;

    if (undefined === options.header)
        options.header = Log.defHeader.clone(true);
    
    if (!options.line_style)
        options.line_style = "none";

    if (Object.isType(subst_obj, Object))
        this.substObj = subst_obj;
    else
        this.substObj = null;

    if (Log.mode.append > options.mode || Log.mode.unique_pre < options.mode)
        throw new Error("Invalid call to 'Log' contructore, the mode is invalid. Use " +
            "one of the values in 'Log.mode'.");

    /**
     * Caption used to identify log entries when echoing to the console.
     * @type {String}
     */
    this.caption = options.caption;
    
    /**
     * Path where the logfile is to be created.
     * @type {String}
     */
    this.path = options.path;

    /**
     * Name of the log file. Does not need to include the '.log' extension, this will be
     * added when constructing the file name.
     * @type {String}
     */
    this.name = options.name;

    /**
     * Indicates whether logged messages are echoed to the standard output stream.
     * @type {Boolean}
     * @default false
     */
    this.echo = options.echo || false;

    /**
     * Log file mode. Indicates whether to append, replace or create a unique log file.
     * @type {Log.mode}
     * @default Log.mode.append
     */
    this.mode = options.mode;

    /**
     * Logging level. Any messages with event type greater than <b>level</b> are not
     * logged.
     * @type {Log.eventType}
     */
    this.level = options.level;

    /**
     * Format of the timestamp added to log messages. For information on the format used
     * see the Date.format documentation.
     * @type {string}
     * @default YYYYMMDD hhmmss.fff
     */
    this.timeFormat = options.timeFormat;

    /**
     * Levels use to identify the event type
     * @type {{err: string, warn: string, info: string, trace: string}}
     * @default { err: "[e]", warn: "[W]", info: "[I]", trace: "[T]" }
     */
    this.typeLabels = options.typeLabels;

    /**
     * Separator between log netry components.
     * @type {String}
     * @default "-"
     */
    this.separator = options.separator;

    /**
     * Maximum number of characters per line.
     * @type {Number}
     */
    this.lineWidth = options.lineWidth || Log.defLineWidth;

    if ("wrap" === options.line_style)
        this.formatLine = function (text, indent) {
            // Here '==' is used instead of '===' purposely to make the call more robust
            if (isNaN(indent) || 0 == indent)
                return wrap(text, { width: self.lineWidth });
            
            let indent_str = str_util.fill(Number(indent));

            /**
             * @type {String}
             */
            let line = wrap(text, { width: self.lineWidth - indent, indent: indent_str });
            return line.substring(indent);
        };
    else if ("trunc" === options.line_style)
        this.formatLine = function (text) {
            return text.substring(0, self.lineWidth);
        };
    else
        this.formatLine = function (text) {
            return text;
        };
    
    /**
     * Absolute path of the log file.
     * @type {string}
     */
    this.file_name = Log._makeLogFileName(this.path, this.name, this.mode);

    if (Log.mode.replace == this.mode)
        if (fs_util.exists(this.file_name))
            fs_util.erase(this.file_name);

    let file_options = {
        flags: 'w',
        defaultEncoding: 'utf8',
        autoClose: true
    };

    if (Log.mode.append == this.mode)
        file_options.flags = "a";

    /**
     * Don't use this object directly, it is used by the logging API to interact with the
     * log file.
     * @type {WriteStream}
     */
    this.file = fs.createWriteStream(this.file_name, file_options);

    if (fs.exists(this.file_name)) {
        let stats = fs.statSync(this.file_name);
        if(0 < stats["size"])
            this.file.write(os.EOL);
    }

    /**
     * Number of events pending to be processed. 
     * WARNING: This property is for internal use only, it can be read but should not be
     * modified or the event system will get out of sync.
     * @type {Number}
     */
    this.pendingEvents = 0;

    // Output the header
    if (options.header.is(String))
        options.header = [ options.header ];

    if (options.header.is(Array)) {
        let res = "";
        options.header.forEach(function (h) {
            if (Object.isType(h, String)) {
                if ("=" === h || "-" === h || "*" === h)
                    res += str_util.fill(self.lineWidth, h) + os.EOL;
                else
                    res += self.formatLine(_applySubst(self, h)) + os.EOL;
            }
        });
        self.file.write(res);
    }
}   // Log()

// Overwrites the prototype so must be called before prototype functions are added.
util.inherits(Log, EventEmitter);

/**
 *
 * @param {String} msg
 * @param {Log.eventType} type
 * @constructor
 */
function LogEntry(msg, type) {
    this.message = msg;
    this.type = type;
    this.ts = new Date();
}

LogEntry.prototype.toFormattedString = function () {
    if (Log.eventType.text === this.type)
        return this.type.color(this.message);

    if (LogType.todo === this.type)
        return this.type.color("TODO : " + this.message);

    return util.format(
        "%s -%s- %s",
        util.date_time.format(this.ts, false, "", ""),
        this.type.color(this.type.label),
        this.type.color(this.message)
    );
};

LogEntry.prototype.toString = function () {
    if (LogType.text === this.type)
        return this.message;

    if (LogType.todo === this.type)
        return "TODO : " + this.message;

    return util.format(
        "%s -%s- %s",
        util.date_time.format(this.ts, false, "", ""),
        this.type.label,
        this.message
    );
};



/**
 * Default log header. Log headers support the following substitution token:
 * 1) {{log.mode}} : Mode in which the log is being initialized (append, replace,
 *    unique, unique_pre)
 * 2) {{log.file}} : Name of the log file being used for logging.
 * 3) {{log.level}} : Maximum event level/type being logged (err, warn, info,trace).
 * 4) {{log.echo}} : on/off value indicating whether echo us enbled or not.
 * 5) {{date.now[,format]}} : String representing the current date and time. Optionally a
 *    formatting string
 * can be provided.
 * @private
 */
Log.defHeader = [
    "=",
    "-Running log agent in '{{log.mode}}' mode-",
    "-Log file: {{log.file_name}}-",
    "-Initialized on {{date}}-",
    "="
];

/**
 * Default value when the 'echo' parameter is not provided.
 * @private
 */
Log.defEcho = true;

/**
 * Available modes for the Log object.
 * @readonly
 * @enum {number}
 */
Log.mode = {
    /** Append to the log file if it exists. */
    append: 0,
    /** Replace the log file if it exists */
    replace: 1,
    /** Create a new log file with a unique name */
    unique: 2,
    /** Create a new log file with a unique name with index being prefixed */
    unique_pre: 3
};

/**
 * Types of events /messages supported by the Log object. Which messages get actually
 * logged can be specified by setting the <b>level</b> property to one of these values,
 * all event types presiding the value of <b>level</b> are logged.
 * @readonly
 * @enum {number}
 */
Log.eventType = {
    // Simple text messages. The timestamp and event type indicator are not included
    text: -99,
    // Error message. A timestamp and error label (TypeLabel.err) are pre-pended to the
    // message
    err: -1,
    // Warning message. A timestamp and warning label (TypeLabel.warn) are pre-pended to
    // the message
    warn: 0,
    // Informational message. A timestamp and information label (TypeLabel.info) are
    // pre-pended to the message
    info: 1,
    // Trace message use when debugging the process. A timestamp and information label
    // (TypeLabel.info) are pre-pended to the message. Trace messages are omitted from the
    // log file by default, to enable then set the <b>Log.prototype.level</b> to
    // <b>Log.eventType.trace</b>.
    trace: 2,
    //
    unknown: 99
};

/**
 * Default labels used when creating new <b>Log</b> instances or using the <b>Log</b>
 * static methods without a global log instance. This static `property can be used to
 * change the event type labels of every new <b>Log</b> instance that is creates. It is
 * generally recommended to change this property and not the instance property in order
 * to provide a consistent look between log files of the same application.
 * @private
 */
Log.defTypeLabels = {
    err: "[E]",
    warn: "[W]",
    info: "[I]",
    trace: "[T]"
};

/**
 * Default separator between log entry components.
 * @private
 */
Log.defSeparator = "-";

/**
 * Default format of the timestamp added to log messages, this value is assigned to new
 * instances of the <b>Log</b> object. For information on the format used see the
 * Date.format documentation. This static `property can be used to change the time format
 * of every new <b>Log</b> instance that is creates. It is generally recommended to
 * change this property and not the instance property in order to * provide a consistent
 * look between log files of the same application.
 * @private
 */
Log.defTimeFormat = "yyyyMMdd HHmmss.fff";

/**
 * Default value for log mode.
 * @private
 */
Log.defMode = Log.mode.append;

/**
 * Default number of characters per line.
 * @private
 */
Log.defLineWidth = 100;

Log.modeStr = {};
Log.modeStr[Log.mode.append] = "append";
Log.modeStr[Log.mode.replace] = "replace";
Log.modeStr[Log.mode.unique] = "unique";
Log.modeStr[Log.mode.unique_pre] = "unique_pre";

Log.eventTypeStr = {};
Log.eventTypeStr[Log.eventType.text] = "text";
Log.eventTypeStr[Log.eventType.err] = "err";
Log.eventTypeStr[Log.eventType.warn] = "warn";
Log.eventTypeStr[Log.eventType.info] = "info";
Log.eventTypeStr[Log.eventType.trace] = "trace";

/**
 * Returns the Log.mode value from the given string.
 * @param {String} mode_str
 * @returns {Log.mode}
 * @private
 */
Log._modeFromStr = function (mode_str) {
    for (let key in Log.mode) {
        if (Log.mode.hasOwnProperty(key))
            if (key === mode_str)
                return Log.mode[key];
    }
    return Log.defMode;
};

/**
 * Returns the Log.eventType value from the given string.
 * @param {String} event_type_str
 * @returns {Log.eventType}
 * @private
 */
Log._eventTypeFromStr = function (event_type_str) {
    for (let key in Log.eventType) {
        if (Log.eventType.hasOwnProperty(key))
            if (key === event_type_str)
                return Log.eventType[key];
    }
    return Log.eventType.unknown;
};

/**
 * Returns the Log.eventType value from the given string.
 * @param {String} level_str
 * @returns {Log.eventType}
 * @private
 */
Log._levelFromStr = function (level_str) {
    return Log._eventTypeFromStr(level_str);
};

/**
 * Builds a log file name with the given name and path. The methods adds the ".log"
 * extension if necessary. If using a unique mode, this function calls the
 * <b>file.makeUnique</b> method to ensure the file name is unique, this method pre-pends
 * a two digit number starting from 00 and incrementing until a file with the same name
 * is not found <tt>_makeLogFileName</tt> ensures that the path leading to the log file
 * exists by calling <b>path.ensure</b>.
 * @param {String} dir
 * Directory where log files are to be stored.
 * @param {String} name
 * Base name of the log file.
 * @param {Log.mode} mode
 * Log file handling specifications, can be <tt>Log.mode.append</tt>,
 * <tt>Log.mode.replace</tt>, <tt>Log.mode.unique</tt> and <tt>Log.mode.unique_pre</tt>.
 * @returns {string} Returns the full name of the log file.
 * @private
 */
Log._makeLogFileName = function (dir, name, mode) {
    let file_name = path.join(dir, name);
    if ("" === path.extname(file_name))
        file_name += ".log";

    if (Log.mode.unique === mode)
        file_name = fs_util.makeUnique(file_name, false);
    else if (Log.mode.unique_pre === mode)
        file_name = fs_util.makeUnique(file_name, true);

    fs_util.ensurePath(path.dirname(file_name));
    return file_name;
};

/**
 * Gets <u>global log instance</u>. If <tt>log_instance</tt> is passed, is is set as the
 * global instance allowing the use of the <tt>Log</tt> class static methods from any
 * JavaScript file that requires this module. If no instance is passed and the global
 * instance is not set, a new instance of <tt>Log</tt> is created with the default
 * arguments.
 * @param {LogOptions|Log} [options_or_log]
 * Instance of <b>Log</b> to be used as the <u>global log instance</u>.
 * @returns {Log}
 * Returns the global instance.
 */
Log.global = function (options_or_log) {
    if (options_or_log instanceof Log)
        global_log = options_or_log;
    else if ("object" === (typeof options_or_log))
        global_log = new Log(options_or_log); // Is options object
    else if (!global_log)
        global_log = new Log();

    return global_log;
};

/**
 * Outputs a message to the log file and/or standard output stream without timestamp or
 * message type indicators, the message is logged using the <u>global log instance</u>.
 * @param {string} msg The message to send to the log file and/or console.
 * @param {LogCallback} [cb] Optional callback function. If provided, it will make the
 * call after the log entry is logged.
 * @param {...*} [subst] Optional list of substitution arguments.
 * When present, the method formats the message using either
 * {@link module:@crabel/shared/str_util~format str_util.format} or
 * {@link module:@crabel/shared/str_util~expand str_util.expand} depending on whether a
 * {@link module:@crabel/shared/str_util~substCallback substCallback} was provided.
 */
Log.out = function (msg, cb, subst) {
    return _log.apply(null, _buildArgs(global_log || null, Log.eventType.text, arguments));
};

/**
 * Outputs an error message to the log file and/or standard output stream. The timestamp
 * and event type label are pre-pended to the given message. The timestamp can be
 * customized via the Log.timeFormat property; the event type label can be customized via
 * the 'Log.TypeLabel' property. The message is logged using the
 * <u>global log instance</u>.
 * @param {String} msg The message to send to the log file and/or console.
 * @param {LogCallback} [cb] Optional callback function. If provided, it will make the call
 * after the log entry is logged.
 * @param {...*} [subst] Optional list of substitution arguments.
 * When present, the method formats the message using either
 * {@link module:@crabel/shared/str_util~format str_util.form} or
 * {@link module:@crabel/shared/str_util~expand str_util.expand} depending on whether a
 * {@link module:@crabel/shared/str_util~substCallback substCallback} was provided.
 */
Log.err = function (msg, cb, subst) {
    return _log.apply(null, _buildArgs(global_log || null, Log.eventType.err, arguments));
};

/**
 * Outputs a warning message to the log file and/or standard output stream. The timestamp
 * and event type label are pre-pended to the given message. The timestamp can be
 * customized via the Log.timeFormat property; the event type label can be customized via
 * the 'Log.TypeLabel' property. The message is logged using the
 * <u>global log instance</u>.
 * @param {string} msg The message to send to the log file and/or console.
 * @param {LogCallback} [cb] Optional callback function. If provided, it will make the
 * call after the log entry is logged.
 * @param {...*} [subst] Optional list of substitution arguments.
 * When present, the method formats the message using either
 * {@link module:@crabel/shared/str_util~format str_util.format} or
 * {@link module:@crabel/shared/str_util~expand str_util.expand} depending on whether a
 * {@link module:@crabel/shared/str_util~substCallback substCallback} was provided.
 */
Log.warn = function (msg, cb, subst) {
    return _log.apply(null, _buildArgs(global_log || null, Log.eventType.warn, arguments));
};

/**
 * Outputs an informational message to the log file and/or standard output stream. The
 * timestamp and event type label are pre-pended to the given message. The timestamp can
 * be customized via the Log.timeFormat property; the event type label can be customized
 * via the 'Log.TypeLabel' property. The message is logged using the
 * <u>global log instance</u>.
 * @param {string} msg The message to send to the log file and/or console.
 * @param {LogCallback} [cb] Optional callback function. If provided, it will make the
 * call after the log entry is logged.
 * @param {...*} [subst] Optional list of substitution arguments.
 * When present, the method formats the message using either
 * {@link module:@crabel/shared/str_util~format str_util.format} or
 * {@link module:@crabel/shared/str_util~expand str_util.expand} depending on whether a
 * {@link module:@crabel/shared/str_util~substCallback substCallback} was provided.
 */
Log.info = function (msg, cb, subst) {
    return _log.apply(null, _buildArgs(global_log || null, Log.eventType.info, arguments));
};

/**
 * Outputs a trace message to the log file and/or standard output stream. The timestamp
 * and event type label are pre-pended to the given message. The timestamp can be
 * customized via the Log.timeFormat property; the event type label can be customized via
 * the 'Log.TypeLabel' property. The message is logged using the
 * <u>global log instance</u>.
 * @param {string} msg The message to send to the log file and/or console.
 * @param {LogCallback} [cb] Optional callback function. If provided, it will make the
 * call after the log entry is logged.
 * @param {...*} [subst] Optional list of substitution arguments.
 * When present, the method formats the message using either
 * {@link module:@crabel/shared/str_util~format str_util.format} or
 * {@link module:@crabel/shared/str_util~expand str_util.expand} depending on whether a
 * {@link module:@crabel/shared/str_util~substCallback substCallback} was provided.
 */
Log.trace = function (msg, cb, subst) {
    return _log.apply(null, _buildArgs(global_log || null, Log.eventType.trace, arguments));
};

/**
 * The <b>shutdown</b> function flushes and closes the log file rendering the log object
 * unusable. When done, the 'shutdown' event is emitted.
 * @param {Function} [cb]
 * @fires Log#shutdown
 */
Log.shutdown = function (cb) {
    if (global_log)
        global_log.shutdown(cb);
    else
        setImmediate(cb(new Error("Failed to shutdown Log instance, the global Log " +
            "has not being initiated.")));
};



// Instance Members

/**
 * Outputs a message to the log file and/or standard output stream without timestamp or
 * message type indicators.
 * @param {string} msg The message to send to the log file and/or console.
 * @param {LogCallback} [cb] Optional callback function. If provided, it will make the
 * call after the log entry is logged.
 * @param {...*} [subst] Optional list of substitution arguments.
 * When present, the method formats the message using either
 * {@link module:@crabel/shared/str_util~format str_util.format} or
 * {@link module:@crabel/shared/str_util~expand str_util.expand} depending on whether a
 * {@link module:@crabel/shared/str_util~substCallback substCallback} was provided.
 */
Log.prototype.out = function(msg, cb, subst) {
    return _log.apply(null, _buildArgs(this, Log.eventType.text, arguments));
};

/**
 * Outputs an error message to the log file and/or standard output stream. The timestamp
 * and event type label are pre-pended to the given message. The timestamp can be
 * customized via the Log.timeFormat property; the event type label can be customized via
 * the 'Log.TypeLabel' property.
 * @param {string} msg The message to send to the log file and/or console.
 * @param {LogCallback} [cb] Optional callback function. If provided, it will make the
 * call after the log entry is logged.
 * @param {...*} [subst] Optional list of substitution arguments.
 * When present, the method formats the message using either
 * {@link module:@crabel/shared/str_util~format str_util.format} or
 * {@link module:@crabel/shared/str_util~expand str_util.expand} depending on whether a
 * {@link module:@crabel/shared/str_util~substCallback substCallback} was provided.
 */
Log.prototype.err = function (msg, cb, subst) {
    return _log.apply(null, _buildArgs(this, Log.eventType.err, arguments));
};

/**
 * Outputs an informational message to the log file and/or standard output stream. The
 * timestamp and event type label are pre-pended to the given message. The timestamp can
 * be customized via the Log.timeFormat property; the event type label can be customized
 * via the 'Log.TypeLabel' property.
 * @param {string} msg The message to send to the log file and/or console.
 * @param {LogCallback} [cb] Optional callback function. If provided, it will make the
 * call after the log entry is logged.
 * @param {...*|callback} [subst] Optional list of substitution arguments or a
 * substitution function. When present, the method formats the message using either
 * {@link module:@crabel/shared/str_util~format str_util.format} or
 * {@link module:@crabel/shared/str_util~expand str_util.expand} depending on whether a
 * {@link module:@crabel/shared/str_util~substCallback substCallback} was provided.
 */
Log.prototype.warn = function (msg, cb, subst) {
    return _log.apply(null, _buildArgs(this, Log.eventType.warn, arguments));
};

/**
 * Outputs an informational message to the log file and/or standard output stream. The
 * timestamp and event type label are pre-pended to the given message. The timestamp can
 * be customized via the Log.timeFormat property; the event type label can be customized
 * via the 'Log.TypeLabel' property.
 * @param {string} msg The message to send to the log file and/or console.
 * @param {LogCallback} [cb] Optional callback function. If provided, it will make the
 * call after the log entry is logged.
 * @param {...*} [subst] Optional list of substitution arguments.
 * When present, the method formats the message using either
 * {@link module:@crabel/shared/str_util~format str_util.format} or
 * {@link module:@crabel/shared/str_util~expand str_util.expand} depending on whether a
 * {@link module:@crabel/shared/str_util~substCallback substCallback} was provided.
 */
Log.prototype.info = function (msg, cb, subst) {
    return _log.apply(null, _buildArgs(this, Log.eventType.info, arguments));
};

/**
 * Outputs a trace message to the log file and/or standard output stream. The timestamp
 * and event type label are pre-pended to the given message. The timestamp can be
 * customized via the Log.timeFormat property; the event type label can be customized via
 * the 'Log.TypeLabel' property.
 * @param {string} msg The message to send to the log file and/or console.
 * @param {LogCallback} [cb] Optional callback function. If provided, it will make the
 * call after the log entry is logged.
 * @param {...*} [subst] Optional list of substitution arguments.
 * When present, the method formats the message using either
 * {@link module:@crabel/shared/str_util~format str_util.format} or
 * {@link module:@crabel/shared/str_util~expand str_util.expand} depending on whether a
 * {@link module:@crabel/shared/str_util~substCallback substCallback} was provided.
 */
Log.prototype.trace = function (msg, cb, subst) {
    return _log.apply(null, _buildArgs(this, Log.eventType.trace, arguments));
};

/**
 * The <b>shutdown</b> function flushes and closes the log file rendering the log object
 * unusable. When done, the 'shutdown' event is emitted.
 * @param {Function} [cb]
 * @fires Log#shutdown
 */
Log.prototype.shutdown = function (cb) {
    let self = this;
    if (this.file) {
        let file = this.file;

        // Set file to null right away to avoid another call to log to be sent while
        // closing the log file.
        this.file = null;

        file.end(function () {
            self.emit("shutdown");
            if (cb)
                cb();
        });
    }
    else {
        // Still need to invoke the callback to ensure the client has a chance to perform
        // further work if necessary.
        if (cb)
            setImmediate(cb);
    }
};

/**
 * Returns true if the <tt>Log</tt> instance is still active, false if it has been
 * shutdown.
 * @returns {Boolean}
 */
Log.prototype.active = function () {
    return this.file !== null;
};


// Events

/**
 * The <b>busy</b> event is called whenever the Log object is busy.
 * @event Log#busy
 * @type {object}
 */

/**
 * The <b>idle</b> event is called when the Log object is done processing events.
 * @event Log#idle
 * @type {object}
 */

/**
 * This event is emitted every time a a message is logged and includes the details of the
 * event.
 * @event Log#event
 * @param {string} fmsg Contains the formatted message that was recorded by the log
 * object.
 * @params {object} event Details of the event including the timestamp, type, original
 * message, etc.
 * @type {object}
 */

/**
 * This event is emitted after the Log object is completely shutdown.
 * @event Log#shutdown
 * @type {object}
 */


let last_log = null;

/**
 * Outputs a message to the logfile.
 * @param {Log} log
 * Reference to the <tt>Log</tt> object
 * @param {String|Error} msg
 * Message to be formatted and added to the log file.
 * @param {Log.eventType} type
 * Type of message to be logged.
 * @param {LogCallback} cb
 * Function to call once the message has been logged or an error occurs.
 */
function _log(log, msg, type, cb) {
    if (!log)
        log = Log.global();

    if(!log.file) {
        let err = new Error("Failed to log message, the log has been shutdown.");
        if (cb)
            setImmediate(function () {
                cb(err);
            });
        else
            throw err;
    }

    if(undefined === msg)
        msg = "";

    if (Object.isType(msg, Error))
        msg = msg.message;

    if(4 < arguments.length) {
        let args = Array.prototype.slice.call(arguments).slice(4, arguments.length);
        args.unshift(msg);
        if(Object.isType(args[1], Function))
            msg = str_util.expand.apply(null, args);
        else
            msg = str_util.format.apply(null, args);
    }

    let event = {
        timestamp: new Date(),
        type: type,
        message: (log) ? _applySubst(log, msg) : msg,
        ignored: false
    };

    let fmsg;
    if(0 === log.pendingEvents)
        log.emit("busy");
    ++log.pendingEvents;

    fmsg = getFormattedMessage(log.timeFormat, log.typeLabels);
    if (type > log.level) {
        event.ignored = true;

        if (cb)
            setImmediate(function () { cb(null, event, fmsg); });

        return event;
    }

    if(log.echo) {
        if (last_log !== log) {
            if (last_log)
                console.log();
            last_log = log;
            if (log && log.caption)
                console.log(log.caption);
            else
                console.log("<Anonimous>");
        }
        console.log(fmsg);
    }

    log.file.write(fmsg + os.EOL, function (err) {
        if (err) {
            err = new Error("Failed to write to log file.");
            log.emit("error", err, event, fmsg);
            if (cb)
                cb(err);
            else
                throw err;

            return;
        }

        log.emit("event", event, fmsg);
        log.pendingEvents--;
        if(0 === log.pendingEvents)
            log.emit("idle");

        if(cb)
            cb(null, event, fmsg);
    });

    return event;

    function getFormattedMessage(time_format, type_labels) {
        if (!log)
            return event.message;
        
        if(Log.eventType.text === event.type)
            return log.formatLine(event.message);

        let type_width = 1 + Math.max(
            log.typeLabels.err.length,
            log.typeLabels.warn.length,
            log.typeLabels.info.length,
            log.typeLabels.trace.length
        );

        let separator = "";
        if (log.separator && 0 < log.separator.length)
            separator = log.separator + " ";

        if("" === time_format) {
            return getTypeLabel(type_labels, type_width) + separator +
                + log.formatLine(event.message, type_width);
        }

        let time_width = 1 + Date.formatLength(time_format);

        // Subtract the separation spaces when calculating the message width
        return event.timestamp.format(time_format) + " " + separator +
            getTypeLabel(type_labels, type_width)  + separator +
            log.formatLine(event.message, type_width + time_width + separator.length * 2);
    }

    function getTypeLabel(labels, type_width) {
        if(type === Log.eventType.err) return str_util.alignL(labels.err, type_width);
        if(type === Log.eventType.warn) return str_util.alignL(labels.warn, type_width);
        if(type == Log.eventType.info) return str_util.alignL(labels.info, type_width);
        if(type === Log.eventType.trace) return str_util.alignL(labels.trace, type_width);
        return str_util.alignL("", type_width);
    }
}

function _buildArgs(log, type, args) {
    if (0 == args.length)
        return [];

    let msg = args[0];
    let cb = null;
    let res;
    if (1 < args.length && Object.isType(args[1], Function)) {
        cb = args[1];
        res = Array.prototype.slice.call(args).slice(2, args.length);
    }
    else
        res = Array.prototype.slice.call(args).slice(1, args.length);
    res.unshift(cb);
    res.unshift(type);
    res.unshift(msg);
    res.unshift(log);

    return res;
}

/**
 * Substitutes any token in 'str" that matches either a property in 'this (log)" object
 * or in the given object. Date values are also replaced using the
 * <tt>str_util.substDate</tt>.
 * @param {Log} log
 * Reference to the <tt>Log</tt> object
 * @param {String} str
 * String where substitution will take place.
 * @param {Date} [date]
 * Optional date to use for substitution.
 * @returns {String}
 */
function _applySubst(log, str, date) {
    let align = "left";
    if ("-" === str.charAt(0)) {
        str = str.substr(1);
        if ("-" === str.slice(-1)) {
            align = "center";
            str = str.substr(0, str.length - 1);
        }
        else
            align = "right";
    }

    str = str_util.substDate(str, date || new Date());

    if (log.substObj)
        str = str_util.substProp(str, log.substObj);

    str = str_util.substProp(str, { log: log }, function (obj, prop_name) {
        if ("mode" === prop_name)
            return Log.modeStr[obj[prop_name]];
        if ("level" === prop_name)
            return Log.eventTypeStr[obj[prop_name]];
    });

    return str_util.align(str, log.lineWidth, align);
}

module.exports = Log;
