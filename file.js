'use strict';

/**
 * This module is part of the Crabel core library, it contains utility functions that
 * facilitate file name processing and file management providing minimal extensions for
 * the native <b>path</b> and <b>fs</b> modules.
 * @module @crabel/shared/file
 * @author Carlos Galavis <cgalavis@crabel.com>
 */

require("./proto").init();

let path = require("path");
let fs = require("fs");
let glob = require("glob");
let mkdirp = require("mkdirp");


module.exports = {
    /**
     * Ensure the given path (or path to the given file) exists.
     * @param {String} dir
     * Path to the folder or file.
     * @returns {Boolean}
     */
    ensurePath: function (dir) {
        // If an extension is present, we assume the path is to a file
        dir = dir.trim();
        if ("" !== path.extname(dir) && dir.charAt(dir.length - 1) != path.sep)
            dir = path.dirname(dir);

        if (fs.existsSync(dir))
            return true;

        let parent_dir = path.dirname(dir);
        if ("" == parent_dir)
            return false;

        if (this.ensurePath(parent_dir + path.sep)) {
            fs.mkdirSync(dir);
            return true;
        }

        return false;
    },


    /**
     * Returns a string with the name of the given file combined with the given
     * extension. If the file already has an extension, the original file name is
     * returned.
     * @param {String} file_name
     * Name of the file.
     * @param {String} ext
     * Extension to be added to the file.
     * @returns {String}
     * A string with file name plus the extension.
     */
    addExt: function (file_name, ext) {
        if ("" === path.extname(file_name)) {
            if ("." !== ext.charAt(0))
                ext = "." + ext;
            return file_name + ext;
        }

        return file_name;
    },


    /**
     * Returns a string with the file name minus the extension.
     * @param {String} file_path
     * Name of the file.
     * @returns {String}
     * A string with file name minus the extension.
     */
    removeExt: function (file_path) {
        if (!file_path)
            return file_path;

        let dot_index = file_path.lastIndexOf(".");
        if (0 > dot_index)
            return name;

        return name.substring(0, dot_index);
    },


    /**
     * Returns a string with the given <tt>file_name</tt> after replacing it's extension.
     * @param {String} file_name
     * Name of the file.
     * @param {String} new_ext
     * Extension to give to the resulting file name.
     * @returns {String}
     * New file name with the extension replaced.
     */
    swapExt: function (file_name, new_ext) {
        if ("." !== new_ext.charAt(0))
            new_ext = "." + new_ext;

        return this.addExt(path.join(path.dirname(file_name),
            this.removeExt(path.basename(file_name))), new_ext);
    },


    /**
     * Given <tt>file_name</tt> return a unique file name by appending an index at the
     * end. The file path (or relative path) is searched for collisions.
     * @param {String} file_name
     * Name to use as the basis for unique name construction.
     * @param {Boolean} [back_index=false]
     * If true the index is prepended.
     * @returns {String}
     * Unique name.
     */
    makeUnique: function (file_name, back_index) {
        // explicit default value
        if (back_index === undefined)
            back_index = false;

        let index = 0;
        let new_name = getNewName(file_name, index, back_index);
        while (fs.existsSync(new_name))
            new_name = getNewName(file_name, ++index, back_index);

        return new_name;

        function getNewName(file_path, index, back_index) {
            if (!back_index)
                return path.join(path.dirname(file_path),
                    this.removeExt(path.basename(file_path)) + "-" + index.zeroPadd(2) +
                    path.extname(file_path));
            else
                return path.join(path.dirname(file_path),
                    index.zeroPadd(2) + "-" + path.basename(file_path));
        }
    },


    /**
     * Saves the give text into the given file. If the file exists it is overwritten.
     * @param {String} file_name
     * Name of the file.
     * @param {String} data
     * The
     * @param {Boolean} safe
     */
   saveText: function (file_name, data, safe) {
        // Safe not supported since copy doesn't use Win32 API anyway
        let options = "utf8";

        // Create path, if necessary.
        mkdirp.sync(path.dirname(file_name));
        fs.writeFileSync(file_name, data, options);
    },


    /**
     * Loads the given file and returns it's content as a string.
     * @param {String} file_name
     * Name of the file to load.
     * @returns {String}
     * Content of the file.
     */
    loadText: function (file_name) {
        let options = {encoding: "utf8", flag: "r" };
        return fs.readFileSync(file_name, options);
    },


    /**
     * Copies the file <tt>src</td> into <tt>dest</tt>. If <tt>dest</tt> exists an
     * exception is thrown unless <tt>true</tt> is passed on the <tt>overwrite</tt>
     * parameter.
     * @param {String} src
     * Name of the file to copy.
     * @param {String} dest
     * Name of the file to copy onto.
     * @param {Boolean} [overwrite=false]
     * If <tt>true</tt> overwrites the destination file if it exists.
     */
    copy: function (src, dest, overwrite) {
        if (!overwrite && fs.existsSync(dest))
            throw new Error("Failed to copy file, the destination already exists.");

        let stats = fs.lstatSync(src);
        if (!stats.isFile())
            throw new Error("Failed to copy file, the source is not a file.");

        path.ensurePath(path.dirname(dest));
        let data = fs.readFileSync(src);
        fs.writeFileSync(dest, data);
    },


    /**
     * Moves the file <tt>src</td> into <tt>dest</tt>. If <tt>dest</tt> exists an
     * exception is thrown unless <tt>true</tt> is passed on the <tt>overwrite</tt>
     * parameter.
     * @param {String} src
     * Name of the file to move.
     * @param {String} dest
     * Name of the file to move onto.
     * @param {Boolean} overwrite
     * If <tt>true</tt> overwrites the destination file if it exists.
     */
    move: function (src, dest, overwrite) {
        if (!overwrite && fs.existsSync(dest))
            throw new Error("Failed to copy file, the destination already exists.");

        let stats = fs.lstatSync(src);
        if (!stats.isFile())
            throw new Error("Failed to copy file, the source is not a file.");

        copy(src, dest, overwrite);
        if (fs.existsSync(dest))
            fs.unlinkSync(src);
    },


    /**
     * Deletes the given file or files matching the given pattern.
     * @param {String} file_name
     * Name of the file to delete.
     */
    erase: function (file_name) {
        let files = glob.sync(file_name);
        for (let i = 0; i < files.length; ++i) {
            fs.unlinkSync(files[i]);
        }
    }

};


