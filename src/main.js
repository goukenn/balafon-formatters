"use strict";
const { Formatters, Utils } = require("./lib/Formatters");

// let a ;
// let b = null; //{ a:9, b:8};
// let q = {...a, ...b};
// function is_emptyObj(q){
//     return Object.keys(q).length == 0
// }

// console.log(is_emptyObj(q));


// return;

// ---------------------------------------
// check url detectetion
// ---------------------------------------
// let s = "(?i)(((ftp|http(s)|[a-z]+)?:(\\/{,2}))|(\\.(\\.\\/|\\/)?)|\\s*)[^\\s\\/\\)]+(\\/|(\\/[^\\s\\/\\)]+)*)(\\/)?";
// let s = "(?<path>(?:\\.(\\.\\/)?[^\\s\\/\\)\\)]+)|[^\\s\\/\\)\\)]+(\\/|(\\/[^\\s\\/\\)/\\(]+)+))";
// scheme detection 
// let s = "(?<scheme>(?:ftp|http(?:s)|[a-z]+)):(?:\\/\\/|\\/|)(?<path>(?:\\/|\\.\\.(?:\\/)?|\\.(?:\\/)?)[^\\/\\)\\(]+(?:\\/|\/[^\\/\\)\\()\\;]+))(?:;(?<queryo>[^\\?\\#]+))?(?:\\?(?<query>[^\\#]+))?(?:(?<anchor>#.+))?"; 
// let rg = Utils.RegexParse(s);
// console.log(rg);

// console.log("1", rg.exec("info")); // not a valid uri
// console.log("2", rg.exec(".info")); //  
// console.log("2", rg.exec("..info")); //  
// console.log("2", rg.exec("../info")); // 
// console.log("3", rg.exec("info/")); / 
// console.log("3", rg.exec("http://info/")); // not a valid uri
// console.log("3", rg.exec("//info/")); // not a valid uri
// console.log("3", rg.exec("..info/")); // not a valid uri
// console.log("3", rg.exec("http://info/;info=2?sample=8#present")); // not a valid uri
// console.log(rg.exec(".info"));
// console.log(rg.exec("./info"));
// console.log(rg.exec("../info"));


// return;
// ---------------------------------------
// test regex parse from string
// ---------------------------------------
// let _potion = null;
// s = "(?i)(((ftp|http(s)|[a-z]+)?:(\\/{,2}))|(\\.)|\\s*)[^\\s\\/\\)]+(\\/[^\\s\\/\\)]+)*(\\/)?";
// let l = Utils.RegexParse(s);
// console.log(l);






// let _option = /^\(\?(?<active>[ixm]+)(-(?<disable>[ixm]+))?\)/;
// if (_potion = _option.exec(s)){
//     let sp = '';
//     if(_potion.groups){
//         sp = _potion.groups.active ?? '';
//         if (_potion.groups.disable){
//             _potion.groups.disable.split().forEach(i=>{
//                 sp = sp.replace(i,'');
//             });
//         }
//     }
//     s = s.replace(_option, '');

//     console.log("active option ... ", _potion, sp, s);
// }

// return;

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
// let rgx =  /(?:lala)(pr(in))(base)(?=info)/;
// let rgx =  /(?:info)/;
// let e = rgx.exec('jump lalaprinbaseinfo');

// capture : 
// (?:subexp) - capture in global capture result - not capture group
// (?<=subexp) - look behind - not in global capture - not capture group
// (?=subexp) - look ahead - not in global capture - not capture group
// console.log(e);
function removeCapture(str){
    let l = str;
    let p = 0;
    function rm_brank(l, index, start='(', end=')'){
        let i = 1;
        let ln = l.length;
        const start_index = index;
        while((i < ln) && (i>0)){

            ch = l[index+1];
            if (ch==start){
                i++;
            } else if (ch ==end){
                i--;
            }
            index++;
        }
        return l.substring(0, start_index)+l.substring(index+1);
    }
    let capture = false;
    while( p = /\(\?(:|(\<)?=)./.exec(l)){
        l = rm_brank(l, p.index);
        capture= true;
    }
    return capture ? l : null;
}
// let p = removeCapture(rgx.toString()); // .replace(/\(\?(:|=|>)./g, '');
// if (p){
//      
// p = p.substring(1).slice(0,-1);
// let _regp = new RegExp(p);
// let _gp = _regp.exec(e[0]); 
// // let captureStart = e.index+_gp.index;
// // let captureLength = _gp[0].length;
// _gp.index += e.index;
// _gp.input = e.input;
// // let captureInfo = {
// //     captureStart,
// //     captureLength,
// //     group: _gp
// // };
// console.log(_gp);
// }
// var entireLength = e.reduce(function (acc, match) {
//     return acc + (match ? match.length : 0);
// }, 0);
// console.log(e);
// console.log("length");
// console.log(entireLength);
// return;

const json_data = require("../data/html.btm-format.json");
const _formatter = Formatters.CreateFrom(json_data);
let lines = [];
// _formatter.listener = ()=> ({
//     treatBuffer:{
//         /**
//          * call before append to the buffer 
//          * @param {*} buffer 
//          * @param {*} value 
//          * @param {*} otion option setting 
//          * @param {*} _marker 
//          * @returns 
//          */
//         append( buffer, value, _marker, option){
//             // dependending on  _marker. add some value
//             const {lineFeed, startLine, lineJoin, tabStop } = option;
//             console.log("treate value : -------------------------------------");

//             // if (_marker && /^html\./.test(_marker.name)){
//             //     value = 'HTML:'+value;
//             // } 
//             // value = value.replace(/[\\<\\>]/g, '');

//             return option.joinBuffer(buffer, value); 
//         }
//     },
//     append(s){
//         // append - just output to buffer data
//         console.log('output : ', s);
//         lines.push(s);
        
//     },
//     store({output, buffer}){
//         let option = this.objClass;;
//         if (buffer.length>0){
//             output.push(buffer);
//         }  
//     },
//     output(){
//         console.log("ask for output result .... ");

//     }
// });
_formatter.debug = true; 
let tests = [
    // { s: ['info'], e:'info'},
    // { s: ['"string test info" pour tout le   monde'], e:'"string test info" pour tout le monde'}, 
    //  { s: ['pour dire "the main : bondje test info"'], e:'pour dire "the main : BONDJE test info"'}, 
    // { s: ['par   devant'], e:'par devant'}, 
    // { s: ['par   devant'], e:'par devant'}, 
    // { s: ['<div /><div />'], e:'<div></div><div></div>'}, 
    // { s: ['<div/>    <div />     <input />'], e:'<div></div><div></div><input></input>'}, 
    // { s: ['<div/>', '<div />', '<div />'], e:'<div></div><div></div><div></div>'}, 

    { s: ['<div id = "data"     />'], e:'<div id="data"></div>'}, 


];



{/* <!DOCTYPE html><?xml blabla ?>
<data 

x   =  
    "Present">
    presentation
</data   
>
<empty />
<!-- comment 
for sample 
-->*/}
tests.forEach(o=>{

    let s = _formatter.format(
        o.s
    );
    if (s==o.e){
        return;
    } 
    compareString(s, o.e);
    throw new Error("failed");
})

function compareString(r, o){
    let idx = 0; 
    let data = o.split("\n");
    console.log(' ++++ = expected');
    console.log(' ---- = return');
    console.log("\n-result");
    console.log(r);
    console.log("\n-compare");
    r.split('\n').forEach((l)=>{
        let g = data[idx];
        if (l== g){
            console.log(l);
        }else{
            console.log("++++ "+g);
            console.log("---- "+l);
        }
        idx++;
    });
}
 
 