"use strict";
const { Formatters } = require('./lib/Formatters');
const { FormattingBase } = require('./lib/Formattings/FormattingBase');



// console.log(FormattingBase, FormattingBase.Factory('KAndR'));




// return;
const json_data = require("../data/html.btm-format.json");
const _formatter = Formatters.CreateFrom({

    scopeName: 'scope.litteralString',
    settings:{
        "instructionSeparator":";"
    },
    patterns: [
        {
            include: "#reserved-words"
        },
        {
            include: "#trim-multispace"
        },
        {
            include: "#string"
        },
        { 
            include:"#branket-function-condition"
        }, 
        {
            "include": "#end-instruction"
        },
       { 
        include:"#block-branket"
       },
       { 
        include:"#multi-line-comment"
    }
    ],
    repository: {
        "reserved-words":{
            "match":/\b(if|else|return|false|true)\b/,
            "name":"reserverd-word",
        },
        "block-branket":{
            "begin": "\\{",
            "end": "\\}",
            "name": "block",
            "isBlock": true,
            patterns: [
                {
                    include: "#reserved-words"
                },
                { include: "#end-instruction" },
                {
                    include: "#string"
                },
                {
                    include: "#trim-multispace"
                },
                { 
                    include:"#block-branket"
                },
                { 
                    include:"#branket-function-condition"
                }, 
                { 
                    include:"#multi-line-comment"
                }
            ]
        },
        "trim-multispace-":{
            "match":"\\s+",
            "name":"multi-line-space",
            "replaceWith":" "
        },
        "end-instruction": {
            "match": "(;)",
            "name": "operator.end.instruction",
            "lineFeed": true,
            "isInstructionSeparator":true
        },
        string: {
            "begin": "(\"|')",
            "end": "$1",
            "name": "constant.string.litteral",
            "tokenID": "string",
            "captures": {
                "0": {
                    "name": "sting.marker.html",
                    "tokenID": "stringMarker"
                }
            },
            patterns: [{
                "match": "\\\\.",
                name: "escaped.string"
            }]
        },
        "branket-function-condition":{
            begin:"\\s*\\(\\s*",
            end:"\\s*\\)\\s*",
            name:"branket.function",
            transform:"trim",
            beginCaptures:{
                "0":{
                    transform:"trim"
                }
            },
            endCaptures:{
                "0":{
                    transform:"trim"
                }
            }
        },
        "multi-line-comment":{
            begin:"\\/\\*",
            end:"\\*/",
            name:"constant.comment.multiline",
            tokenID:"comment",
            formattingMode:1
        },
        "single-line-comment":{
            begin:"\\/\\*",
            end:"\\*/",
            name:"constant.comment.multiline",
            tokenID:"comment",
            formattingMode:1
        }
    },
    engine: "html-listener"

});
let lines = [
    // "var s = \"bonjour \\\"tout le monde\";",
    // "var x = 10;"
    // 'if (true) {}   ', 
    //"if (true){return first; if(false){ return second; if(iii){ return third; }}}",
   // "if ( true) { return first; if ( ok ){ z }}",
    // "if (true) { var x = 8; if (false){ z = 9; }return     \"ok data\"; x=129; }",
    //"if (true && info ){ if(  true ){/* handle format mode */ return; // end buffer } }",
    " if ( true ) // basic {"
];
_formatter.listener = null; 
() => (function () {
    let node = null;

    return {
        renderToken(v, tokens, tokenID, engine) {
            let lt = tokens.shift();
            let n = null;
            // if (tokenID){
            //     switch(tokenID){
            //         case 'string':
            //             n = document.createElement('span');
            //             n.style = 'color:red;';
            //             n.innerHTML = v;
            //             return n.outerHTML;
            //         case 'reserved-word':
            //             n = document.createElement('span');
            //             n.style = 'color:skyblue;';
            //             n.innerHTML = v;
            //             return n.outerHTML;
            //     }
            // }
            // console.log('render token: ', lt , " : ", v);
            return v;
        },
        store({ output, buffer, depth, tabStop, startBlock}) {
            //console.log("store : ", buffer, output);
            if (buffer.trim().length<=0){
                return;
            }

            if (typeof (document) == 'undefined') {
                output.push(tabStop.repeat(depth) + buffer);
                return;
            }

            let d = document.createElement('div');
            d.innerHTML = buffer;
            output.push(d.outerHTML);
        },
        appendLine(lineFeed, bufferOutput, { store }) {
            store();
        }
    }
})();

_formatter.debug = true;
console.log(_formatter.format(lines));