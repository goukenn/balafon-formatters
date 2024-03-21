"use stricts";

const { Formatters } = require("../src/lib/Formatters");

 

const _formatter = Formatters.CreateFrom({
  scopeName: "scope.js",
  patterns: [
    {
        comment:"stream to detect destructuration",
        begin: /(?=\{)/,
        end: /\}(?:\s*(=|,|\))\s*)/,
        name: "destructuration.affection.js",
        isBlock: false,
        patterns:[
            {
                "begin":"\\s*(?::)\\s*", 
                "end":"(?=(,|\\)|\\}))",
                "name":"column.mark.space",
                "transform":"trim",
                "beginCaptures":{
                    "0":{
                        "name":"column.marker",
                        "transform":"trim", 
                    }
                },
                "patterns":[
                    {
                        "comment":"capture number",
                        "name":"constant.number",
                        "match":"\\d+"
                    },
                    {
                        "include":"#join-space"
                    }
                ]
            },
            {
                "match":"\\s+", 
                "name":"white.space",
                "replaceWith":" ", 
            },
            {
                "begin":"\\s*\\{",
                "end":"\\}",
                "throwError":{
                    "code":70,
                    "message":"Invalid syntax: not a good destructuration data",
                } 
            },
            {
                "begin":"\\s*\\[",
                "end":"\\]",
                "throwError":{
                    "code":71,
                    "message":"Invalid syntax: not a good destructuration array not allowed here",
                } 
            },
            // {
            //     "begin":"(:)",
            //     "end":"(?=,|\\})"
            // }
        ]
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
                        begin:":",
                        end:"(?=\\}|,|$)",
                        name:"expression.identifier.js"
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
  repository:{
    "join-space":{
        "match":"\\s+", 
        "name":"white.space",
        "replaceWith":" "
    },
  }
});

_formatter.debug = false;
const data = _formatter.format(["const {one","   :  ","   77 ", ", two: 36","} = ()"]);

console.log("result:");
console.log(data);
