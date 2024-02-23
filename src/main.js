const { Formatters, Utils } = require("./lib/Formatters");

const data = {
    patterns:[
        { include : "#string"},
        {
            begin:/\{/,
            end:/\}/,
            name:"block",
            comment: "block comment information",
            patterns:[
                { include : "#string" }
            ]
        }
    ], 
    repository:{
        string:{
            begin: /("|')/,
            end: /$1/,
            name:"string.definition"
        }
    }
}

let u = Utils.JSonParseData(Formatters, data);

console.log(u);
console.log(JSON.stringify(u));