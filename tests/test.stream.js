
const { Formatters } = require("../src/lib/Formatters");
const webUtils = require("../src/web/Utils");
const { data }= require('./bcss.data.js');

const _bdata = data || {
    debug: true,
    scopeName: "source.bcss.test",
    repository: {
        "block-capture": {
            "begin": "(\\{)",
            "end": "(\\})",
            "endMissingValue": "}",
            "name": "meta.block.capture.bcss",
            "isBlock": true
        },
        "css-block-capture": {
            "begin": "(\\{)",
            "end": "(\\})",
            "endMissingValue": "}",
            "name": "meta.css.block.capture.bcss",
            "isBlock": true,
            "patterns": [
                {
                    "include": "#css-property-selector---"
                }, 
                // detect symbol
                {
                    "name":"detect.sysb",
                    "begin":"(?=[\\w]+)", // begin stream capture
                    "end":"(?=:|\\{)",
                    "streamAction":"next",
                    "patterns":[{
                        "name":"property.select",
                        "match":"\\w+"

                    }]
                },
                {
                    "name":"trim-space",
                    "match":"\\s+",
                    "transform":"trim"
                },
                {
                    "name":"end-instruct",
                    "match":"\\s*;\\s*",
                    "transform":"trim",
                    "isInstructionSeparator":true,
                    "lineFeed":true
                },
                {
                    "name":"property.separator",
                    "match":"\\s*:\\s*",
                    "transform":"trim"
                },
                {
                    "name":"property",
                    "match":"\\s*[\\w]+\\s*(?=:)", 
                    "transform":"trim"
                }, 
            ]
        },
        "length-with-unit": {
            "name": "constant.type.length.bcss",
            "match": "(-)?(((\\d+)?\\.)?\\d+(Q|fr|dpi|dpcm|dppx|x|cm|mm|em|rem|in|pt|ex|ch|cap|ic|lh|r(cap|ch|em|ex|ic|lh)|(d|l|s)?(vh|vw)|vb|vi|vmin|vmax|cq(b|h|i|max|min|w)|%)|\\d+px|\\d+(\\.\\d+)?)",
            "tokenID": "length"
        },
        "css-property-value": {
            "patterns": [
                { "include": "#length-with-unit" }
            ]
        },
        "bcss-property-detection": {
            "patterns": [
                {
                    "name": "check.speudo.code",
                    "begin": "(?=\\*|(?:--|\\.|#)?[\\w\\-]+)",
                    "end": "(?=(:|\\{))",
                    streamAction: "next",
                    patterns: [
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
                    ],
                    streamCaptures: {
                        "0": {
                            patterns: [
                                {
                                    match: "(.+)(:)$",
                                    transform: ["trim", "[P:$0]"]
                                },
                                {
                                    match: "(.+)(\\{)$",
                                    name: "detect.css.selector.stream.capture",
                                    transform: ["trim", "[S:$0]"]
                                }
                            ]
                        }
                    }
                },
                {
                    "name": "meta.selector.capture.bcss",
                    "match": "S:(.+)(?=\\{)",
                    "replaceWith": "$1",
                    "patterns": [
                        {
                            "begin": "\\{",
                            "end": "\\}",
                            "name": "configuragtion.begin................"
                        }
                    ]
                },
                {
                    "name": "meta.property.capture.bcss",
                    "begin": "P:([^:]+)(:)",
                    "end": "(;|(?=\\}))",
                    "endMissingValue": "/* missing close tag */",
                    "beginCaptures": {
                        "0": {
                            "replaceWith": "($1)(:)",
                            "captures": {
                                "1": { "name": "property.name.bcss", className: "css-property" },
                                "2": { "name": "meta.operator.seperator.bcss", className: "op css-prop-separator" }
                            }
                        }
                    },
                    "endCaptures": {
                        "0": {
                            "match": ":",
                            "name": "meta.end.property.bcss",
                            "className": "op css-end",
                        }
                    },
                    "lineFeed": true,
                    patterns: [{
                        "name": "property.value.bcss",
                        "begin": "(??)",
                        "end": "(?=;)",
                        "patterns": [
                            {
                                "match": "\\s+",
                                "transform": "trim"
                            },
                            {
                                "include": "#css-property-value"
                            }
                        ]
                    }]
                }
            ]
        },
        "css-selector": {
            "name": "meta.selector.bcss._3",
            "match": "([^\\{]+)(?=\\{)",
            "patterns": [{
                name: "capture",
                throwError: "reach here",
                patterns: [
                    { "include": "#css-block-capture" }
                ]
            }]
        }
    },
    patterns: [
        {
            "include": "#css-selector"
        },
        {
            "include": "#css-block-capture"
        },
        {
            "include": "#bcss-property-detection"
        },

    ]
};
const _formatter = Formatters.CreateFrom(_bdata, webUtils.webStyleClass);
let _src;
// const _src = `on line`;
// const _src = `     bodycolor\\:hover{`;
// _src = `    color:     12px; display:none ; `; //  du jour et de la nuit`;
//_src = `    color\\:hover{margin: 12px; display:none ; }`; //  du jour et de la nuit`;
_src = `xx    .color   {margin    :    12px;      display: none; }`; //  du jour et de la nuit`;
const _def = {};
// _formatter.listener = webUtils.webFormattingListener(_def);

const out = _formatter.format(_src.split("\n"));
console.log('source');
console.log(_src);
console.log("result \n" + out);
console.log("")


// in css property not support : 