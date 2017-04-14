# @crabel/shared *1.0.0*

> Set of shared libraries to help build consistent Node applications. Includes support for configs, logging and more.


### proto.js


#### ObjExt.isType(obj, type) 

Returns true of the object matches the given type. objType should be a function
constructor such as 'Number', 'Date', 'String', etc.




##### Parameters

| Name | Type | Description |  |
| ---- | ---- | ----------- | -------- |
| obj |  |  | &nbsp; |
| type | `Function`  |  | &nbsp; |




##### Returns


- `Boolean`  



#### ObjExt.isPrimitive(val) 

Returns true if the given value 'val' is one of the primitive types.




##### Parameters

| Name | Type | Description |  |
| ---- | ---- | ----------- | -------- |
| val |  |  | &nbsp; |




##### Returns


- `Boolean`  



#### ObjExt.className(obj) 

Get name of the constructor function. This is used during registration to determine
which object is being registered.




##### Parameters

| Name | Type | Description |  |
| ---- | ---- | ----------- | -------- |
| obj | `Object`  |  | &nbsp; |




##### Returns


- `Void`



#### ObjExt.copy(src[, deep]) 

Clone is replaceable, copy is not since is a static method.




##### Parameters

| Name | Type | Description |  |
| ---- | ---- | ----------- | -------- |
| src | `Object`  |  | &nbsp; |
| deep | `Boolean`  |  | *Optional* |




##### Returns


- `Object`  



#### ObjExt.contains(src, tgt) 

Returns true of 'src' fully contains 'tgt'. The comparison is recursive so all
properties and children's properties of 'tgt' must also exist in 'src' and have the
same values.




##### Parameters

| Name | Type | Description |  |
| ---- | ---- | ----------- | -------- |
| src | `Object`  |  | &nbsp; |
| tgt | `Object`  |  | &nbsp; |




##### Returns


- `Boolean`  



#### objExt.is(objType) 

Returns true of the object matches the given type. objType should be a function
constructor such as 'Number', 'Date', 'String', etc.




##### Parameters

| Name | Type | Description |  |
| ---- | ---- | ----------- | -------- |
| objType | `Function`  |  | &nbsp; |




##### Returns


- `Boolean`  



#### objExt.isPrimitive() 








##### Returns


- `boolean`  



#### objExt.clone(deep) 

Makes a copy of the current object. All attributes are copied including dates and
strings. The returned object has no common references with the original object. If the
optional parameter "deep" is set to true, the object is recursively cloned, all
aggregated objects and arrays are also cloned.




##### Parameters

| Name | Type | Description |  |
| ---- | ---- | ----------- | -------- |
| deep |  |  | &nbsp; |




##### Returns


- `Object`  



#### objExt.contains(tgt) 

Returns true of 'this' fully contains 'tgt'. The comparison is recursive so all
properties and children's properties of 'tgt' must also exist in this' and have the
same values.




##### Parameters

| Name | Type | Description |  |
| ---- | ---- | ----------- | -------- |
| tgt | `Object`  |  | &nbsp; |




##### Returns


- `Boolean`  



#### objExt.merge(src, replace, deep) 

Merges the attributes from <b>src</b> into '<b>this</b> object. If <b>replace</b> is
true, all overlapping attributes are replaced.
NOTE: Recursion when cloning the Date object fails on return, who knows why... try it
if you don't believe me :)




##### Parameters

| Name | Type | Description |  |
| ---- | ---- | ----------- | -------- |
| src |  |  | &nbsp; |
| replace |  |  | &nbsp; |
| deep |  |  | &nbsp; |




##### Returns


- `Object`  



#### objExt.className() 

Returns the name of the constructor function that was used to create the instance.






##### Returns


- `string`  



#### numExt.roundToInt(amount) 

Rounds the number <b>this</b> to the given integer amount.




##### Parameters

| Name | Type | Description |  |
| ---- | ---- | ----------- | -------- |
| amount | `Number`  |  | &nbsp; |




##### Returns


- `Number`  



#### numExt.truncToInt(amount) 

Truncates the number <b>this</b> to the given integer amount.




##### Parameters

| Name | Type | Description |  |
| ---- | ---- | ----------- | -------- |
| amount | `Number`  |  | &nbsp; |




##### Returns


- `number`  



#### numExt.nextPow2() 

Calculates the next closest power of 2 number.






##### Returns


- `Number`  



#### numExt.prevPow2() 

Calculates the previous closest power of 2 number.






##### Returns


- `Number`  



#### numExt.zeroPadd(width) 

Returns a string pre-appending any necessary 0s to reach the given width




##### Parameters

| Name | Type | Description |  |
| ---- | ---- | ----------- | -------- |
| width | `Number`  |  | &nbsp; |




##### Returns


- `String`  



#### numExt.toTime([format]) 

Assumes the input is in milliseconds (straight from dateExt.getTime)
Format Specs:
     h[h]    = hours
     m[m]    = minutes
     s[s]    = seconds
     f       = hundreds of a second
     ff      = tens of a seconds
     fff     = milliseconds
Text enclosed within {} brackets is excluded from substitution however the brackets
are removed. To preserve the braces use double braces: {{test}} = {test}




##### Parameters

| Name | Type | Description |  |
| ---- | ---- | ----------- | -------- |
| format | `String`  |  | *Optional* |




##### Returns


- `String`  



#### numExt.toEnum() 

Returns a string with the number as an enumeration (1st, 2nd, 3rd, 4th, etc)






##### Returns


- `string`  



#### numExt.between(first, second, inclusive) 

Returns true if the number is within the given range. By default the range is
interpreted as a close range, passing 'inclusive = false' will make it an open range.




##### Parameters

| Name | Type | Description |  |
| ---- | ---- | ----------- | -------- |
| first |  |  | &nbsp; |
| second |  |  | &nbsp; |
| inclusive |  |  | &nbsp; |




##### Returns


- `boolean`  



#### DateExt.format(dt, fstr[, replacer]) 

<pre>
Formats the given date "dt" using the formatting specifications in fstr. The following
formatting tokens apply:
     1) Year:    yyyy    = four digit year, yy = two digit year
     2) Month:   MM      = two digit month, M = single digit month (when less than 10)
     3) Day:     dd      = two digit day, d = single digit day (when less than 10
     4) Hours:   hh      = two digit hour, h = single digit hour
     5) Minutes: mm      = two digit minutes, m = single digit minute
     6) Second:  ss      = two digit seconds, s = single digit seconds
     7) Millis:  z       = milliseconds, always 3 digit number

Day:         d, dd, ddd, dddd
Month:       M, MM, MMM, MMMM
Year:        y, yy, yyy, yyyy

Hour:        h, hh, H, HH
Minute:      m, mm
Second:      s, ss
Seq. Fraq:   f, ff, fff
Timezone:    K
AM/PM:       t, tt

Use the "{" and "}" brackets to enclose text where date substitution should be avoided.
</pre>




##### Parameters

| Name | Type | Description |  |
| ---- | ---- | ----------- | -------- |
| dt | `Date`  |  | &nbsp; |
| fstr | `String`  |  | &nbsp; |
| replacer | `Function`  | Optional function to replace the date/time tokens. If 'null' not value is returned the default substitution is used. | *Optional* |




##### Returns


- `String`  



#### DateExt.sameDay(date1, date2) 

Returns true if the two dates point to the same day




##### Parameters

| Name | Type | Description |  |
| ---- | ---- | ----------- | -------- |
| date1 |  |  | &nbsp; |
| date2 |  |  | &nbsp; |




##### Returns


- `boolean`  



#### DateExt.formatLength(format_str[, replacer]) 

Returns the maximum length that the given format string can yield after a date is
formatted.
Usage:
     let len = DateExt.formatLength("yyyy/mm/dd");  // len = 10
     let len = DateExt.formatLength("yyy/m/d");     // len = 10




##### Parameters

| Name | Type | Description |  |
| ---- | ---- | ----------- | -------- |
| format_str | `String`  |  | &nbsp; |
| replacer | `Function`  | Function to replace date/time tokens. | *Optional* |




##### Returns


- `Number`  



#### dateExt.addYears(y) 

Returns copy of <b>this</b> and adds <b>y</b> number of years to it.




##### Parameters

| Name | Type | Description |  |
| ---- | ---- | ----------- | -------- |
| y |  |  | &nbsp; |




##### Returns


- `Date`  



#### dateExt.incYear(y) 

Adds <b>y</b> number of years to <b>this</b> and returns it to allow method chaining.




##### Parameters

| Name | Type | Description |  |
| ---- | ---- | ----------- | -------- |
| y |  |  | &nbsp; |




##### Returns


- `Date`  



#### dateExt.addMonths(m) 

Returns copy of <b>this</b> and adds <b>m</b> number of months to it.




##### Parameters

| Name | Type | Description |  |
| ---- | ---- | ----------- | -------- |
| m |  |  | &nbsp; |




##### Returns


- `Date`  



#### dateExt.incMonth(m) 

Adds <b>m</b> number of months to <b>this</b> and returns it to allow method chaining.




##### Parameters

| Name | Type | Description |  |
| ---- | ---- | ----------- | -------- |
| m |  |  | &nbsp; |




##### Returns


- `Date`  



#### dateExt.addDays(d) 

Returns copy of <b>this</b> and adds <b>d</b> number of days to it.




##### Parameters

| Name | Type | Description |  |
| ---- | ---- | ----------- | -------- |
| d |  |  | &nbsp; |




##### Returns


- `Date`  



#### dateExt.incDay(d) 

Adds <b>d</b> number of days to <b>this</b> and returns it to allow method chaining.




##### Parameters

| Name | Type | Description |  |
| ---- | ---- | ----------- | -------- |
| d |  |  | &nbsp; |




##### Returns


- `Date`  



#### dateExt.addHours(h) 

Returns copy of <b>this</b> and adds <b>h</b> number of hours to it.




##### Parameters

| Name | Type | Description |  |
| ---- | ---- | ----------- | -------- |
| h |  |  | &nbsp; |




##### Returns


- `Date`  



#### dateExt.incHour(h) 

Adds <b>h</b> number of hours to <b>this</b> and returns it to allow method chaining.




##### Parameters

| Name | Type | Description |  |
| ---- | ---- | ----------- | -------- |
| h |  |  | &nbsp; |




##### Returns


- `Date`  



#### dateExt.addMinutes(m) 

Returns copy of <b>this</b> and adds <b>m</b> number of minutes to it.




##### Parameters

| Name | Type | Description |  |
| ---- | ---- | ----------- | -------- |
| m |  |  | &nbsp; |




##### Returns


- `Date`  



#### dateExt.incMinute(m) 

Adds <b>m</b> number of minutes to <b>this</b> and returns it to allow method chaining.




##### Parameters

| Name | Type | Description |  |
| ---- | ---- | ----------- | -------- |
| m |  |  | &nbsp; |




##### Returns


- `Date`  



#### dateExt.addSeconds(s) 

Returns copy of <b>this</b> and adds <b>s</b> number of seconds to it.




##### Parameters

| Name | Type | Description |  |
| ---- | ---- | ----------- | -------- |
| s |  |  | &nbsp; |




##### Returns


- `Date`  



#### dateExt.incSecond(s) 

Adds <b>s</b> number of seconds to <b>this</b> and returns it to allow method chaining.




##### Parameters

| Name | Type | Description |  |
| ---- | ---- | ----------- | -------- |
| s |  |  | &nbsp; |




##### Returns


- `Date`  



#### dateExt.addMillis(ms) 

Returns copy of <b>this</b> and adds <b>ms</b> number of milliseconds to it.




##### Parameters

| Name | Type | Description |  |
| ---- | ---- | ----------- | -------- |
| ms |  |  | &nbsp; |




##### Returns


- `Date`  



#### dateExt.incMilli(ms) 

Adds <b>ms</b> number of milliseconds to <b>this</b> and returns it to allow method
chaining.




##### Parameters

| Name | Type | Description |  |
| ---- | ---- | ----------- | -------- |
| ms |  |  | &nbsp; |




##### Returns


- `Date`  



#### dateExt.diff(date, units) 

Returns the difference between <b>this</b> and <b>date</b> in the given units
(milliseconds by default). Supported units are: "day/d", "hour/h", "minute/m",
"second/s", "millisecond/fff"




##### Parameters

| Name | Type | Description |  |
| ---- | ---- | ----------- | -------- |
| date |  |  | &nbsp; |
| units |  |  | &nbsp; |




##### Returns


- `number`  



#### dateExt.toUtc() 

Returns a new date object representing the same date/time but in UTC. This is a nasty
hack since the returned date still shows the local timezone (no way to change this as
far as I know), however it is very convenient to be able to operate on a Date that's
already adjusted.






##### Returns


- `Date`  



#### dateExt.format(fstr[, replacer]) 

// Formats the date with the given specification. See <b>Date.format</b> for more detail.




##### Parameters

| Name | Type | Description |  |
| ---- | ---- | ----------- | -------- |
| fstr | `String`  |  | &nbsp; |
| replacer | `Function`  | Optional function to replace the date/time tokens. | *Optional* |




##### Returns


- `string`  



#### dateExt.sameDay(date) 

Returns true if <b>this</b> and <b>date</b> point to the same day.




##### Parameters

| Name | Type | Description |  |
| ---- | ---- | ----------- | -------- |
| date |  |  | &nbsp; |




##### Returns


- `boolean`  



#### dateExt.earlierDayThan(date) 

Returns true if <b>this</b> day is earlier than <b>date</b> ignoring the time.




##### Parameters

| Name | Type | Description |  |
| ---- | ---- | ----------- | -------- |
| date |  |  | &nbsp; |




##### Returns


- `boolean`  



#### dateExt.laterDayThan(date) 

Returns true if <b>this</b> day is later than <b>date</b> ignoring the time.




##### Parameters

| Name | Type | Description |  |
| ---- | ---- | ----------- | -------- |
| date |  |  | &nbsp; |




##### Returns


- `boolean`  



#### arrayExt.first(offset) 

Returns the first element in the array. The optional offset parameter can be used to
iterate through the array from first to last.




##### Parameters

| Name | Type | Description |  |
| ---- | ---- | ----------- | -------- |
| offset |  |  | &nbsp; |




##### Returns


-  



#### arrayExt.last(offset) 

Returns the last element in the array. The optional offset parameter can be used to
iterate through the array from last to first.




##### Parameters

| Name | Type | Description |  |
| ---- | ---- | ----------- | -------- |
| offset |  |  | &nbsp; |




##### Returns


-  



#### arrayExt.empty() 

Returns 'true' if the array has no elements






##### Returns


- `boolean`  




*Documentation generated with [doxdox](https://github.com/neogeek/doxdox).*
