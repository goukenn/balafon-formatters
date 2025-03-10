"use strict";
Object.defineProperty(exports, '__esModule', { value: true });

const { RegexUtils } = require('./RegexUtils');
const { Utils } = require('./Utils');

/**
 * type checking requirement
 * @param {*} v 
 * @param {*} types 
 * @returns 
 */
function is(v, types) {
    const t = typeof (v);
    return (types.indexOf(v) != -1) || (types.indexOf(t) != -1);
}

/**
 * export pattern match info
 */
class PatternMatchInfo {

    /**
     * indicate new created pattern info
     * @var {bool}
     */
    start = true;

    /**
     * formatting start block element
     */
    isFormattingStartBlockElement = false;

    /**
     * formatting listener to handle start and end block element
     */
    formattingBlockListener;
    /**
     * 
     */
    range = {
        startLine: 0, // on start line 
        start: 0, // position start
        end: 0 // position end
    }
    /**
    * store marker info childs
    */
    childs = [];

    /**
     * store value
     * @var {null|{value:string, source:string }}
     */
    value;

    /**
     * define block start information
     */
    blockStartInfo;

    /**
     * formatter new line flag
     */
    newLine = false;

    /**
     * get or store the end group
     */
    endGroup = null;

    /**
    * @var {?boolean}
    */
    isShiftenName = false;


    /**
     * flag: shiftenContentName
     * @var {?boolean}
     */
    isShiftenContentName = false;

    /**
     * store start data
     */
    startData;

    get isMarkedSegments() {
        return (this.isTrimmedSegment === true) || (this.markedSegment != null);
    }
    /**
     * is capture to end line 
     * @param {*} line 
     * @returns 
     */
    isCaptureToEndLine({lineMatcher, lastMarker}){
        const { childs } = this;
        let lastChild = childs.length>0 ? childs[childs.length-1].marker : null;
        lastMarker = lastChild || lastMarker;
        if (lastMarker){
            const { subLine } = lineMatcher;
            const { end, matchType, match } = lastMarker;
            if (matchType==1){
                // + | match end regex
                return RegexUtils.CheckRequestEndLine(match) && match.exec(subLine);
            }
            else if (matchType==0){
                // + begin/end
                return RegexUtils.CheckRequestEndLine(end) &&  end.exec(subLine);
            }
        }
        return false;
    }
    markedInfo() {
        //const { Utils } = require('./Utils');
        return Utils.GetMarkedInfo(this); 
    }
    constructor() {
        var m_parent;
        var m_marker;
        var m_endRegex;
        var m_group;
        var m_line;
        var m_isBlock = false;
        var m_lineFeed = false;
        var m_startOutput = null;
        var m_endOutput = null;
        var m_updatedProperties = {};
        var m_isBlockStared = false;
        var m_bufferMode = 1; // how to operate on buffer 
        var m_patterns = null;
        var m_fromGroup = null; // store pattern group - to dected token id
        var m_index = -1;
        var m_state = null; // store use state
        /**
        * get or set the buffer mode. 0 - add a line before add go to 1 just append to buffer, 2 add a line after
        */
        Object.defineProperty(this, 'mode', {
            get() { return m_bufferMode; },
            set(v) {
                if (v != m_bufferMode) {
                    m_bufferMode = v; 
                }
            }
        });

        /**
         * get or set the parent info matcher
         */
        Object.defineProperty(this, 'isBlockStarted', {
            get() {
                return (this.isBlock) ? m_isBlockStared : false;
            }, set(v) {
                if (typeof (v) != 'boolean') {
                    throw new Error('not a valid value');
                }
                if (this.isBlock) {
                    m_isBlockStared = v;
                }
            }
        });

        Object.defineProperty(this, 'parent', { get() { return m_parent; } });
        Object.defineProperty(this, 'updatedProperties', { get() { return m_updatedProperties; } });
        Object.defineProperty(this, 'isBlock', {
            get() { return m_isBlock; }, set(value) {

                if (value === null) {
                    throw new Error('can  not store null value');
                }
                m_isBlock = value;
            }
        });
        Object.defineProperty(this, 'lineFeed', {
            get() {
                return m_lineFeed;
            }
        });
        Object.defineProperty(this, 'marker', { get() { return m_marker; } });
        Object.defineProperty(this, 'endRegex', { get() { return m_endRegex; } });
        // group info
        Object.defineProperty(this, 'group', { get() { return m_group; } });
        Object.defineProperty(this, 'state', { get() { return m_state; } });

        Object.defineProperty(this, 'line', { get() { return m_line; } });
        Object.defineProperty(this, 'startOutput', {
            get() {
                // + | return group[0] on start definition
                if ((m_startOutput == null) || (m_startOutput == undefined))
                    return m_group[0];
                return m_startOutput;
            },
            set(v) {
                m_startOutput = v;
            }
        });
        Object.defineProperty(this, 'endOutput', {
            get() { return m_endOutput; }, set(v) {
                m_endOutput = v;
            }
        });
        Object.defineProperty(this, 'isBlockConditionalContainer', {
            get() {
                const { marker } = this;
                return marker.isBlockConditionalContainer || (() => {
                    return marker.formattingMode && marker.requestParentBlockCondition;

                })();
            }, set(v) {
                if (is(v, ['boolean', undefined, 'undefined'])) {
                    this.pattern.isBlockConditionalContainer = v;
                }
            }
        });

        Object.defineProperty(this, 'indexOf', {
            get() {
                return m_index;
            }
        });
        Object.defineProperty(this, 'hostPatterns', {
            get() {
                return m_patterns;
            }
        });
        Object.defineProperty(this, 'fromGroup', {
            get() {
                return m_fromGroup;
            }
        });

        /**
         * 
         * @param {*} marker 
         */
        this.use = function ({ marker, endRegex, group, line, parent, patterns, formatting, fromGroup, index = -1 , state}) {
            m_marker = marker;
            m_endRegex = endRegex;
            m_group = group;
            m_state = state;
            m_line = line;
            m_parent = parent;
            // setup configurable properties
            m_isBlock = marker.isBlock;
            m_lineFeed = marker.lineFeed || formatting.isLineFeed(marker.formattingMode);
            m_patterns = patterns;
            m_fromGroup = fromGroup;
            m_index = index;


            (function (q, pattern) {
                const _keys = Object.keys(q);
                const _keys_t = Object.keys(pattern);
                ['isBlock', 'lineFeed', 'streamAction', 'isBlockConditionalContainer'].forEach(s => {
                    delete _keys_t[_keys_t.indexOf(s)];
                });
                _keys_t.forEach(i => {

                    if (_keys.indexOf(i) != -1) {
                        console.log("property alreay defined [" + i + "]");
                        return;
                    }
                    let _i = Object.getOwnPropertyDescriptor(pattern, i);
                    if (!_i || (_i.get) || _i.writable) {
                        // q[i] = pattern[i];
                        Object.defineProperty(q, i, { get() { return pattern[i]; } })
                    }
                });
            })(this, m_marker);
        };
    }
    /**
     * @var {boolean}
     */
    get isUpdatedBlock() {
        const { updatedProperties } = this;
        return updatedProperties && ('isBlock' in updatedProperties);
    }
    get isMatchCaptureOnly() {
        return this.marker?.isMatchCaptureOnly;
    }
    //
    get isEndCaptureOnly() {
        return this.marker?.isEndCaptureOnly;
    }
    get isWhileCaptureOnly() {
        return this.marker?.isWhileCaptureOnly;
    }
    get isBeginCaptureOnly() {
        return this.marker?.isBeginCaptureOnly;
    }
    get isCaptureOnly() {
        return this.marker?.isCaptureOnly;
    }
    /**
     * get if this empty block is start only use definition 
     */
    get isStartOnly() {
        return this.marker?.isStartOnly;
    }

    get closeParentData() {
        let m = this.marker?.closeParent;
        let _type = typeof (m);
        if (_type == 'string') {
            return m;
        }
        if (_type == 'boolean') {
            return !m ? undefined : '';
        }
        return m;
    }
    /**
     * get if this match info is a stream capture
     */
    get isStreamCapture() {
        if (this.marker?.isStartOnly) {
            return false;
        }
        return this.isCaptureOnly && (this.group[0].length == 0);
    }
    /**
     * check this is a block but non configured;
     */
    get isAutoBlockElement() {
        return this.isBlock && !this.isFormattingStartBlockElement;
    }

    get index() {
        return this.group?.index;
    }
    get offset() {
        return this.group?.offset;
    }
    get name() {
        return this.marker?.name;
    }
    get captures() {
        return this.marker?.captures;
    }
    get endCaptures() {
        return this.marker?.endCaptures;
    }
    get beginCaptures() {
        return this.marker?.beginCaptures;
    }
    get replaceWith() {
        return this.marker?.replaceWith;
    }
    get replaceWithCondition() {
        return this.marker?.replaceWithCondition;
    }
    get streamAction() {
        const { streamAction } = this.marker;
        return streamAction || 'next';
    }
    /**
     * expose parker match type
     */
    get matchType() {
        return this.marker.matchType;
    }

    /**
     * check is pattern only definition.
     * @var {bool}
     */
    get isPatternsOnly() {

        return false;
    }
    /**
     * debug this marker. internal used
     */
    get debug() {
        return this.marker?.debug;
    }
    /**
     * 
     * @returns 
     */
    toString() {
        return "[PatternMatchInfo: " + this.marker?.toString() + "]";
    }

    /**
     * match type with glue type 
     */
    get skipGlueOnLineEnd(){
        const b = this.isGlueValue;
        if (typeof(b) == 'object'){
            let { skipGlueOnLineEnd } = b || {skipGlueOnLineEnd:false};
            return skipGlueOnLineEnd; 
        }
        return this.skipGlueOnLineEnd;

    }

    /**
     * 
     * @param {*} end 
     * @param {*} param1 
     * @returns 
     */
    checkMoveEndRegex(end, {lineCount}){
        return (this.group.index == end.index) && 
           (this.state.lineCount == lineCount);
    }
}

exports.PatternMatchInfo = PatternMatchInfo;