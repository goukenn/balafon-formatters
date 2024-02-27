"use strict";
Object.defineProperty(exports, '__esModule', { value: true });

const { Utils } = require("./Utils");
const { Patterns } = require("./Patterns");
const { RefPatterns } = require("./RefPatterns");
const { JSonParser } = require("./JSonParser");
const { Debug } = require("./Debug");
const { FormatterListener } = require("./FormatterListener");
const { FormatterSetting } = require("./FormatterSetting");

/**
 * formatters entry point
 */
class Formatters {
    patterns;
    repository;
    /**
     * @var {?string}
     */
    scopeName;
     /**
     * @var {?bool}
     */
    debug; // allow debug
    /**
     * use to configure general setting
     */
    settings;

    constructor() {
        this.debug = false;
        this.patterns = [];
        this.repository = {};
    }
    get lineFeed() {
        return this.m_option.lineFeed;
    }
    set lineFeed(value) {
        this.m_option = value;
    }
    /**
     * validate current field name
     * @param {*} field_name 
     * @param {*} d 
     * @returns bool
     */
    json_validate(field_name, d, throw_on_error) {
        const validator = {
            patterns(d) {
                return Array.isArray(d);
            },
            repository(d) {
                return typeof (d) == 'object';
            },
            debug(d) {
                return typeof (d) == 'boolean' || /(yes|no|1|0)/.test(d);
            },
            settings(d){
                return (d==null) || typeof (d) == 'object';
            },
            scopeName(d){
                return (d==null) || typeof (d) == 'string';
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
    json_parse(parser, fieldname, data, refKey) {
        const patterns = Utils.ArrayParser(Patterns);
        const parse = {
            patterns,
            repository(d, parser) {
                let _out = {};
                let _o = null;
                for (let i in d) {
                    _o = new Patterns();
                    JSonParser._LoadData(parser, _o, d[i]);
                    _out[i] = _o;
                }
                return _out;
            },
            debug(d) {
                if (typeof (d) == 'boolean') {
                    return d;
                }
                return !(!d);
            },
            settings(d, parser){
                if (d==null){
                    return null;
                }
                let m = JSonParser._LoadData(parser, new FormatterSetting, d); 
                return m;
            }
        };
        let fc = parse[fieldname];
        if (fc) {
            return fc(data, parser, refKey);
        }
        return data;
    }
    static CreateFrom(data) {
        const formatter = Utils.JSonParseData(Formatters, data);

        return formatter;
    }
    static CreateDefaultOption() {
        return new FormatterSetting;
    }
    format(data, option) {
        if (!Array.isArray(data)){
            if (typeof(data)=='string'){
                data = [data];
            }
            else throw new Error('argument not valid');
        }

        const _rg = option || this.settings || Formatters.CreateDefaultOption();
        const { lineFeed, tabStop } = _rg;
        const { debug } = this;
        let depth = _rg.depth || 0;
        let _marker = null;
        let _formatter = this;
        let _matcher = null;
        // buffering info to handle buffer info
        let _info = new FormatterListener();
        const _markerInfo = [];

        let m_pos = 0;
        let objClass = {
            ... _rg,
            line: '',
            pos: 0,
            lineCount: 0,
            depth,
            continue: false,
            lineJoin: false,
            lineFeedFlag: false,
            buffer: '',
            output: [], // output result
            listener: _info,
            debug: _formatter.debug,
            lineFeed,
            range: {
                start: 0, // start position
                end: 0    // number end position range
            },
            resetRange() {
                this.storeRange(0, 0);
            },
            /**
             * store range 
             * @param {number} start 
             * @param {number} end if optional 
             */
            storeRange(start, end) {
                this.range.start = start;
                this.range.end = typeof (end) == 'undefined' ? start : end;
            }
        };
        Object.defineProperty(objClass, 'length', { get: function () { return this.line.length; } })
        Object.defineProperty(objClass, 'tabStop', { get: function () { return tabStop; } })
        Object.defineProperty(objClass, 'lineFeed', { get: function () { return lineFeed; } })
        Object.defineProperty(objClass, 'debug', { get: function () { return debug; } })
        Object.defineProperty(objClass, 'markerInfo', { get: function () { return _markerInfo; } })
        Object.defineProperty(objClass, 'pos', {
            get: function () { return m_pos; }, set(v) {
                // console.log("set position", v);
                m_pos = v;
            }
        });

        objClass.unshiftMarker = (o)=>{
            _markerInfo.unshift(o);
        };
        objClass.shiftMarker = ()=>{
            return _markerInfo.shift();
        };

        _info.objClass = objClass; 
        // + | ------------------------------------------------------------
        // + | START FORMATTER LOGIC
        // + | ------------------------------------------------------------
        data.forEach((line) => {
            objClass.debug && Debug.log('read: ' + objClass.lineCount + " :> " + line);
            objClass.resetRange();
            objClass.line = line;
            objClass.pos = 0;
            objClass.continue = false;
            objClass.lineCount++;

            if (_marker) {
                if (!_marker.allowMultiline) {
                    throw new Error(`marker '${_marker.name}' do not allow multi line definition.`);
                }
                objClass.continue = true;
                objClass.lineJoin = false;
                objClass.startLine = true;
                _marker = _formatter._handleMarker(_marker, objClass, _info);
            
            } else {
                objClass.line = objClass.line.trimStart();
            }
            if (line.length <= 0) {
                return;
            }
            objClass.startLine = false;
            let ln = objClass.length;
            let pos = objClass.pos;
            while (pos < ln) {
                objClass.continue = false;
                if (_marker) {
                    objClass.continue = true;
                    objClass.storeRange(objClass.pos);
                    _marker = _formatter._handleMarker(_marker, objClass, _info);
                } else {
                    _matcher = Utils.GetPatternMatcher(this.patterns, objClass);
                    if (_matcher) {
                        objClass.storeRange(pos, _matcher.index);
                        _marker = _formatter._handleMarker(_matcher, objClass, _info);
                    } else {
                        _info.append(objClass.line.substring(objClass.pos));
                        objClass.pos = ln;
                    }
                }
                pos = objClass.pos;
            }
            objClass.lineJoin = true;
        });
        
        debug && console.log('.....end.....');
        if (objClass.markerInfo.length>0){
            // missing close marker info
            let q = null;
            while(q = objClass.markerInfo.shift()){
                this._restoreBuffer(objClass, q);
                if (q.marker.isBlock){
                    objClass.buffer += q.content;
                    objClass.depth--;
                    objClass.output.push(objClass.buffer);
                    objClass.buffer = '';
                    _info.appendAndStore(
                    q.marker.blockEnd
                    );
                }

            }
        }
        _info.store();
        return objClass.output.join(lineFeed);
    }
    _isBlockAndStart(_marker, option){
        return _marker.isBlock && !option.continue;
    }
    _startNewBlock(_marker, option){
        if (this._isBlockAndStart(_marker , option)) {
            option.debug && Debug.log('start block:');
            option.buffer = option.buffer.trimEnd(); 
            option.depth++;
        } 
    }
    /**
     * handle marker 
     * @param {*} _marker 
     * @param {*} option 
     */
    _handleMarker(_marker, option) {
        if (!_marker) return;
        const { listener } = option;
        const _info = listener;
        if (!option.continue) {
            let _prev = option.line.substring(option.range.start, option.range.end);
            
            if (_prev.length > 0) {

               
                // append constants
                // _info.append(_prev);
                if (option.lineFeedFlag){
                    option.lineFeedFlag = 0;
                    option.output.push('');
                    _info.appendAndStore(_prev); 
                    option.buffer = _info.output(true);
                } else {
                    _info.append(_prev); 
                }
                option.pos += _prev.length;
            }
            option.storeRange(option.pos);
        }
        switch (_marker.matchType) {
            case 0:
                // + | ---------------------------------------------
                // + | for block definition 
                return this._handleBeginEndMarker(_marker, option);
            case 1:
                // + | ---------------------------------------------
                // + | for global block matching type 
                let c = _marker.group[0];
                // + | update cursor position
                option.pos += c.length;
                // + | marker is not a line feed directive or buffer is not empty
                if ((!_marker.lineFeed) || (option.buffer.length > 0)) {
                    _info.append(c, _marker);
                    if (_marker.lineFeed)
                    {
                        option.lineFeedFlag = true;
                    }
                }
                return _marker.parent;
        }
        return null;
    }
    /**
     * restore buffer
     * @param {*} option 
     * @param {*} data 
     */
    _restoreBuffer(option, data) {
        option.debug && Debug.log('restore buffer');
        option.buffer = data.state.buffer;
        option.output = data.state.output; 
    }
    _backupMarkerSwapBuffer(option, _marker, l, _endRegex) {
        option.debug && Debug.log('backup and swap buffer.');
        const _inf = {
            marker: _marker,
            start: false,
            // content: l,
            endRegex: _endRegex,
            startBlock: _marker.isBlock ? 1 : 0, // start join mode 0|block = append new line before 
            state: {
                buffer: option.buffer,
                output: option.output
            }
        };
        (function(){
            var _content = '';
            Object.defineProperty(_inf, 'content', {
                get (){
                    return _content;
                },
                set(v){
                    console.log("store content :"+ v)
                    _content = v;
                }
            });
        })();
        _inf.content = l;
        option.unshiftMarker(_inf);
        option.buffer = '';
        option.output = [];
    }
    _updateOldMarker(_old, _marker, startLine, option){
        let _sbuffer = '';
        let _lf = _old.startBlock == 1 ? option.lineFeed : '';
        let _buffer = _old.content;
        const _info = option.listener;
        if (startLine) {
            if (_marker.preserveLineFeed) {
                _buffer += option.lineFeed;
            }
            if ((option.output.length > 0) || _old.startBlock) {
                _info.store();
                option.output.unshift('');
                _sbuffer = _info.output(true);
                _lf='';
            }
        } else {
            // append current buffer to 

            if ((option.output.length > 0) || _old.startBlock) {
                _info.store(); 
                _sbuffer = _info.output(true);
                _lf = '';

            } else {
                _sbuffer = option.buffer;
                _info.output(true);
                option.buffer = '';
            }

        }
        if (_sbuffer) {
            _buffer += _lf + _sbuffer;
        }
        _old.startBlock = 0;
        //  
        //  + | update old buffer content
        // this._restoreBuffer(option, _old);
        _old.content = _buffer;
        return _buffer;
    }
    _handleBeginEndMarker(_marker, option) {
        // start line context . 
        const { listener, startLine, debug } = option;

        let _old = null, _endRegex = null, _matcher = null, _buffer = null;
        let _start = true; 
        const _info = listener;
        console.log("---- begin/end ----");
        // move group forward
        // restore previous info marker 
        if ((option.markerInfo.length > 0) && (option.markerInfo[0].marker === _marker)) {
            _old = option.markerInfo.shift();
            // + | update buffer 
            // + | continue reading with this marker
            // + | update marker 
            _endRegex = _old.endRegex; 
            _start = _old.start;
            _buffer = this._updateOldMarker(_old, _marker, startLine, option);   
        }

        let _match_start = _marker.group[0];
        if (_start) {
            option.pos += _match_start.length;
            if (this._isBlockAndStart(_marker, option)){ 
                this._startNewBlock(_marker, option);
                _match_start = _marker.blockStart;
            }
            
        }
        _endRegex = _endRegex || _marker.endRegex(_marker.group);
        _matcher = Utils.GetPatternMatcher(_marker.patterns, option);
        _buffer = ((_buffer != null) ? _buffer : _match_start); 
        let l = option.line.substring(option.pos);

        if (l.length==0){
            if (_old){
                //continue pattern
                option.unshiftMarker(_old);
                return _old.marker; 
            }
            this._backupMarkerSwapBuffer(option, _marker, _buffer, _endRegex);
            return _marker;
        }

        let l_index = 0;
        let _p = l.length > 0 ? _endRegex.exec(l) : null;

        if ((_p ==null ) && (_matcher==null)){
console.log('both are is null');
        }


        if (_p) {
            l_index = _p.index;
            // + | exec and fix end position
            _p.index += option.pos;
        }
        if (_matcher == null) {
            // + | NO PATTERNS MATCH - END REACH
            if (_p) {
                // + | --------------------------------------------------
                // + | END FOUND
                // + | -------------------------------------------------- 
                l = l.substring(0, l_index)
                // + | block-start and end-on single line treatmen
                _info.treatEndCapture(_marker, _p, _endRegex);
                
                if (_marker.isBlock) {
                    return this._handleEndBlockMarker(_marker, _p, option, l, _start, _buffer, _endRegex, _old);
                }
                // TODO: not a block 
                let _end_def = _p[0];
                if (_old) { // restore old buffer 
                    this._restoreBuffer(option, _old);
                } 
                _buffer = (_start ? _marker.group[0] : _buffer) + l.substring(0, l_index);
                _buffer = _info.treatEndBufferCapture(_marker, _p, _endRegex, _buffer);
                _end_def = _p[0]; 
                l = _buffer + _end_def;
               
                // + | move cursor to contain [ expression ]
                option.pos += l_index + _p[0].length; 
                // consider parent to match if - transformProperty
                if (_marker.parent && _marker.transformToken){
                    debug && console.log("-- // transform token // "); 
                    let bck_ln = option.line; 
                    let bck_pos = option.pos; 
                    option.line = l;
                    option.pos = 0;
                    // console.log("460: "+_marker.parent.isBlock);
                    // _info.append("Before:", _marker, true); 
                    let _tmark = this._handleMarker(_marker.parent, option);
                    option.line = bck_ln;
                    option.pos = bck_pos;
                    return _tmark;
                }
                _info.append(l, _marker, true); 
                return _marker.parent;
            } else {
                // matcher and _p is null 
                if (startLine && !_marker.allowMultiline) {
                    throw new Error('do not allow multiline');
                } 
                if (_marker.isBlock && _start) { 
                    this._backupMarkerSwapBuffer(option, _marker, '', _endRegex);
                    _info.appendAndStore(l.trim());
                    option.output.unshift(_buffer);
                    option.markerInfo[0].content = _info.output(true); 
                    option.pos = option.line.length;
                    return _marker;
                } 
                // update group definition 
                // on start add buffer if no 
                if (_start) {
                    l = ((_buffer != null) ? _buffer : _marker.group[0]) + l;
                    this._backupMarkerSwapBuffer(option,_marker, l, _endRegex);
                } else {
                    if (_old) { // keep active the _old marker info 
                        option.debug && Debug.log("keep old state and update oldstate buffer");
                        if (startLine) {
                            _info.appendAndStore(l);
                        } else {
                            _old.content += l;
                        }
                        Formatters._UnshiftMarkerInfo(_info, _old);
                    }
                }
                option.pos = option.line.length;
                return _marker;
            }
        } else {
            if (_p) {
                if (_matcher.group.index < _p.index) {
                    l = _buffer;//+ l.substring(0, _matcher.group.index) + _matcher.group[0];
                    // + | update range position - then handle again
                    option.storeRange(option.pos, _matcher.group.index);
                    // + | leave the position
                    // option.pos = option.range.end - 1;
                    if (_old) {
                        Formatters._UnshiftMarkerInfo(_info, _old);
                    } else {
                        this._backupMarkerSwapBuffer(option,_marker, l, _endRegex);
                    }
                    option.continue = false;
                    option.storeRange(option.pos, _matcher.index);
                    return this._handleMarker(_matcher, option);
                }
                if (_matcher.group.index == _p.index) {
                    // + | matcher and end marker match the same position.
                    // + | - need to pass group or change the behaviour of the parent
                    return this._handleSameGroup(_marker, _matcher, _p, _old, _buffer, option, _endRegex);  
                } 
                return _matcher.parent;
            }
            // option.pos += _matcher.index - 1;
            // reduce the matching invocation 
            if (_marker.isBlock && !_old) {
                // 
                // let f = this._handleStartBlockMarker(_marker, _matcher, option, l, _start, _buffer, _endRegex, _old);
                this._backupMarkerSwapBuffer(option,_marker, _buffer, _endRegex);
                option.storeRange(option.pos, _matcher.index);
                let __s = this._handleMarker(_matcher, option, _info, startLine);
                return __s;
            }

            if (_old) {
                option.unshiftMarker(_old);
               // Formatters._UnshiftMarkerInfo(_info, _old);
            } else {
                this._backupMarkerSwapBuffer(option,_marker, _buffer, _endRegex);
            }

            option.continue = false;
            option.storeRange(option.pos, _matcher.index);
            let __s = this._handleMarker(_matcher, option, _info, startLine);
            return __s;
        }
    }
    /**
     * internal function 
     * @param {*} _marker 
     * @param {*} _matcher matcher match 
     * @param {*} _p end match
     * @param {*} _old 
     * @param {*} _buffer 
     * @param {*} option 
     * @param {*} _endRegex calculated end regex
     * @returns 
     */
    _handleSameGroup(_marker, _matcher, _p, _old, _buffer, option,_endRegex){
        const t = _matcher.matchType; 
        let l = '';
        switch(t){
            case 0: // begin/end matching
                throw new Error('not implement')
                break;
            case 1: // direct matching
                if (_matcher.group[0].length == 0){
                    // passing handle to parent buffer
                    let _start = false;
                    _marker.block = {
                        start: _marker.group[0],
                        end : _p[0]
                    };
                    l = option.line.substring(option.pos, _matcher.group.index);
                    option.pos = _p.index + _p[0].length;
                    return this._handleEndBlockMarker(_marker, _p, option, l, _start, _buffer, _endRegex, _old,{
                        tokenID: _matcher.tokenID || _marker.tokenID
                    });
                } else {
                    option.listener.append(_p[0], _marker);
                    _buffer += option.buffer; 
                    _marker.isBlock = true; // update parent property 
                    option.continue = false;
                    option.startBlock = true; 
                    this._startNewBlock(_marker, option); 
                    
                    
                    _marker.block = {
                        start: _buffer,
                        end: Utils.ReplaceRegexGroup('/'+_marker.block.end+'/', _marker.group)
                    };

                    if (!_old || (_old.marker != _marker)){
                        this._backupMarkerSwapBuffer(option, _marker, _buffer, _endRegex);
                    }else {
                        _old.content = _buffer;
                    }
                    if (_marker.isBlock){  
                        option.listener.startNewBlock(_marker);
                    }
                    option.markerInfo[0].start = false;
                    option.pos += _p[0].length;
                    return _marker; // this._handleMarker(_marker, option);
                }
                break;
        }
        return _marker;
    }
    /**
     * update parent property
     * @param {*} _matcher 
     */
    _updateParentProps(_matcher, option) {
        if (!_matcher.updateParentProps)
            return;
        const { isBlock, lineFeed } = _matcher.updateParentProps;
        const _bckBlock = _matcher.parent.isBlock;
        _matcher.parent.isBlock = isBlock || _matcher.parent.isBlock;
        _matcher.parent.lineFeed = lineFeed || _matcher.parent.lineFeed; 
    } 
    _handleEndBlockMarker(_marker, _p, option, l, _start, _buffer, _endRegex, _old, info) {
        const _info = option.listener;
        let _end = _marker.blockEnd;
        info = info || {};
        option.debug && Debug.log("// handle EndBlock - ");

        if (_start) {
            option.debug && Debug.log("start and end on single line : " + l);
            l = l.trim();
            if (l.length == 0) {
                // + | just append (block-start+block-end)
                _info.append(_buffer + _end.trim(), new EmptyBlockPattern);
                option.depth--;

            } else {
                // + | just indent block definition 
                this._backupMarkerSwapBuffer(option,_marker, _buffer, _endRegex);
                _info.appendAndStore('', _marker);  // start block
                // _info.store();
                _info.append(l); // append constant
                _info.store();
                option.depth--;
                _info.append(_end, {... _marker, ...info}); // end block
                _info.store();
                let g = _info.output(true);
                _old = option.markerInfo.shift();
                _buffer = [_old.content, g].join(option.lineFeed);
                this._restoreBuffer(option, _old);
                _info.append(_buffer, new BlockDefinitionPattern);
            }
        } else {
            option.output.push(_buffer);
            if (l.length > 0) {
                _info.appendAndStore(l);
            }
            option.depth--;
            _info.appendAndStore(_end);
            _buffer = _info.output(true);
            _old && this._restoreBuffer(option, _old);

            _info.appendAndStore(_buffer, new BlockDefinitionPattern)
        } 
        // + | update position 
        option.pos = _p.index + _p[0].length;
        // not start block 
        return _marker.parent;
    }

    static _UnshiftMarkerInfo(listener, _old) {
        if (_old) {
            listener.objClass.unshiftMarker(_old); // .markerInfo.unshift(_old);
        }
    }
}

class SpecialMeaningPatternBase extends Patterns {
    get isSpecial() { return true; }
}

class BlockPatternBase extends SpecialMeaningPatternBase {
    get isBlock() { return true; }
}
class EmptyBlockPattern extends BlockPatternBase {
    name = 'system.empty.block';
    get isEmptyBlock() { return true; }
}
class BlockDefinitionPattern extends BlockPatternBase {
    get isBlockDefinition() { return true };
    name = 'system.block.definition';
}

exports.Formatters = Formatters;
exports.Utils = Utils;
exports.Patterns = Patterns;
exports.JSonParser = JSonParser;