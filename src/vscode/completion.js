const { Formatters } = require("../../src/lib/Formatters");


const _list = {
    bcss: {
        /**
         * 
         * @param {string} src 
         * @returns {{colorList:object, rootList: Object }}
         */
        GetProvideList(src) {
            const c_detect = {
                scopeName: 'detect.color',
                repository: {
                    "glue-white-space": {
                        "match": "\\s+",
                        "replaceWith": " ",
                        "isGlueValue": " ",
                        "tokenID": "wp"
                    },
                    "read-property": {
                        "begin": "(-)*\\b[a-z][a-z0-9\\-]*\\b",
                        "end": "(?=\\s|:|;)",
                        "tokenID": "property"
                    },
                    "value-content": {
                        "begin": "[^\\s]",
                        "end": "(?=;|\\})",
                        "tokenID": "value",
                        "patterns": [
                            {
                                "include": "#glue-white-space"
                            }, {
                                "match": "(?i)[a-z0-9]+",
                            },
                            {
                                "match": "//(.)+$",
                                "replaceWith": ""
                            },
                            {
                                "begin": "/\\*",
                                "end": "\\*/",
                                "replaceWith": ""
                            }
                        ]
                    },
                    "read-value": {
                        "begin": "(:)",
                        "end": "(?=;|\\})",
                        "tokenID": "source-def",
                        "patterns": [
                            {
                                "include": "#value-content"
                            }
                        ]
                    },
                    "root-property-detection": {
                        "patterns": [
                            {
                                "include": "#read-property"
                            },
                            {
                                "include": "#glue-white-space-"
                            },
                            {
                                "include": "#read-value"
                            }
                        ]
                    },
                    "color-property-detection": {
                        "patterns": [{
                            "include": "#read-property"
                        },
                        {
                            "include": "#read-value"
                        }]
                    },
                    "root-property-handle": {
                        begin: "@root",
                        end: "(?<=\\})",
                        tokenID: 'root-directive',
                        patterns: [
                            {
                                begin: "\\{",
                                end: "\\}",
                                name: "block-definition.detect.bcss",
                                patterns: [
                                    {
                                        "include": "#root-property-detection"
                                    }
                                ]
                            }
                        ]
                    }
                },
                patterns: [
                    {
                        begin: "@color",
                        end: "(?<=\\})",
                        name: 'color-def',
                        tokenID: 'color-directive',
                        patterns: [
                            {
                                begin: "\\{",
                                end: "\\}",
                                name: "block-definition.detect.bcss",
                                patterns: [
                                    {
                                        "include": "#color-property-detection"
                                    }
                                ]
                            }
                        ]
                    },
                    {
                        include: "#root-property-handle"
                    }
                ]
            }
            let c_formatter = Formatters.CreateFrom(c_detect);
            const _colorList = {};
            const _rootList = {};
            const _isDirectiveToken = (v) => {
                return /-directive$/.test(v)
            };

            c_formatter.listener = {
                /**
                 * @type {null|string}
                 */
                _p: null,
                _colorList,
                _rootList,
                /**
                 * @type {?number}
                 */
                _mode: 0,
                /**
                 * 
                 * @param {*} marker 
                 * @param {*} option 
                 */
                onEndHandler(marker, option, { isSubFormatting, tokenID, value, offset, sourceOffset }) {
                    const { debug } = option;
                    //console.log("end handler .... ", value, tokenID);

                    const _list = ((m, q) => {
                        return {
                            'color': q._colorList,
                            'root': q._rootList,
                        }[m]
                    })(this._mode, this);

                    switch (tokenID) {
                        case 'property':
                            this._p = value.value.trim();
                            break;
                        case 'value':
                            const { _p } = this;
                            this._p = null;
                            if ((this._mode == 'root') && (!/^--/.test(_p))) {
                                break;
                            }
                            _list[_p] = value.value.trim();
                            break;
                        default:
                            if (!isSubFormatting && _isDirectiveToken(tokenID)) {
                                this._mode = 0;
                            }
                            break;
                    }
                },
                onStartHandler(marker, option, { isSubFormatting }) {
                    const { tokenID } = marker;
                    if (!isSubFormatting && /-directive$/.test(tokenID)) {
                        let g = tokenID.substring(0, tokenID.length - 10);
                        this._mode = g;
                    }

                },

                renderToken(value, ...args) {
                    return value;
                }
            }
         
            let _result = c_formatter?.format(src);
            return {
                colorList: _colorList,
                rootList: _rootList
            };
        }
    }
};

module.exports = {
    ..._list
}