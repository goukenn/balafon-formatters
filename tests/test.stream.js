
const { Formatters } = require("../src/lib/Formatters");
const webUtils = require("../src/web/Utils");


const _formatter = Formatters.CreateFrom({
    debug:true,
    scopeName:"testing.regex",
    repository: {     
        "block-capture":{
            "begin":"(\\{)",
            "end":"(\\})",
            "endMissingValue":"}",
            "name":"meta.block.capture.bcss"
        }
    },
    patterns: [
        // {
        //     name: "stream detect on",
        //     begin: "(?=on\\s*)",
        //     end: "(?=$)", 
        //     transform: ["trim", "[[action : $0]]"],
        //     patterns: [
        //         {
        //             match: "\\s*(\\w+)",
        //             name: "found.word.space"
        //         }
        //     ] 
        // }
        {
            "include":"#block-capture"
        },
        {
            "name":"check.speudo.code",
            "begin":"(?=(?:--)?[\\w\\-]+)",
            "end":"(?=(:|\\{))",
            streamAction:"next",
            patterns:[
                {
                    // match:"\\\\:",
                    begin:"\\\\:",
                    end:"(?=\\{)",
                    name:"escape.speudo.event",
                    comment:"is selector by match event operator"
                },
                {
                    "begin":":(active|any-link|autofill|blank|checked|current|default|defined|dir|disabled|empty|enabled|first|first-child|first-of-type|focus|focus-visible|focus-within|fullscreen|future|has|host|host|host-context|hover|indeterminate|in-range|invalid|is|lang|last-child|last-of-type|left|link|local-link|modal|not|nth-child|nth-last-child|nth-last-of-type|nth-of-type|only-child|only-of-type|optional|out-of-range|past|paused|picture-in-picture|placeholder-shown|playing|read-only|read-write|required|right|root|scope|state|target|target-within|user-invalid|valid|visited|wheredone)",
                    "end":"(?=\\{)",
                    "name":"speudo-check",
                    comment:"is selector by ::speudo"
                }
            ],
            streamCaptures:{
                "0":{
                    patterns:[
                        {
                            match:"(.+)(:)$",
                            transform:["trim","[P:$0]"]
                        },
                        {
                            match:"(.+)(\\{)$",
                            transform:["trim","[S:$0]"]
                        }
                    ]
                }
            }
        },{
            "name":"meta.selector.capture.bcss",
            "match":"S:(.+)(?=\\{)",
            "replaceWith": "$1: selector definition"
        },
        {
            "name":"meta.selector.capture.bcss",
            "match":"P:(.+)(:)",          
            "replaceWith": "$1: value definition;"
        }
    ]
});

// const _src = `on line`;
// const _src = `     bodycolor\\:hover{`;
const _src = `     bodycolor-line: info du jour et de la nuit`;

const out = _formatter.format(_src.split("\n"));
console.log("result \n" + out);
console.log("")


// in css property not support : 