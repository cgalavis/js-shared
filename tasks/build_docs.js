/**
 * Created by cgalavis on 4/15/17.
 */

"use strict";

let gulp = require("gulp");
let foreach = require("gulp-foreach");
let path = require("path");
let exec = require('child_process').exec;


// TODO : Added files that should not generate documentation.
const exclude_list = {
    "gulpfile.js": true,
    "index.js": true
};

const options = {
    generate_markdown: true,
    generate_html: true
};

gulp.task("build-docs", function () {
    return gulp.src('*.js')
        .pipe(foreach(function (stream, file) {
            if (!exclude_list[file.relative]) {
                if (options.generate_markdown)
                    generateDoc(file.relative, "markdown");
                if (options.generate_html)
                    generateDoc(file.relative, "bootstrap");
            }

            return stream;
        }));
});

function generateDoc(file_name, layout) {
    const ext = {
        "markdown": ".md",
        "bootstrap": ".html"
    };

    exec("doxdox " + file_name + " " +
        "--layout " + layout + " " +
        "--output docs/" + path.basename(file_name, '.js') + ext[layout],
        function (err, stdout, stderr) {
            if (err)
                return console.error(err);
        }
    );
}
