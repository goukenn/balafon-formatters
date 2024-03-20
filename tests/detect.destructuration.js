"use stricts";

const { Formatters } = require('../src/lib/Formatters');

const _formatter = Formatters.CreateFrom({
    "scopeName":"scope.js",
    patterns:[{
        "begin":/(?=\{)/,
        "end":/(?=\}\s*=\s*)/,
        "name":"destructuration.affection.js",
        "isBlock":{
            "mode":"inline"
        }
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
"two})"
]);

console.log('result:');
console.log(data);