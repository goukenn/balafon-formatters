# balafon generic formatters

match : string or regex data - if string will be converted to regex with i case

## usage

- create a formatter with a json settings
- inspired from [marcomates.com](https://macromates.com/manual/en/language_grammars)

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

- `tranform` selection by invoking some string functio
    - padding with symbol
        - = with the value
        - # end with
        - ^ start with
    - replace with expression argument is $0 will be the place holder
        - "[ $0 ]"
- `replaceWith`replace the cibling with expression that depend on begin/end matcher

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

```

- Note: 
    - In order to operate on the entired mactch result - do not capturure sub element. 


# extension 
.btm-syntax.json

## RELEASES

- 1.0.1
- 1.0.0




