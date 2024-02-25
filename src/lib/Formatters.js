"use strict";
Object.defineProperty(exports, '__esModule', {value:true});

const { Utils } = require("./Utils");
const { Patterns } = require("./Patterns");
const { RefPatterns } = require("./RefPatterns");
const { JSonParser } = require("./JSonParser");
const { Debug } = require("./Debug");

/**
 * formatters entry point
 */
class Formatters{
    patterns;
    repository;
    debug; // allow debug

    constructor(){  
        this.debug = false;
        this.patterns = [];
        this.repository = {};
    }
    get lineFeed(){
        return this.m_option.lineFeed;
    }
    set lineFeed(value){
        this.m_option = value;
    }
    /**
     * validate current field name
     * @param {*} field_name 
     * @param {*} d 
     * @returns bool
     */
    json_validate(field_name, d, throw_on_error){
        const validator = {
            patterns(d){
                return Array.isArray(d);
            },
            repository(d){
                return typeof(d)=='object';
            },
            debug(d){
                return typeof(d)=='boolean' || /(yes|no|1|0)/.test(d);
            }
        };
        let f = validator[field_name];
        if (f && !f(d)){
            if (throw_on_error){
                throw new Error(`[${field_name}] is not valid`);
            }
            return false;
        }
        return true;
    }
    json_parse(parser, fieldname, data, refKey){
        const patterns = Utils.ArrayParser(Patterns);
        const parse = {
            patterns,
            repository(d,parser){
                let _out = {};
                let _o = null;
                for(let i in d){
                    _o = new Patterns();
                    JSonParser._LoadData(parser, _o, d[i]);
                    _out[i] = _o;
                }
                return _out;
            },
            debug(d){
                if(typeof(d)== 'boolean'){
                    return d;
                }
                return !(!d);
            } 
        };
        let fc = parse[fieldname];
        if (fc){
            return fc(data, parser, refKey);
        }
        return data;
    }
    static CreateFrom(data){
        const formatter = Utils.JSonParseData(Formatters, data);

        return formatter;
    }
    static CreateDefaultOption(){
        return {
            lineFeed:"\n",
            tabStop:"\t",
            depth:0,
            line:0
        }
    }
    format(data, option){
        const _rg =  option || Formatters.CreateDefaultOption();
        const {lineFeed, tabStop} =_rg;
        let depth = _rg.depth || 0; 
        let pos = 0;  
        let _marker = null; 
        let _formatter = this;
        let _matcher = null;
        // buffering info to handle buffer info
        let _info = {  
            markerInfo : null, // store marker field info [{ marker:Pattern, buffer:string}]
            objClass:null,
            /**
             * append 
             * @param {string} s 
             * @param {Patterns} _marker 
             * @returns 
             */
            append(s, _marker){
                let _o = this.objClass;
                if (!_o) return;
                if (s.length==0) return;

                if (_o.debug) { 
                    Debug.log('append: '+ s);
                } 
                if (_o.lineJoin){
                    _o.buffer = this.objClass.buffer.trimEnd()+' ';
                    _o.lineJoin = false;
                }
                _o.buffer += s;
            },
            /**
             * store the current buffer.
             */
            store(){
                const _o = this.objClass;
                let s = _o.buffer;
                let d = _o.depth;
                s = s.trim();
                if (s.length>0){
                    _o.output.push(tabStop.repeat(d)+ s);
                }
                _o.buffer = '';
            },
            output(clear){
                const _o = this.objClass;
                let _s = _o.output.join(lineFeed);
                if (clear){
                    _o.output = [];
                }
                return _s;
            }
        };
        let objClass = {
            line:'',
            pos:0,
            lineCount:0,
            depth:0,
            continue:false,
            lineJoin:false,
            buffer:'',
            output:[], // output result
            listener : _info,
            debug: _formatter.debug,
            lineFeed,
            range:{
                start:0, // start position
                end:0    // number end position range
            },
            resetRange(){
                this.storeRange(0,0); 
            },
            /**
             * store range 
             * @param {number} start 
             * @param {number} end if optional 
             */
            storeRange(start,end){
                this.range.start = start;
                this.range.end = typeof(end)=='undefined' ? start: end;
            }
        };
        Object.defineProperty(objClass, 'length', { get: function(){ return this.line.length ;}})

        _info.objClass = objClass;

        data.forEach((line)=>{
            Debug.log('read: '+objClass.lineCount+" :> "+line);
            objClass.resetRange();
            objClass.line = line;
            objClass.pos = 0;
            objClass.continue = false;
            objClass.lineCount++;
            
            if (_marker){
                if (!_marker.allowMultiline){
                    throw new Error(`marker '${_marker.name}' do not allow multi line definition.`);
                }
                objClass.continue = true;
                objClass.lineJoin = false;

                _marker = _formatter._handleMarker(_marker, objClass, _info, true);  
            } else {
                objClass.line = objClass.line.trimStart();
            }
            if (line.length<=0){
                return;
            }
            let ln = objClass.length;
            let pos = objClass.pos;
            while(pos<ln){
                objClass.continue = false;
                objClass.pos = pos;
                if (_marker){
                    objClass.continue = true;
                    objClass.storeRange(objClass.pos);
                    _marker = _formatter._handleMarker(_marker, objClass, _info); 
                }
                _matcher = Utils.GetPatternMatcher(this.patterns, objClass);
                if (_matcher){
                    objClass.storeRange(pos, _matcher.index);   
                    _marker = _formatter._handleMarker(_matcher, objClass, _info); 
                    pos = objClass.pos;
                }else{
                    pos = objClass.pos;
                    _info.append( objClass.line.substring(pos)); 
                    pos = objClass.line.length;
                }
                pos++;
            }
            objClass.lineJoin = true;
        });
     
        _info.store();   
        return objClass.output.join(lineFeed);
    }
    /**
     * handle marker 
     * @param {*} _marker 
     * @param {*} option 
     */
    _handleMarker(_marker, option, _info, startLine){
        if (!_marker)return;
        if (!option.continue){ 
            let _prev = option.line.substring(option.range.start, option.range.end);   

            if (_prev.length>0){
                // append constants
                _info.append(_prev);
                option.pos+= _prev.length;
            }
            option.storeRange(option.pos, option.pos);

           
        }
 
        let b = startLine ? 0 : 1;
        switch(_marker.matchType){
            case 0:
                return this._handleBeginEndMarker(_marker, option, _info, startLine); 
            case 1:
                // + | for matching type 
                let c = _marker.group[0];
                _info.append(c, _marker);
                option.pos+= c.length - b;
                return _marker.parent; 
        }
        return null;
    }
    _restoreBuffer(_info, data){
        Debug.log('restore buffer');
        _info.buffer = data.state.buffer;
        _info.output = data.state.output;
    }
    _backupMarkerSwapBuffer(_info, _marker, l, _endRegex){
        Debug.log('backup and swap buffer.')
        _info.markerInfo.unshift({
            marker : _marker,
            content : l,
            endRegex : _endRegex,
            state:{
                buffer : _info.objClass.buffer,
                output : _info.objClass.output
            }
        }); 
        _info.objClass.buffer = '';
        _info.objClass.output= [];
    }
    _handleBeginEndMarker(_marker, option, _info, startLine){ // start line context . 
        // + | for begin/end marker logic
        if (!_info.markerInfo){
            _info.markerInfo = [];
        }
        let _old=null , _endRegex=null, _matcher=null, _buffer =null;
        let _start = true;
        let b = startLine ? 0 : 1;
        // move group forward
        // restore previous info marker 
        if ((_info.markerInfo.length>0)&&(_info.markerInfo[0].marker === _marker )){
            _old = _info.markerInfo.shift();
             // continue reading with this marker
             _endRegex = _old.endRegex;
             _buffer = _old.content;
             _start = false;
             if (startLine){
                 if (_marker.preserveLineFeed){
                    _buffer+= option.lineFeed;
                 }
             }
             _info.store();
             let _sbuffer = _info.output(true);
             if (_sbuffer){
                 _buffer += option.lineFeed+_sbuffer;
             }
            //  
            //  + | update old buffer content
            // this._restoreBuffer(option, _old);
             _old.content = _buffer;
        }
       
        let _match_start = _marker.group[0];
        if (_start){
            option.pos += _match_start.length;
            if (_marker.isBlock && !option.continue ){  
                Debug.log('start block:'); 
                option.buffer = option.buffer.trimEnd(); 
                _match_start = _marker.blockStart;  
                option.depth++;
            }
        }
        _endRegex = _endRegex || _marker.endRegex(_marker.group);
        _matcher = Utils.GetPatternMatcher(_marker.patterns, option);
        _buffer = ((_buffer!=null) ? _buffer : _match_start);

      


        let l = option.line.substring(option.pos);
        let _p = l.length>0? _endRegex.exec(l) : null;
        if (_matcher==null){
            if (_p){
                // + | end found
                let _end_def = _p[0]; 
                if (_old){ 
                    this._restoreBuffer(option, _old);
                }
                if (_marker.isBlock){ 
                    _end_def = '';// _marker.blockEnd;
                    Debug.log('end block:');
                    option.depth--;
                } 
                l = (_start ? _marker.group[0] : _buffer)+l.substring(0, _p.index)+_end_def;
                _info.append(l);
                if (_marker.isBlock){ 
                    _info.store();
                    _info.append(_marker.blockEnd);
                    _info.store();

                }
                // + | move cursor to contain [ expression ]
                option.pos += _p.index+_p[0].length-b; 
                return _marker.parent;
            } else {
                if (startLine && !_marker.allowMultiline){
                    throw new Error('do not allow multiline');
                }
                // update group definition 
                // on start add buffer if no 
                if (_start){
                    l = ((_buffer!=null) ? _buffer : _marker.group[0])+l; 
                    this._backupMarkerSwapBuffer(_info, _marker, l, _endRegex);  
                } else {
                    if (_old){ // keep active the _old marker info 
                        Debug.log("keep old state and update oldstate buffer");
                        if (startLine){
                            _info.append('on mark:'+l);
                        }else{
                            _old.content += l;
                        }
                        _info.markerInfo.unshift(_old);
                    }
                }
                option.pos = option.line.length;
                return _marker;
            }
        } else {
            if (_p){
                if (_matcher.group.index < _p.index)
                {
                    l = _buffer+ l.substring(0, _matcher.group.index)+_matcher.group[0];
                    option.pos += _matcher.group.index+_matcher.group[0].length-b;
                    _start && this._backupMarkerSwapBuffer(_info, _marker, l, _endRegex); 
                } else {
                    //
                    console.log("restore .... ");

                }
                // end found
                return _matcher.parent;
            }
            // option.pos += _matcher.index - 1;
            // reduce the matching invocation 
            if (_old){
                _info.markerInfo.unshift(_old); 
            }
            option.continue = false;
            option.storeRange(option.pos, _matcher.index);
            let __s= this._handleMarker(_matcher, option, _info, startLine);
            return __s;
        }

    } 
}


exports.Formatters = Formatters;
exports.Utils = Utils;
exports.Patterns = Patterns;
exports.JSonParser = JSonParser;