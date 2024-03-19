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
- block condition expression support

- tranform selection on endCaptures - parent matching groups

-- = with the value
-- # end with
-- ^ start with

```jsonc
{
    // put = half matched value
    "transform":":==40"
}
```

### References

replaceWith : string|ReplaceWithProtocol
replaceWithCondition : ReplaceWithConditionProtocol

```java
protocol ReplaceWithProtocol{
    with:{type: string, comment:''}
    condition: { type : ReplaceWithConditionProtocol }
}

````

## RELEASES

- 1.0.1
- 1.0.0




