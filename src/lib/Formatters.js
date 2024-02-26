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
        let depth = _rg.depth || 0;
        let _marker = null;
        let _formatter = this;
        let _matcher = null;
        // buffering info to handle buffer info
        let _info = new FormatterListener();

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
        Object.defineProperty(objClass, 'pos', {
            get: function () { return m_pos; }, set(v) {
                // console.log("set position", v);
                m_pos = v;
            }
        });

        _info.objClass = objClass;

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
                // objClass.startLine = true;
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
        if (_info.markerInfo.length>0){
            // missing close marker info
            let q = null;
            while(q = _info.markerInfo.shift()){
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
                option.pos += c.length;
                // + | update cusor position
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
    _backupMarkerSwapBuffer(_info, _marker, l, _endRegex) {
        _info.objClass.debug && Debug.log('backup and swap buffer.')
        Formatters._UnshiftMarkerInfo(_info, {
            marker: _marker,
            content: l,
            endRegex: _endRegex,
            startBlock: _marker.isBlock ? 1 : 0, // start join mode 0|block = append new line before 
            state: {
                buffer: _info.objClass.buffer,
                output: _info.objClass.output
            }
        });
        _info.objClass.buffer = '';
        _info.objClass.output = [];
    }
    _handleBeginEndMarker(_marker, option) {
        // start line context . 
        const { listener, startLine } = option;

        let _old = null, _endRegex = null, _matcher = null, _buffer = null;
        let _start = true;
        // let b = startLine ? 0 : 1;
        const _info = listener;
        // move group forward
        // restore previous info marker 
        if ((_info.markerInfo.length > 0) && (_info.markerInfo[0].marker === _marker)) {
            _old = _info.markerInfo.shift();
            // continue reading with this marker
            _endRegex = _old.endRegex;
            _buffer = _old.content;
            _start = false;
            let _sbuffer = '';
            let _lf = _old.startBlock == 1 ? option.lineFeed : '';

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
                    option.output.unshift('');
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
        }

        let _match_start = _marker.group[0];
        if (_start) {
            option.pos += _match_start.length;
            if (_marker.isBlock && !option.continue) {
                option.debug && Debug.log('start block:');
                option.buffer = option.buffer.trimEnd();
                _match_start = _marker.blockStart;
                option.depth++;
            }
        }
        _endRegex = _endRegex || _marker.endRegex(_marker.group);
        _matcher = Utils.GetPatternMatcher(_marker.patterns, option);
        _buffer = ((_buffer != null) ? _buffer : _match_start);


        let l = option.line.substring(option.pos);
        let l_index = 0;
        let _p = l.length > 0 ? _endRegex.exec(l) : null;
        if (_p) {
            l_index = _p.index;
            // + | exec and fix end position
            _p.index += option.pos;
        }
        if (_matcher == null) {
            if (_p) {
                // + | --------------------------------------------------
                // + | END FOUND
                // + | --------------------------------------------------
                // const _gp_start = (_start ? _marker.group[0] : _buffer);
                l = l.substring(0, l_index)
                // + | block-start and end-on single line treatmen
                _info.treatEndCapture(_marker, _p, _endRegex);
                
                if (_marker.isBlock) {
                    return this._handleEndBlockMarker(_marker, _p, option, l, _start, _buffer, _endRegex, _old);
                }
                // TODO: not a block 
                let _end_def = _p[0];
                if (_old) {
                    this._restoreBuffer(option, _old);
                }
                if (_marker.isBlock) {
                    _end_def = '';
                    Debug.log('end block:');
                    option.depth--;
                }
                l = (_start ? _marker.group[0] : _buffer) + l.substring(0, l_index) + _end_def;
                _info.append(l, _marker, true);
                // if (_marker.isBlock) {
                //     _info.store();
                //     _info.append(_marker.blockEnd);
                //     _info.store();

                // }
                // + | move cursor to contain [ expression ]
                option.pos += l_index + _p[0].length;
                return _marker.parent;
            } else {
                if (startLine && !_marker.allowMultiline) {
                    throw new Error('do not allow multiline');
                }

                if (_marker.isBlock && _start) {

                    this._backupMarkerSwapBuffer(_info, _marker, '', _endRegex);
                    _info.appendAndStore(l.trim());
                    option.output.unshift(_buffer);
                    _info.markerInfo[0].content = _info.output(true);

                    option.pos = option.line.length;
                    return _marker;
                }


                // update group definition 
                // on start add buffer if no 
                if (_start) {
                    l = ((_buffer != null) ? _buffer : _marker.group[0]) + l;
                    this._backupMarkerSwapBuffer(_info, _marker, l, _endRegex);
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
                        this._backupMarkerSwapBuffer(_info, _marker, l, _endRegex);
                    }
                    option.continue = false;
                    option.storeRange(option.pos, _matcher.index);
                    return this._handleMarker(_matcher, option);
                } 
                // end found
                return _matcher.parent;
            }
            // option.pos += _matcher.index - 1;
            // reduce the matching invocation 
            if (_marker.isBlock && !_old){
                // 
                // let f = this._handleStartBlockMarker(_marker, _matcher, option, l, _start, _buffer, _endRegex, _old);
                this._backupMarkerSwapBuffer(_info, _marker, _buffer, _endRegex);
                option.storeRange(option.pos, _matcher.index);
                let __s = this._handleMarker(_matcher, option, _info, startLine);
                return __s;
            }

            if (_old){
                Formatters._UnshiftMarkerInfo(_info, _old);
            } else {
                this._backupMarkerSwapBuffer(_info, _marker, _buffer, _endRegex);
            }

            option.continue = false;
            option.storeRange(option.pos, _matcher.index);
            let __s = this._handleMarker(_matcher, option, _info, startLine);
            return __s;
        }
    }


    _handleEndBlockMarker(_marker, _p, option, l, _start, _buffer, _endRegex, _old) {
        const _info = option.listener; 
        let _end = _marker.blockEnd;
        if (_start) {
            option.debug && Debug.log("start and end on single line : " + l);
            l = l.trim();
            if (l.length == 0) {
                // + | just append (block-start+block-end)
                _info.append(_buffer + _end.trim(), new EmptyBlockPattern);
                option.depth--;

            } else {
                // + | just indent block definition 
                this._backupMarkerSwapBuffer(_info, _marker, _buffer, _endRegex);
                _info.appendAndStore('', _marker);  // start block
                _info.store();
                _info.append(l); // append constant
                _info.store();
                option.depth--;
                _info.append(_end, _marker); // end block
                _info.store();
                let g = _info.output();
                _old = _info.markerInfo.shift();
                _buffer = [_old.content, g].join(option.lineFeed);
                this._restoreBuffer(option, _old);
                _info.append(_buffer, new BlockDefinitionPattern);
            }
        } else {
            option.output.push(_buffer);
            if (l.length > 0){
                _info.appendAndStore(l);
            }
            option.depth--;
            _info.appendAndStore(_end);
            _buffer = _info.output(true);
            _old && this._restoreBuffer(option, _old);
            
            _info.appendAndStore(_buffer, new BlockDefinitionPattern)
        }
        
        
        option.pos = _p.index + 1;
        // not start block 


        return _marker.parent;
    }

    static _UnshiftMarkerInfo(listener, _old) {
        if (_old) {
            listener.markerInfo.unshift(_old);
        }
    }
}

class SpecialMeaningPatternBase extends Patterns {
    get isSpecial() { return true; }
}

class BlockPatternBase extends SpecialMeaningPatternBase{
    get isBlock(){return true;}
}
class EmptyBlockPattern extends BlockPatternBase {
    name = 'system.empty.block';
    get isEmptyBlock(){return true;}
}
class BlockDefinitionPattern extends BlockPatternBase {
    get isBlockDefinition(){ return true};
    name = 'system.block.definition';
}

exports.Formatters = Formatters;
exports.Utils = Utils;
exports.Patterns = Patterns;
exports.JSonParser = JSonParser;