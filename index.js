/**
 * Set of shared libraries to assist on the development of NodeJS applications at Crabel.
 * Libraries are included to deal with common tasks such as configuration management,
 * logging, text formatting, date/time manipulation, etc.
 *
 * In general only simple bindings are provided, more specialized/featured APIs exists
 * that can perform these tasks, such as Morgan (logging) and Moment (date/time), the
 * utilities contained in this package are not intended to replace these libraries and
 * their use is encourage whenever crabel-shared lacks needed functionality.
 *
 * @author: Carlos Galavis <cgalavis@crabel.com>
 */

require("./proto");

exports.module = {
    util: require("./util"),
    config: require("./config"),
    log: require("./log")
};