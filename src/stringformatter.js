"use strict";
const { Formatters, Utils } = require('./lib/Formatters');
const { FormattingBase } = require('./lib/Formattings/FormattingBase');
const { RegexUtils } = require('./lib/RegexUtils');

// let v = "var = ";
// let s = '[ \$0 - [information] ]';
// let _p = null;

// if (_p = /^\[(?<expression>.+)\]$/.exec(s)){
//    let c = Utils.GetRegexFrom(_p.groups['expression'], [v]);
//    v =  v.replace(v, c.toString().slice(1,-1));
// }
// console.log(v);
// return;


// const m = require('./formatter');
// console.log('m is ', m);
// return m;
 
// console.log(FormattingBase, FormattingBase.Factory('KAndR'));




// return;
const json_data = require("../data/html.btm-format.json");
const _bjs_data = require("./formatters/js.btm-syntaxes.json");
const _formatter = Formatters.CreateFrom(_bjs_data);
let lines = [
    // "var s = \"bonjour \\\"tout le monde\";",
    // "var x = 10;"
    // 'if (true) {}   ', 
    //"if (true){return first; if(false){ return second; if(iii){ return third; }}}",
    // "if ( true) { return first; if ( ok ){ z }}",
    // "if (true) { var x = 8; if (false){ z = 9; }return     \"ok data\"; x=129; }",
    //"if (true && info ){ if(  true ){/* handle format mode */ return; // end buffer } }",
    // "if ( true ) // basic",
    // "if ( true )",
     // "{ { { return }" // missing 2
     // "{ { { return " // missing 3
    //  "if ( true ) { ",
    //  "return    \"ok data\";}",
    "{{if (true){ return 8; // presentation", // for multi line
     //" // presentation",
    "var x + '32 -    50'; m = 32;}}}" // missing 1 // error
    //"tour d'ivoire",
    // "=>'information'"
];
_formatter.listener =  
() => (function () {
    let node = null;

    return {
        renderToken(v, tokens, tokenID, engine) {
            console.log("render tokens", {tokens, tokenID, value:v});
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
            return v;
        },
        store({ output, buffer, depth, tabStop, startBlock }) {

            if (buffer.trim().length <= 0) {
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