"use strict";
const { Formatters } = require('./lib/Formatters');
const json_data = require("../data/html.btm-format.json");
const _formatter = Formatters.CreateFrom({

    scopeName: 'scope.litteralString',
    patterns: [
        {
            include: "#string"
        }
    ],
    repository: {
        string: {
            "begin": "\"",
            "end": "\"",
            "name": "constant.string.litteral",
            "tokenID":"string",
            "captures":{
                "0":{
                    "name":"sting.marker.html",
                    "tokenID":"stringMarker"
                }
            }
        }
    },
    engine: "html-listener"

});
let lines = [
    "var s = \"bonjour tout le monde\";",
    "var x = 10;"
];
_formatter.debug = true;
console.log(_formatter.format(lines));