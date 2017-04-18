#@crabel/shared
Set of shared libraries to help build consistent Node applications. Includes support for 
common JS object extensions, string utilities, CSV file manipulation, configuration 
management, logging and more.

###API Documentation
####[proto.js](https://git2.hq.crabel.com/pages/node-common/shared/module-@crabel_proto.html)
>This module contains extensions to common JavaScript objects such as <tt>Object</tt>,
<tt>Number</tt> and <tt>Date</tt>. Extensions need to be registered using the 
<tt>init</tt> function. This function take a single optional parameter that indicates the 
object to extend, if the parameter is omitted all extensions are registered.

####[str_util.js](https://git2.hq.crabel.com/pages/node-common/shared/module-@crabel_str_util.html)
>This module contains utility functions that extend the standard <tt>String</tt> 
interface adding support for string transformation and formatting including token 
replacement, text layout construction and more. Formatting function (format and expand) 
provide token substitution services using the familiar handlebars notation 
i.e. {{ token }}.

