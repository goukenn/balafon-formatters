"use strict";
Object.defineProperty(exports, '__esModule', { value: true });

const { JSonParser } = require('./JSonParser');
const { ReplaceWithCondition } = require('./ReplaceWithCondition');
const { Utils } = require('./Utils');
const { RegexUtils } = require('./RegexUtils');
const { BlockInfo } = require('./BlockInfo');
const { PatterMatchErrorInfo } = require('./PatterMatchErrorInfo');
const { RegexEngine } = require('./RegexEngine');
const { PatternFormattingOptions } = require('./PatternFormattingOptions');


const PatternParsing = { init: false };
const PTN_BEGIN_END = 0;
const PTN_MATCH = 1;
const PTN_BEGIN_WHILE = 2;
const PTN_MATCH_TRANSFORM = 3;



/**
 * @typedef IFormatterReplaceWithCondition
 * @type
 * @property {string} expression,
 * 
 */

/**
 * 
 */
class Patterns {
    /**
     * @var {undefined|?PatternFormattingOption} 
     */
    formattingOptions;
    /**
     * @var {undefined|null|string|{message:string, code: number}} lint error 
     */
    lintError;
    /**
     * 
     */
    match;

    /**
     * match transform for injection
     * @var {} 
     */
    matchTransform;
    /**
     * start capture 
     */
    begin;
    /**
     * end match
     */
    end;

    /**
     * pattern cardinality in list. 
     * @var {number} 
     */
    cardinality;

    /**
     * use for begin/while . to implement
     * @var {string|Regex}
     */
    while;

    /**
     * while captures definitions
     */
    whileCaptures;
    /**
     * setup the value on end missing
     * @var {string|undefined|{expression:string, captures: undefined|captureInfo}}
     */
    endMissingValue;

    /**
     * the name of this pattern
     */
    name;

    /**
     * capture set content name
     */
    contentName;
    /**
     * describe this pattern
     */
    comment;
    /**
   * @var {?string} use for token matching
   */
    tokenID;
    /**
     * @var {?array} list of patterns
     */
    patterns;
    /**
     * indicate that this must be used as lineFeed
     * @var {?bool}
     */
    lineFeed;
    /**
     * indicate that this must be consider as a block element
    * @var {?bool|BlockInfo}
    */
    isBlock;

    /**
     * indicate that this pattern is a block conditional start
     * @var {undefined|?boolean}
     */
    isBlockConditionalContainer;

    /**
     * indicate that condition of trimmed segment on depth update
     */
    isTrimmedSegment;

    /**
     * how to marked segment from definition
     */
    markedSegment;

    /**
     * get or set condition expression to set if this element is a block.
     * @var {?string}
     */
    emptyBlockCondition;

    /**
     * get or set condition expression to evaluate if this element change the parent block property.
     * @var {?string}
     */
    requestParentBlockCondition;


    /**
     * mark this match as instruction separator. by default will be use as lineFeed. by default the contains will be checked
     * in match only alogrithm
     */
    isInstructionSeparator;

    //  /**
    //  * @var {?{start: string, end: string}} 
    //  */
    // block;
    /**
     * @var {?bool}
     */
    allowMultiline;
    /**
     * @var {?bool}
     */
    preserveLineFeed;

    /**
     * depend on token force trim end white space for buffer
     */
    nextTrimWhiteSpace = false;

    /**
     * similar likje end expression will replace the match apend value before adding it to buffer
     * @var {string|undefined|ReplaceWithCondition|ReplaceWithCondition[]}
     */
    replaceWith;

    /**
     * replace with condition object 
     * @var {object} 
     */
    replaceWithCondition;

    /**
     * apply transform on start line
     * @var {null|string|string[]}
     */
    startLineTransform;

    /**
     * used for begin capture
     */
    beginCaptures;

    /**
     * used for end captures
     */
    endCaptures;

    /**
     * apply to both begin and end captures definition
     */
    captures;

    /**
     * get updated parent props, {isBlock:?bool, lineFeed:?bool}
     */
    updateParentProps;

    /**
     * list of tranform operation
     * @var {string|string[]}
     */
    transform;

    /**
     * match to apply after tranform definition
     * @var {null|undefined|RegExp|string}
     */
    transformMatch;

    /**
     * transform captures
     * @var  {null|undefined|captures}
     */
    transformCaptures;

    /**
     * formatting mode after begin of (begin/end) selection
     * @var {?number}
     */
    beginFormattingMode;

    /**
     * formatting mode - after rendering the element
     */
    formattingMode = 0;


    /**
     * prepend value - on formattingMode = 5
     * @var {string|undefined} - default value is space litteral if undefined
     */
    formattingPrependExtra;

    /**
     * a glue value - to merge on 
     */
    isGlueValue;

    /**
     * same value with
     * @var {?string} join 
     */
    joinWith;

    /**
     * throw error on matching
     * @var {null|bool|string|PatterMatchErrorInfo}
     */
    throwError;

    /**
     * stream action type.
     * value use only on streaming default is 'next'
     * @var {?string|'parent'|'next'}
     */
    streamAction;

    /**
     * stream formatter
     * @var {{format(buffer: string):string}|(buffer:string):string}
     */
    streamFormatter;

    /**
     * captures to attach on stream or use captures as a fallback
     */
    streamCaptures;


    /**
     * indicate that this pattern must be only apply on start line
     * @var {boolean}
     */
    startLine = false;

    /**
     * @var {number}
     */
    applyEndPatternLast;

    /**
     * @var {boolean} debug this field
     */
    debug;


    /**
     * name used in debug mode
     * @var {?string}
     */
    debugName;

    /**
     * force close parent with litteral
     * @var {null|undefined|true|string} close parent with litteral
     */
    closeParent;


    /**
     * skip matching on condition(s)
     * @var {null|undefined|string|string[]}
     */
    skip;

    /**
     * formatting next glue value
     */
    nextGlueValue;


    /**
     * skip value on line end.
     */
    skipGlueOnLineEnd;

    /**
     * .ctr
     */
    constructor() {
        this.patterns = [];
        this.isBlock = false;
        this.allowMultiline = true;
        this.preserveLineFeed = false;
        this.cardinality = 0;
        var m_parent = null;
        var m_startOnly = false;

        Object.defineProperty(this, 'parent', {
            get() { return m_parent; }, set(v) {
                if ((v == null) || (v instanceof Patterns))
                    m_parent = v;
                else
                    throw Error('parent value not valid');
            }
        });
        Object.defineProperty(this, 'isStartOnly', {
            get() {
                return m_startOnly;
            }, set(v) {
                m_startOnly = v;
            }
        });
    }
    static IsSkipped(skip) {
        return RegexUtils.IsSkipped(skip);
    }
    json_parse(parser, fieldname, data, refKey, refObj) {

        // if (!PatternParsing.init) {
        //     PatternParsing.parser = (() => {


        const { Patterns, RefPatterns, CaptureInfo } = Utils.Classes;
        const q = this;
        const patterns = Utils.ArrayPatternsFromParser(parser, Patterns, RefPatterns);
        const transform = Utils.TransformPropertyCallback();
        const _regex_parser = RegexUtils.RegexParser(q);
        const _capture_parser = Utils.JSONInitCaptureField(q);
        const _replace_with = (n, parser, fieldname, refObj) => {
            if (typeof (n) == 'string') {
                //n = n.replaceAll("\\\\","\\");

                const _reg = _regex_parser.apply(q, [n, parser, fieldname, refObj]);
                return _reg;
            }
            if (typeof (n) == 'object') {
                let m = new ReplaceWithCondition;
                JSonParser._LoadData(parser, m, n, refObj);
                return m;
            }
            if (Array.isArray(n)) {
                let d = [];
                n.forEach(n => {
                    let m = new ReplaceWithCondition;
                    JSonParser._LoadData(parser, m, n, refObj);
                    d.push(m);
                });
                return d;
            }
            return null;
        };

        const parse = {
            endMissingValue(n, parser) {
                if (typeof (n) == 'object') {
                    const { FormatterEndMissingExpression } = Utils.Classes;
                    const { expression } = n;
                    let { captures } = n;
                    if (captures) {
                        captures = _capture_parser(captures, parser);
                    }
                    return new FormatterEndMissingExpression(expression, captures);
                }
                return n;
            },
            closeParent(n, parser) {
                const _type = typeof (n);
                const { FormatterCloseParentInfo } = Utils.Classes;
                const _gcl = parser.closeParentInfoClassName || FormatterCloseParentInfo;
                if (_type == 'object') {

                    let m = new _gcl;
                    JSonParser._LoadData(parser, m, n);
                    return m;
                }
                if (_type == 'boolean') {
                    return n;
                }
                if (_type == 'string') {
                    return n;
                }
                throw new Error('invalid closeParentType');
            },
            patterns(n, parser, refKey, refObj) {
                let d = patterns.apply(q, [n, parser, refKey, refObj]);
                d.forEach((s) => {
                    s.parent = q;
                });
                return d;
            }, // update with parent
            begin: _regex_parser,
            end: function (n, parser, refKey, refObj) {
                if (typeof (n) == 'string') {
                    // skip end matching 
                    if (n.length == 0) {
                        return RegexUtils.SKIP_REGEX;
                    }
                }
                return _regex_parser(n, parser, refKey, refObj);
            },
            while: _regex_parser,
            match: _regex_parser,
            matchTransform: _regex_parser,
            replaceWith: _replace_with,
            transformMatch: _regex_parser,
            lintError: function (n, parser) {
                const _t = typeof (n);
                let _rt = { message: null, code: null };
                if (_t == 'string') {
                    _rt.message = _t;
                } else if (n) {
                    const { code, message, $ref } = n;
                    const { lintErrors } = parser.data;
                    if ($ref && lintErrors) {
                        if ($ref in lintErrors) {
                            const { code, message } = { code: $ref, message: lintErrors[$ref] };
                            _rt.message = message;
                            _rt.code = code;
                            return _rt;
                        }

                    }
                    _rt.message = message;
                    _rt.code = code;
                }
                return _rt;
            },
            replaceWithCondition(n, parser) {
                let m = new ReplaceWithCondition;
                JSonParser._LoadData(parser, m, n, refObj);
                return m;
            },
            beginCaptures: _capture_parser,
            endCaptures: _capture_parser,
            captures: _capture_parser,
            streamCaptures: _capture_parser,
            transformCaptures: _capture_parser,
            transform,
            formattingOptions(d, parser){
                if (typeof(d)=='object'){
                const l = new PatternFormattingOptions;
                JSonParser._LoadData(parser, l, d);
                return d;
                }
            },
            lineFeed(d, parser) {
                return typeof (d) == 'boolean' ? d : false;
            },
            isBlock(d, parser) {
                let _t = typeof (d);
                if (_t == 'object') {
                    let m = new BlockInfo;
                    JSonParser._LoadData(parser, m, d);
                    return m;
                }
                return _t == 'boolean' ? d : false;
            },
            throwError(d, parser) {
                if (typeof (d) == "string") {
                    let l = new PatterMatchErrorInfo;
                    l.message = d;
                    return l;
                }
                return objOrBool(d, parser, PatterMatchErrorInfo);
            }
        };
        //         return parse;
        //     })();
        //     PatternParsing.init = true;
        // }
        // const q = this;
        // const parse = PatternParsing.parser;

        let fc = parse[fieldname];
        if (fc) {
            return fc.apply(q, [data, parser, refKey, refObj]);
        }
        return data;
    }
    json_validate(field_name, d, throw_on_error) {
        const validator = {
            patterns(d) {
                return Array.isArray(d);
            },
            replaceWithCondition(d) {
                return typeof (d) == 'object';
            }
        };
        let f = validator[field_name];
        if (f && !f(d)) {
            if (throw_on_error) {
                throw new Error(`[${field_name}] is not valid`);
            }
            return false;
        }
        return true;
    }

    get matchType() {
        const { begin, end, match, matchTransform } = this;
        const _while = this.while;
        if (begin) {
            if (end)
                return PTN_BEGIN_END;
            else if (_while) {
                return PTN_BEGIN_WHILE;
            }
        } else if (match) {
            return PTN_MATCH;
        } else if (matchTransform) {
            return PTN_MATCH_TRANSFORM;
        }
        return -1;
    }
    /**
     * get if end is capture only regex
     */
    get isEndCaptureOnly() {
        let s = this.end;
        if (s) {
            return RegexUtils.IsCapturedOnlyRegex(s.toString());
        }
        return false;
    }
    /**
     * get if begin capture only
     */
    get isBeginCaptureOnly() {
        let s = this.begin;
        if (s) {
            return RegexUtils.IsCapturedOnlyRegex(s);
        }
        return false;
    }
    /**
     * get if block is capture only
     * @return {boolean}
     */
    get isCaptureOnly() {
        let { begin, end } = this;
        if (begin && end) {
            return this.isBeginCaptureOnly && this.isEndCaptureOnly;
        }
        return false;
    }
    /**
     * is match capture only
     */
    get isMatchCaptureOnly() {
        let s = this.match;
        if (s) {
            return RegexUtils.IsCapturedOnlyRegex(s);
        }
        return !1;
    }
    /**
     * new line continue state
     */
    get newLineContinueState() {
        return true;
    }
    static Init(_o) {
        if (_o.begin && !_o.end && !_o.while) {
            // + | force begin/end
            _o.end = RegexUtils.SKIP_REGEX;
        }

        if ((_o.matchType == -1) && (_o.patterns?.length > 0)) {
            _o.patterns.forEach(s => {
                _o._initRef(s);
            });
        }
         
    }
    /**
     * initialize reference
     * @param {*} a 
     */
    _initRef(a) {
        if (!a.tokenID && this.tokenID) {
            a.tokenID = this.tokenID;
        }
    }
    getEntryRegex() {
        const { begin, match, matchTransform } = this;
        //const _while = this.while;
        switch (this.matchType) {
            case PTN_BEGIN_END:
            case PTN_BEGIN_WHILE:
                return begin;
            case PTN_MATCH:
                return match;
            case PTN_MATCH_TRANSFORM: return matchTransform;
        }
    }
    /**
     * depending on the regex value - or type
     * @param {string} l string to check
     * @param {*} option 
     * @param {*} parentMatcherInfo parent matcher
     * @param {*} regex 
     * @returns 
     */
    check(l, option, parentMatcherInfo, regex) {
        let p = null;
        const { patterns } = this;
        regex = regex || this.getEntryRegex();
        if (regex) {
            p = regex.exec(l);
        } else {
            // + | use for pattern only definition list
            if (patterns) {
                const cp = Utils.GetMatchInfo(patterns, l, option, parentMatcherInfo);
                if (cp) {
                    return { p: cp._match, s: cp._a, from: this, patterns: patterns, index: cp.index, regex: cp.regex };
                }
                return false;
            }
            throw new Error("cannot check : " + l);
        }
        return { p, s: this, index: -1, regex };
    }

    get matchRegex() {
        const rgs = {
            "0": this.begin,
            "1": this.match,
            "2": this.while,
            "3": this.matchTransform
        };
        return rgs[this.matchType]; //  this.matchType == 0 ? this.begin : this.match;
    }
    /**
     * calculate end regex
     * @param {*} p 
     * @returns 
     */
    endRegex(p) {
        const { end } = this;
        if (!end || ((this.end instanceof RegexEngine) && end.isEmpty)
            || Patterns.IsSkipped(end)) {
            return null;
        }



        if (this.matchType == 0) {
            let s = this.end.toString();
            let idx = s.lastIndexOf('/');
            let flag = '';
            if (idx < (s.length - 1)) {
                //remove options
                flag = s.substring(idx + 1);
                s = s.substring(0, idx + 1);
            }
            return Utils.GetRegexFrom(s, p, flag, 'end');
        }
        return null;
    }
    endWhile(p) {
        if (this.matchType == 2) {
            let s = this.while.toString();
            let idx = s.lastIndexOf('/');
            let flag = '';
            if (idx < (s.length - 1)) {
                //remove options
                flag = s.substring(idx + 1);
                s = s.substring(0, idx + 1);
            }
            return Utils.GetRegexFrom(s, p, flag, 'while');
        }
        return null;
    }

    toString() {
        let { name, begin, end, match, debugName, matchType } = this;
        const _while = this.while;
        name = (debugName ? "[" + debugName + "]" : null) || name;
        function getMatchInfo() {
            switch (matchType) {
                case PTN_BEGIN_END:
                    return { "begin": begin?.toString(), "end": end?.toString() };
                case PTN_MATCH:
                    return { 'match': match?.toString() };
                case PTN_BEGIN_WHILE:
                    return { 'begin': begin?.toString(), "while": _while?.toString() };
                case PTN_MATCH_TRANSFORM:
                    return { "matchTransfrom": _while?.toString() };
            }
        }
        if (!name) {
            name = JSON.stringify({
                type: matchType,
                //...getMatchInfo()
            });
        }
        return `Patterns[#${name}]`;
    }

}


const objOrBool = (d, parser, class_type) => {
    let _t = typeof (d);
    if (_t == 'object') {
        let m = new class_type;
        JSonParser._LoadData(parser, m, d);
        return m;
    }
    return _t == 'boolean' ? d : false;
}


exports.Patterns = Patterns;