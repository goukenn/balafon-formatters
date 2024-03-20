"use stricts";

const { Formatters } = require("../src/lib/Formatters");

 

const _formatter = Formatters.CreateFrom({
  scopeName: "scope.js",
  patterns: [
    {
        comment:"stream to detect destructuration",
        begin: /(?=\{)/,
        end: /(?=\}(?:\s*(=|,|\))\s*))/,
        name: "destructuration.affection.js",
        isBlock: {
            mode: "inline",
        }
    },
    {
        "match":"(\\{)(.+)(\\})(\\s*=\\s*)",
        "name":"destructuration.detected.js",
        "captures":{
            "1":{'name':'start.brace.js'},
            "2":{
                name:'destructuration.content.js',
                patterns:[
                    {
                        match:"\\b[\\w_][\\w_0-9]*\\b",
                        name:"constant.identifier.js"
                    },
                    {
                        match:":",
                        name:"constant.identifier.js"
                    }
                ]
            },
            "3":{'name':'end.brace.js'},
            "4":{'name':'operator.affectation.js'}
        }
    },
    {
      begin: /\{/,
      end: /\}/,
      name: "destructation.param.js",
    },
  ],
});

_formatter.debug = true;
const data = _formatter.format(["const {one, ", "two} = ()"]);

console.log("result:");
console.log(data);
