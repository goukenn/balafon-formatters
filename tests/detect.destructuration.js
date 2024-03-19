"use stricts";

const { Formatters } = require('../src/lib/Formatters');

const _formatter = Formatters.CreateFrom({
    "scopeName":"scope.js",
    patterns:[{
        "begin":/(?=\{)/,
        "end":/\}\s*=/,
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


console.log(_formatter);
return;


_formatter.debug = true;
const data = _formatter.format([
"const {one, ",
"two} = info()"
]);

console.log('result:');
console.log(data);