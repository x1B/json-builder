exports.NEED_KEY = {message: 'Need key for map value!'}
exports.DANGLING_KEY = {message: 'Key written, but no value!'}
exports.NOTHING_TO_CLOSE = {message: 'Nothing to close!'}
exports.KEY_IN_LIST = {message: 'Cannot write key in [] only {}.'}

/**
 * Takes a stream, gives you a json streaming abstraction over it.
 * For example, this allows you to pass long database results to JSON api
 * clients without constructing big objects in memory first.
 *
 * A stream is anything with a write method. Exceptions are thrown for
 * illegal usage such as keys without values, doubly closed lists/maps or
 * for trying to write a key into a list.
 */
exports.stream = function jsonStream(stream) {

  // Each stack element is a tupel (isMap:boolean, size:number)
  //  isMap: true if the stack frame is a {} (otherwise it is a [])
  //  size: number of items in the current {} or []
  var stack = []
  var danglingKey = false

  function top() {
    return stack[stack.length - 1];
  }

  function isMap() {
    return stack.length && top()[0];
  }

  function size() {
    return stack.length ? top()[1] : 0;
  }

  function incr() {
    stack[stack.length - 1][1]++;
  }

  function startValue() {
    if (!stack.length) return;
    if (isMap() && !danglingKey) throw exports.NEED_KEY;
    if (!isMap() && size()) stream.write(',');
    incr();
    danglingKey = false;
  }

  // api:
  function map () {
    startValue();
    stack.push([true, 0]);
    stream.write('{');
    return api;
  }

  function list () {
    startValue();
    stack.push([false, 0]);
    stream.write('[');
    return api;
  }

  function close () {
    if (!stack.length) throw exports.NOTHING_TO_CLOSE;
    if (danglingKey) throw exports.DANGLING_KEY;
    if (isMap()) stream.write('}');
    else stream.write(']');
    stack.pop();
    return api;
  }

  function key (key) {
    if (!isMap()) throw exports.KEY_IN_LIST;
    if (danglingKey) throw exports.DANGLING_KEY;
    if (size()) stream.write(',');
    stream.write(JSON.stringify(""+key));
    stream.write(":");
    danglingKey = true;
    return api;
  }

  function val (val) {
    return json(JSON.stringify(val));
  }

  function json (json) {
    startValue();
    stream.write(json);
    return api;
  }

  var api = {
    map: map,
    list: list,
    key: key,
    val: val,
    json: json,
    close: close,
  };

  return api
}
