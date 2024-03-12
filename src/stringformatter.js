"use strict";
const { Formatters } = require('./lib/Formatters');
const json_data = require("../data/html.btm-format.json");
const _formatter = Formatters.CreateFrom({

    scopeName: 'scope.litteralString',
    patterns: [
        {
            include: "#string"
        }, 
        {
            "match":"(;)",
            "name":"operator.end.instrution",
            "lineFeed":true
        }
    ],
    repository: {
        string: {
            "begin": "(\"|')",
            "end": "$1",
            "name": "constant.string.litteral",
            "tokenID":"string",
            "captures":{
                "0":{
                    "name":"sting.marker.html",
                    "tokenID":"stringMarker"
                }
            },
            patterns:[{
                "match":"\\\\.",
                name:"escaped.string"
            }]
        }
    },
    engine: "html-listener"

});
let lines = [
    // "var s = \"bonjour \\\"tout le monde\";",
    // "var x = 10;"
    "if (true) { return \"ok data\"; }",
];
_formatter.listener = ()=>( function(){
    let node = null;

    return {
    renderToken(v, tokens, tokenID, engine){
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
    store({output, buffer}){
        console.log("store : ", buffer, output);
        if (typeof(document) == 'undefined'){
            output.push(buffer);
            return;
        }
        
        let d = document.createElement('div');
        d.innerHTML = buffer;
        output.push(d.outerHTML);
    },
    appendLine(lineFeed, bufferOutput, { store }){
        store();
    }   
}
})();

_formatter.debug = true;
console.log(_formatter.format(lines));