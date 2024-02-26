# balafon generic formatters


match : string or regex data - if string will be converted to regex with i case

## usage

- create a formatter with a json settings

```js
const data = {
    patterns:[

    ],
    repository:{

    }
}
let formatter = Formatters.CreateFrom(data);

let output = formatter.format([...]);

```

