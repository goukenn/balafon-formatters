# balafon generic formatters


match : string or regex data - if string will be converted to regex with i case

## usage

- create a formatter with a json settings

```js
const { Formatters } = require('./src/lib/Formatters')
const data = {
    patterns:[
        // global pattern in use
    ],
    repository:{
        // repository object
    }
}
let formatter = Formatters.CreateFrom(data);

let output = formatter.format([...]);

```

## FEATURES

settings
- "noSpaceJoin":true  

- tranform selection on endCaptures - parent matching groups

-- =
-- # end with
-- ^ start with

```jsonc
{
    // put = half matched value
    "transform":":==40"
}
```

## RELEASES


- 1.0


lineFeed
marker is not a line feed directive or buffer is not empty



