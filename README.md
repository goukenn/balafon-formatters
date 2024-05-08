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
        - \# end with
        - ^ start with
    - replace with expression argument is $0 will be the place holder
        - _"[ $0 ]"_
- `replaceWith`replace the cibling with expression that depend on begin/end matcher

```jsonc
{
    // put = half matched value
    "transform":":==40"
}
```

### use patterns '(?:)' to stop parent begin/end without end detection'
```jsonc
  "patterns":[
        {
            "match":"[ 0-9]+"
        },
        {
            "match":"(?:)"                            
        }
    ]
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

FEATURES 

"(??)" = start here move position ++; if no pattern until end found

### capture - block
for block only start element begin with (?:.) - end with non capture so that buffering will join
element

### join item on start line 
`joinWith`[?string]: indicate how to join buffer on start line - directive.


## RELEASES
    - Feature: Lint support lint errors definition { $ref : code }, declared in lintErrors of data
- 1.0.7
    - 
- 1.0.4
    - update extension information
- 1.0.3
- 1.0.2
- 1.0.1
- 1.0.0




