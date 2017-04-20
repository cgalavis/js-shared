<h1>@crabel/shared</h1>

<h3>
    <a href="https://git2.hq.crabel.com/pages/node-common/shared">API Documentation</a><br>
    <a href="https://git2.hq.crabel.com/node-common/shared">Back to Repo</a>
</h3>
<p>
    Set of shared libraries to help build consistent Node applications. Includes support 
    for common JS object extensions, string utilities, CSV file manipulation, 
    configuration management, logging and more.
</p>

<h4>Installation</h4>
To install this package you will need to configure NPM to use Crabel's virtual repository,
refer to <a href="https://artifactory.hq.crabel.com">crabel artifactory</a> for more
information.
<pre>npm install @crabel/shared</pre>

<h4>Usage</h4>
Modules are included using the <tt>require</tt> function, for instance:
<pre>
require("@crabel/shared/proto").init();
let Range = require("@crabel/shared/range").Range;
let str_util = require("@crabel/shared/str_util);
</pre>

Refer to the documentation of each module for more details on what is been exported and
how to use it.

<h4>Running the Tests</h4>
To run the tests you will need to globaly install the <b>Mocha</b> CLI from <b>NPM</b>
<pre>sudo npm install -g mocha</pre>
The run the tests using one of the following commands from project folder:
<pre>
mocha tests/
npm test
</pre>