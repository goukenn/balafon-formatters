"use strict";
Object.defineProperty(exports, '__esModule', { value: true });
const data = {
    "scopeName":"source.bcss",
    "debug":true,
    "tokens":[
        'property'
    ],
    repository:{
        "bcss-inner-block":{
            "patterns":[ 
                {
                    "match":"xx\\s*",
                    "name":"prev",
                    "transform":"trim"
                },
                {
                    "include":"#check-inner-selector"
                },
                {
                    "include":"#inner-match"
                }
            ]
        },
        "check-global-selector":{
            "name":"check.global.selector",
            "begin":"(?=(\\*|\\.|#|--)?[\\w\\-]+)",
            "end":"(?=:|\\{)",
            "throwError":"check global start"
        },
        "check-inner-selector":{
            "name":"check.inner.selector",
            "begin":"(?=(\\.|#|--)?[\\w\\-]+)",
            "end":"(?=:|\\{)", 
            "patterns":[
                {
                    begin: "\\\\:|\\.|#|\\+|~|\\(|\\[",
                    end: "(?=\\{)",
                    name: "detect.css.selector",
                    comment: "is selector by match event operator"
                },
                {
                    "begin": ":(active|any-link|autofill|blank|checked|current|default|defined|dir|disabled|empty|enabled|first|first-child|first-of-type|focus|focus-visible|focus-within|fullscreen|future|has|host|host|host-context|hover|indeterminate|in-range|invalid|is|lang|last-child|last-of-type|left|link|local-link|modal|not|nth-child|nth-last-child|nth-last-of-type|nth-of-type|only-child|only-of-type|optional|out-of-range|past|paused|picture-in-picture|placeholder-shown|playing|read-only|read-write|required|right|root|scope|state|target|target-within|user-invalid|valid|visited|wheredone)",
                    "end": "(?=\\{)",
                    "name": "speudo-check",
                    comment: "is selector by ::speudo"
                }
            ]
        },
        "inner-match":{
            "name":"inner.match.data",
            "comment":"inner match data",
            "throwError":"inner match",
            "patterns":[
                {
                    "begin":"(.+)(?=\\{)",                    
                    "end":"$",
                    "name":"match.selector",
                    "beginCaptures":{
                        "1":{
                            "name":"selector",
                            "transform":"trim",
                            "format":{
                                "separator":","
                            }
                        }
                    },
                    "patterns":[
                        {"include":"#bcss-inner-data-block"}
                    ]
                },
                {
                    "begin":"(\\s*(?:--)?[\\w\\-]+\\s*)(:)",
                    "end":";|(?=\\})",
                    "name":"property.selector",
                    "beginCaptures":{
                        "1":{
                            "name":"property.name.bcss",
                            "transform":"trim",
                            "tokenID":"property"
                        },
                        "2":{
                            "name":"symbol.operator.prop.bcss",
                            "className":"op op-prop-def"
                        }
                    },
                    "endCaptures":{
                        "0":{
                            "match":";",
                            "name":"symbol.end.instruction.bcss",
                            "className":"op op-end-instruct"
                        }
                    },
                    "patterns":[
                        {
                            "include":"#bcss-value-capture"
                        },
                        {
                            "match":"(?=;)",
                            "isInstructionSeparator":true
                        }
                    ]
                }
            ]
        },
        "global-match":{
            "comment":"global match data"
            
        },
        "bcss-inner-data-block":{
            "begin":"(\\{)",
            "end":"(\\})",
            "isBlock":true,
            "name":"bcss.inner.block.bcss",
            "beginCaptures":{
                "1":{"name":"start.block.bcss", "className":"symbol start-block"},
            },
            "endCaptures":{
                "1":{"name":"end.block.bcss", "className":"symbol end-block"}
            },
            "patterns":[
                {"include":"#bcss-inner-block"}
            ]
        },
        "bcss-value-capture":{
            "patterns":[
                {
                    "match":"\\s*\\b[\\w\\-]+\\s*",
                    "transform":"trim",
                    "comment":"global value. doe not allow mutiline value"
                }
            ]
        }

     
    }, 
    patterns:[
        {include:"#bcss-inner-block"}
    ]
}

exports.data = data;