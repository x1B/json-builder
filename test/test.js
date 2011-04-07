var assert = require('assert');

var jsonBuilder = require('json-builder');


// create dummy stream for testing
function dummy () {
  var contents = '';
  return {
    write: function (json) { contents += json; },
    contents: function () { return contents; }
  };
}

function run(test) {
  var dummyStream = dummy();
  var jss = jsonBuilder.stream(dummyStream);
  var expected = test(jss);
  assert.equal(dummyStream.contents(), expected);
  process.stdout.write('.');
}

// normal stuff

run(function empty(jss) {
  jss.map().close();
  return '{}';
});

run(function simple(jss) {
  jss.map().key("mykey").val("myvalue").close();
  return '{"mykey":"myvalue"}';
});

run(function multipleKeys(jss) {
  jss.map().key("k1").val("v1").key("k2").val("v2").close();
  return '{"k1":"v1","k2":"v2"}';
})

run(function nestMultipleKeys(jss) {
  var jss = jss.map();
  jss.key("k1").list().val(1).val(2).val(3).close();
  jss.key("k2").list().close();
  jss.close();
  return '{"k1":[1,2,3],"k2":[]}';
})

run(function insaneExample(jss) {
  jss.map().key("abc").list();
  for (var i=10; i --> 0;) jss.val(i);
  jss.close().close();
  return '{"abc":[9,8,7,6,5,4,3,2,1,0]}';
});

run(function alreadyJson(jss) {
  jss.map().key("a json map").json(JSON.stringify({a:null})).close();
  return '{"a json map":{"a":null}}';
});


// error conditions

run(function doubleKey(jss) {
  try { jss.map().key("one").key("two").close(); }
  catch (e) { assert.equal(e, jsonBuilder.DANGLING_KEY); }
  return '{"one":';
});

run(function missingKey(jss) {
  try { jss.map().val("whos your daddy and whaaaa").close(); }
  catch (e) { assert.equal(e, jsonBuilder.NEED_KEY); }
  return '{';
});

run(function doubleClose(jss) {
  try { jss.list().val("some value").close().close(); }
  catch (e) { assert.equal(e, jsonBuilder.NOTHING_TO_CLOSE); }
  return '["some value"]';
});

run(function doubleClose(jss) {
  try { jss.list().key("this aint gonna work"); }
  catch (e) { assert.equal(e, jsonBuilder.KEY_IN_LIST); }
  return '[';
});

process.stdout.write('DONE\n');
