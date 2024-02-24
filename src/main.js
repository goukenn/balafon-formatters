const { Formatters, Utils } = require("./lib/Formatters");

const data = {
    patterns:[
        { include : "#line"},
        { include : "#string"},
        {
            begin:/\{/,
            end:/\}/,
            name:"block",
            comment: "block comment information",
            patterns:[
                { include : "#string" },
                { include : "#line" },
            ]
        }
    ], 
    repository:{
        line:{
            match:"\\bline\\d+\\b"
        },
        string:{
            begin: /("|')/,
            end: /\$1/,
            name:"string.definition",
            allowMultiline:false,
            patterns:[
                {
                    match:/\\./
                }
            ]
        }
    }
}

// let u = Utils.JSonParseData(Formatters, data);

let formatter = Formatters.CreateFrom(data);


// console.log(u);
console.log(formatter);
// console.log(JSON.stringify(u));
const _data = {
    data1:[
        "line1 for 'string data'  - after",
        "line2 for \"local data\" - after"
    ],
    data2:[
        "\"line1 x",
        "\"- x present 12 - ds"
    ],
    data3:[ // escape string 
        "exemple pour \"line1 \\\" x\" for you", 
    ]
}
let r = formatter.format(_data.data3); 
console.log("result : ", r);
