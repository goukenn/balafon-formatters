"use stricts";

const { Formatters } = require('../src/lib/Formatters');

const _formatter = Formatters.CreateFrom({
    patterns:[{
        "begin":/(?=\{)/,
        "end":/\}\s*=/,
        "name":"destructuration.affection.js",
    },
    {
    "begin":/\{/,
    "end":/\}/,
    "name":"destructation.param.js"
    }
]
});

_formatter.debug = true;
const data = _formatter.format([
"const {one, ",
"two} = info()"
]);

console.log('result:');
console.log(data);