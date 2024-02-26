const { Formatters, Utils } = require("./lib/Formatters");
/*
const data = {
    settings:{
        tabStop:"\t",
        blockOnSingleLine:true
    },
    patterns:[ 
         { include : "#string"},
         { include : "#string-multiline" },
         { include : "#end-instruct"},
         { include : "#block" }
    ], 
    repository:{
        block: {
            begin:/\{/,
            end:/\}/,
            name:"block.definition",
            isBlock : true,
            comment: "block comment information",
            block:{
                start:"{",
                end:"}"
            },
            patterns:[
                { include : "#string-multiline" },
                { include : "#string" }, 
                { include : "#end-instruct"},
                { include : "#block" }, 
            ]
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
        "end-instruct":{
            match:/;/,
            name:'end.instruction',
            lineFeed: true
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
    data7:[
        "info() ",
        "{",
        "x = 'data.'; pour le dire de la vie ",
        "doWhile(){",
        "y",
        "z = 32;",
        "}",
        "}"
    ],
    data8:[
        "x='data' + x ; P"
    ],
    data9:[
        "{; x='uri' + x;P(){ y = 4}}"
    ],
    multispace_transform:[
        "bonjour     tout le  monde" //{; x='uri' + x;P(){ y = 4}}"
    ],
    read_empty:{
        data:[
        "{     }"
    ], expected:[
        "{}"
    ]
    },
    read_block:{
        data:[
        "{ var x }"
    ], expected:[
        "{",
        "\tvar x",
        "}"
    ]},
    read_block_after_line:{
        data:[
        "{ var x ",
        "}"
    ], expected:[
        "{",
        "\tvar x",
        "}"
    ]
    },
    function_block:{
        data:[
        "doSomething(){ var x ",
        "}"
    ], expected:[
        "doSomething(){",
        "\tvar x",
        "}"
    ]
    },
    function_block_2:{
        data:[
        "doSomething(){    var x ",
        "   var y",
        "}"
    ], expected:[
        "doSomething(){",
        "\tvar x",
        "\tvar y",
        "}"
    ]
    },
    segment:{
        data:[
        "doSomething(){    var x =   32    ;}",  
    ], expected:[
        "doSomething(){",
        "\tvar x = 32;", 
        "}"
    ]
    },
    segment_2:{
        data:[
        "doSomething(){    var x =   32    ; var y; var z=4;}",  
    ], expected:[
        "doSomething(){",
        "\tvar x = 32;", 
        "\tvar y;", 
        "\tvar z=4;", 
        "}"
    ]
    },
    subfunc_block:{
        data:[
            "A(){    var x =   32    ; B{ var y } }",  
        ], expected:[
            "A(){",
            "\tvar x = 32;", 
            "\tB{",
            "\t\tvar y",
            "\t}",  
            "}"
        ]
    },
    litteral:{
        data:[
            "A(){   'litteral {} start' }",  
        ], expected:[
            "A(){",
            "\t'litteral {} start'",  
            "}"
        ]
    }
}
function expect(data, formatter){
    let r = formatter.format(data.data);
    let s = data.expected.join("\n"); 
    if (r == s){
        return true;
    }
    console.log("result :",r);
    console.log(r);

    let idx = 0; 
    r.split('\n').forEach((l)=>{
        let g = data.expected[idx];
        if (l== g){
            console.log(l);
        }else{
            console.log("--"+l);
            console.log("++"+g);
        }
        idx++;
    });
    return false;

}
formatter.debug = false;
[
    'read_empty', 
    'read_block',
    'read_block_after_line',
    'function_block',
    'function_block_2',
    'segment',
    'segment_2',
    'subfunc_block',
    'litteral'
].forEach((f)=>{

    // if (!expect(_data[f], formatter)){
    //     throw new Error("format failed. ["+f+"]");
    // }
});


// let r = formatter.format(_data.multispace_transform); 
// console.log("result:");
// console.log(r);

*/
const json_data = require("../data/html.btm-format.json");
const _formatter = Formatters.CreateFrom(json_data);

_formatter.debug = true;
_source = `
<data x="Present"></data>
<empty />
<span>with data</span>
`; 
let s =  _formatter.format(
    _source.split("\n")
);
console.log("result:"); 
console.log();
console.log();


console.log(s);
console.log();
console.log();