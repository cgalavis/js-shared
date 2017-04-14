"use strict";

let fs = require("fs");
//
let path = require("path");
let util = require("./util");
let mkdirp = require("mkdirp");

let week_day = {
    "sunday": 0,
    "monday": 1,
    "tuesday": 2,
    "wednesday": 3,
    "thursday": 4,
    "friday": 5,
    "saturday": 6
};

let config_root = "/etc/twintools/medifax";
let logs_root = "/var/log/twintools/medifax";
let working_root = "/var/lib/twintools/medifax";

/**
 * @property {Object} options
 * @property {Object} users
 * @property {String} config_path
 * @property {String} logs_path
 * @property {String} filters_path
 * @property {String} working_path
 * @property {String} config_file
 * @property {String} contacts_file
 * @property {String} cs_file
 * @property {String} cleanup_time
 * @property {String} orphan_provider_number
 * @property {Array.<String>} file_types
 * @property {Object} log
 * @property {String} log.file_name
 * @property {Object} default_filters
 * @property {String} database.host
 * @property {Number} database.port
 * @property {String} database.collection
 * @property {Number} database.lookback_days
 * @property {Object} web_server
 * @property {Number} web_server.port
 * @property {Object} archive
 * @property {String} archive.frequency
 * @property {Boolean} archive.compress
 * @property {Boolean} archive.include_log
 * @property {String} archive.file_name
 * @property {Object} schedule
 * @property {Number} schedule.rollover_time
 * @property {Number} schedule.duration
 * @property {Array.<String>} schedule.start_days
 * @property {Object} fax
 * @property {Object} ring_central
 * @property {String} ring_central.root_uri
 * @property {String} ring_central.server
 * @property {String} ring_central.key
 * @property {String} ring_central.secret
 * @property {String} ring_central.username
 * @property {String} ring_central.extension
 * @property {String} ring_central.password
 * @property {Number} ring_central.refresh_rate
 * @property {Number} ring_central.req_delay
 * @property {Number} ring_central.throttle_delay
 * @property {Object} ring_central.cover_page
 * @property {Number} ring_central.cover_page.index
 * @property {String} ring_central.cover_page.text
 * @property {String} default_area_code
 * @property {Object} imap
 * @property {String} imap.host
 * @property {Number} imap.port
 * @property {String} imap.mailbox
 * @property {String} imap.user
 * @property {String} imap.password
 * @property {Number} imap.process_interval
 * @property {Array} imap.email_filters
 * @property {Boolean} imap.mark_seen
 * @property {Object} ipp
 * @property {String} ipp.host
 * @property {Number} ipp.port
 * @property {String} ipp.user_name
 * @property {Number} ipp.process_interval
 * @property {Object} contacts
 * @property {Object} debug
 * @property {String} debug.today
 * @property {String} debug.redirect_number
 */
module.exports = {
    init: function (options) {
        this.options = options || {};
        if (!this.options.configPath) this.options.configPath = config_root;
        if (!this.options.logsPath) this.options.logsPath = logs_root;
        if (!this.options.workingPath) this.options.workingPath = working_root;

        this.logs_path = this.options.logsPath;
        this.filters_path = path.join(this.options.configPath, "filters");
        this.working_path = this.options.workingPath;

        mkdirp.sync(this.logs_path);
        mkdirp.sync(this.filters_path);
        mkdirp.sync(this.working_path);

        if (!options.test)
            this.config_file = path.join(this.options.configPath, "config.json");
        else
            this.config_file = path.join(this.options.configPath, "config-test.json");

        this.contacts_file = path.join(this.options.configPath, "contacts.json");
        this.cs_file = path.join(this.options.configPath, "custom_schedules.json");

        if (!fs.existsSync(this.config_file))
            throw new Error(util.format("The configuration file '%s' does not exist, " +
                "make sure you are running 'mp' from the correct directory.",
                this.config_file));

        let config = JSON.parse(fs.readFileSync(this.config_file).toString());
        for(let k in config)
            if (config.hasOwnProperty(k))
                this[k] = config[k];

        this.contacts = {};
        if (fs.existsSync(this.contacts_file)) {
            let contacts = JSON.parse(fs.readFileSync(this.contacts_file).toString());
            for (let c in contacts)
                if (contacts.hasOwnProperty(c))
                    if ("test" !== contacts[c].type || options.test)
                        this.contacts[c] = contacts[c];
        }

        this.custom_schedules = {};
        if (fs.existsSync(this.cs_file))
            this.custom_schedules = JSON.parse(fs.readFileSync(this.cs_file).toString());

        this.sessions = {};
        this.weekly_schedule = {};
        if (!this.users)
            this.users = {};

        for(let un in this.users)
            if (this.users.hasOwnProperty(un)) {
                let user = this.users[un];
                if (user.schedule)
                    for (let i=0; i < user.schedule.length; ++i)
                        this.weekly_schedule[week_day[user.schedule[i]]] = un;
            }

        if (this.debug && this.debug.today)
            this.debug.today = new Date(Date.parse(this.debug.today));


        //
        // validate
        //
        if (!this.imap)
            throw new Error("The configuration file is missing the 'imap' section.");

        if (!this.ring_central)
            throw new Error("The configuration file is missing the " +
                "'ring_central' section.");

        if (!this.ring_central.server)
            throw new Error("The configuration file is missing the " +
                "'ring_central.server' section.");

        if (!this.ring_central.key)
            throw new Error("The configuration file is missing the " +
                "'ring_central.key' section.");

        if (!this.ring_central.secret)
            throw new Error("The configuration file is missing the " +
                "'ring_central.secret' section.");

        if (!this.ring_central.username)
            throw new Error("The configuration file is missing the " +
                "'ring_central.username' section.");

        if (!this.ring_central.password)
            throw new Error("The configuration file is missing the " +
                "'ring_central.password' section.");


        //
        // set default values
        //
        if (!this.orphan_provider_number) this.orphan_provider_number = "000-000-0000";

        if (!this.web_server) this.web_server = {};
        if (undefined === this.web_server.port) this.web_server.port = 3000;

        if (!this.database) this.database = {};
        if (!this.database.host) this.database.host = "localhost";
        if (!this.database.port) this.database.port = 27017;
        if (!this.database.collection) this.database.collection = "jobs";
        if (!this.database.lookback_days) this.database.lookback_days = 7;

        if (!this.ring_central) this.ring_central = {};
        if (!this.ring_central.refresh_rate) this.ring_central.refresh_rate = 15000;
        if (!this.ring_central.req_delay) this.ring_central.req_delay = 1500;
        if (!this.ring_central.throttle_delay) this.ring_central.throttle_delay = 60000;
        if (!this.ring_central.root_uri) this.ring_central.root_uri = "/restapi/v1.0";
        if (!this.ring_central.cover_page)
            this.ring_central.cover_page = { "index": 0, "text": "" };

        if (!this.file_types) this.file_types = [ "pdf" ];
        if ("string" === this.file_types)
            this.file_types = [this.file_types];

        if (!this.imap.process_interval) this.imap.process_interval = 15000;
        if (!this.imap.mailbox) this.imap.mailbox = "INDEX";

        if (!this.ipp) this.ipp = { host: "", port: -1 };
        if (!this.ipp.process_interval) this.ipp.process_interval = 5000;

        if (!this.imap.port)
            this.imap.port = 993;
        this.imap.tls = (config.imap.port === 993);

        if (!this.imap.email_filter)
            this.imap.email_filter = [ "UNSEEN" ];

        return this;
    },

    today: function () {
        if (this.debug.today)
            return new Date(this.debug.today);

        return new Date();
    },

    isJobForUser: function (session, job) {
        if (!session)
            return false;

        if (session.assign_jobs_by === "provider") {
            let pid = this.getContactId(job.from.number);
            if (this.contacts[pid])
                return (this.contacts[pid].user === session.username);

            return false;
        }
        else if (session.assign_jobs_by === "all" || session.assign_jobs_by === "all" === "*")
            return true;

        let s = new Date(2017, 2, 1, 0, 0, 0, 0);
        let e = new Date(2017, 2, 2, 0, 0, 0, 0);
        if (job.timestamp.getTime() > s.getTime() && job.timestamp.getTime() < e.getTime())
            console.log();

        let date = this.getWorkingDay(job.timestamp);
        let user = this.custom_schedules[date.toLocaleDateString()];
        if (user)
            return (user === session.username);

        let self = this;

        if (session.todays_schedule && sessionCurrent(session))
            return jobInSession(job);

        session.todays_schedule = this.calculateSchedule(session.username);
        if (!session.todays_schedule)
            return true;

        session.last_updated = new Date();

        return jobInSession(job);


        ///

        function sessionCurrent() {
            let now = new Date();
            if (!session.last_updated)
                return false;

            if (session.last_updated.getDate() !== now.getDate())
                return false;

            if (session.last_updated.getHours() < 19 && now.getHours() > 19)
                return false;

            return true;
        }

        function jobInSession(job) {
            for (let i=0; i < session.todays_schedule.length; ++i) {
                let day = session.todays_schedule[i];
                let jts = new Date(job.timestamp);
                if (jts.getTime() >= day.start.getTime() &&
                        jts.getTime() < day.end.getTime())
                    return true;
            }

            return false;
        }
    },

    getWorkingDay: function (date) {
        if (date.getHours() >= 19)
            return new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1,
                0, 0, 0, 0);
        else
            return new Date(date.getFullYear(), date.getMonth(), date.getDate(),
                0, 0, 0, 0);
    },

    workingDir: function (dir) {
        if (!dir) dir = "";

        let wd = path.join(
            this.working_path, util.date_time.formatDate(new Date(), ""), dir);

        mkdirp.sync(wd);
        return wd;
    },

    calculateSchedule: function (username) {
        let user = this.users[username];
        if (!user || !user.schedule)
            return null;

        let today = this.getWorkingDay(this.today());
        let cur_wd = today.getDay();

        let schedule = [];
        user.schedule.forEach(function (wd_str) {
            let cur_day = new Date(today);
            let wd = week_day[wd_str];
            if (wd <= cur_wd)
                cur_day.setDate(cur_day.getDate() + (wd - cur_wd));
            else
                cur_day.setDate(cur_day.getDate() + ((wd - cur_wd) - 7));

            cur_day.setHours(19);
            cur_day.setMinutes(0);
            cur_day.setSeconds(0);
            cur_day.setMilliseconds(0);

            let start = new Date(cur_day);
            start.setDate(start.getDate() - 1);
            schedule.push({
                start: start,
                end: cur_day
            });
        });

        schedule.sort(function (d1, d2) {
            return (d1.start.getTime() < d2.start.getTime());
        });

        return schedule;
    },

    getContactId : function (number) {
        for (let fn in this.contacts)
            if (this.contacts.hasOwnProperty(fn)) {
                if (fn === number)
                    return fn;
                
                let f = this.contacts[fn];
                if (f.ref_numbers)
                    for (let j = 0; j < f.ref_numbers.length; ++j) {
                        if (f.ref_numbers[j] === number)
                            return fn;
                    }
            }

        return null;
    },

    getDbConnectionString: function () {
        return util.format("mongodb://%s:%d/%s",
            this.database.host,
            this.database.port,
            "mp"
        );
    },

    loadFiltersForUser: function (uname) {
        mkdirp.sync(this.filters_path);
        let fname = path.join(this.filters_path, uname + ".json");
        if (!fs.existsSync(fname)) {
            let filters = {
                days_to_show: 7,
                show_orphan_jobs: true,
                all_providers: true,
                providers: [],
                weekdays: [0, 1, 2, 3, 4, 5, 6]
            };

            if (this.default_filters)
                for (let k in this.default_filters)
                    if (this.default_filters.hasOwnProperty(k))
                        filters[k] = this.default_filters[k];

            return filters;
        }

        return JSON.parse(fs.readFileSync(fname).toString());
    },

    saveFiltersForUser: function (session, cb) {
        let fname = path.join(this.filters_path, session.username + ".json");
        fs.writeFile(fname, JSON.stringify(session.filters, null, 4), cb);
    }
};