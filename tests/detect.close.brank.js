"use stricts";

const { Formatters } = require("../src/lib/Formatters");



const _formatter = Formatters.CreateFrom({
  scopeName: "scope.js",
  patterns: [
    {
      comment: "detect end close tag",
      begin: /(?=\<\/\b[\w](?:[\w\d\-]*(?::[\w][\w\d\-]*)?)\b)/,
      end: /(?=\>)/,
      name: "detect.closetag.html",
      isBlock: false,
      patterns: [
        {
          include: "#join-space"

        },
      ],
    },
    {
      begin: /\<\/\b[\w](?:[\w\d\-]*(:[\w][\w\d\-]*)?)/,
      end: /\s*\>/d,
      name: 'closetag.html',
      endCaptures: {
        0: {
          "transform": "trim"
        }
      }
    }
  ],
  repository: {
    "join-space": {
      "match": "\\s+",
      "name": "white.space",
      "replaceWith": " ",
      "isGlueValue": true
    },
  }
});

_formatter.debug = true;
const data = _formatter.format(["</data    ",
  "     ",
  "",
  ">"
]);

console.log("result:");
console.log(data);
