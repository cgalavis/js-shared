<!-- 
    README.md is provided in HTML format to avoid rendering issues with JSDoc using the 
    TUI Template.
-->

<h1><b>@crabel/shared</b> <a href="https://git2.hq.crabel.com/node-common/shared">(GitHub)</a></h1>
Set of shared libraries to help build consistent Node applications. Includes support 
for common JS object extensions, string utilities, CSV file manipulation, 
configuration management, logging and more.<br><br><a style="font-size: 20px;"
        href="https://git2.hq.crabel.com/pages/node-common/shared">
    <b>API Documentation</b>
</a>

<h3><b>Installation</b></h3>
To install this package you will need to configure NPM to use Crabel's virtual repository,
refer to <a href="https://artifactory.hq.crabel.com">crabel artifactory</a> for more
information.
<pre>npm install @crabel/shared</pre>

<h3><b>Usage</b></h3>
Modules are included using the <tt>require</tt> function, for instance:
<pre>
require("@crabel/shared/proto").init();
let Range = require("@crabel/shared/range").Range;
let str_util = require("@crabel/shared/str_util);
</pre>

Refer to the documentation of each module for more details on what is been exported and
how to use it.

<h3><b>Running the Tests</b></h3>
To run the tests you will need to globally install the <b>Mocha</b> CLI from <b>NPM</b>
<pre>sudo npm install -g mocha</pre>
then run the tests using one of the following commands from project folder:
<pre>
mocha tests/
npm test
</pre>
