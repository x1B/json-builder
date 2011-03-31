# JSON Builder

This is a small API helping you to write long JSON values to a stream 
without constructing their entire content in memory first.


## Why?! There is JSON.stringify()

The JSON Builder is nice if you want to dump ten thousand records from your database to a JSON output, because it saves on memory and cuts down on
blocking buffer allocations. Also, it helps you to send still-incomplete
data to clients so they can start processing while you prepare the rest for
them.


## How do I use it?

    var stream = ... // something with write(str), e.g. an HTTP response
      , jsonBuilder = require('json-builder')
      , out = jsonBuilder.stream(stream)
    out.map()
       .key('title-row')
       .list()
       .val({a: 'an object'})
       .val(['a', 'list!', 1, 11])
       .json('{"some JSON": "as well"}')
        
    for (record in database) {// usually this would spill out values async
      out.key(record.id)
         .val(record.items)
    }
    out.close()
    
    // minus whitespace, this will produce something like:
    //
    // {"title-row": [{"a": "an object"}, ["a", "list!", 1, 11], 
    //                {"some JSON": "as well"}],
    // ... the db rows
    // }
      

# What about encoding?!

JSON Builder does not care about the fact that there might be encodings 
different from UTF-8 (yet). If you need to specify your encoding for a 
value, you can always use the .json(...) method and pass in you prepared 
item.
