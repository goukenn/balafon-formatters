const { Formatters, Utils } = require("./lib/Formatters");

const data = {
    patterns:[
        { include : "#line"},
        { include : "#string"},
        { include : "#string-multiline" },
        {
            begin:/\{/,
            end:/\}/,
            name:"block.definition",
            isBlock : true,
            comment: "block comment information",
            patterns:[
                { include : "#string-multiline" },
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
        },

        "string-multiline":{
            begin: /(`)/,
            end: /\$1/,
            name:"string.multiline.definition", 
            preserveLineFeed:true,
            patterns:[
                {
                    match:/\\./
                }
            ]
        },

    }
}

// let u = Utils.JSonParseData(Formatters, data);

let formatter = Formatters.CreateFrom(data);


// console.log(u);
// console.log(formatter);
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
    ],
    data4:[ // escape string 
    "un", 
    "deux",
    "",
    "",
    "trois"
    ],
    data5:[
        "one 'is' the 'best' after all."
    ],
    data6:[
        " a + `multiline - ",
        "   ",
        "   o",
        "",
        "string` + 'preserve' ", 
    ],
    data6:[
        //" a + `multiline` + 'preserve' ",  
        " a + `multi",
        "line` + 'preserve' ",  
    ],
    data6:[
        
    ]
}
formatter.debug = true;
let r = formatter.format(_data.data6); 
console.log("result : ", r);
