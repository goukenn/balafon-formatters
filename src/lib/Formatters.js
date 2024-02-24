"use strict";
Object.defineProperty(exports, '__esModule', {value:true});

const { Utils } = require("./Utils");
const { Patterns } = require("./Patterns");
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
    json_parse(parser, fieldname, data){
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
            return fc(data, parser);
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
            append(s){
                let _o = this.objClass;
                if (!_o) return;
                if (_o.debug) { 
                    Debug.log('append: '+ s);
                } 
                if (_o.lineJoin){
                    _o.buffer = this.objClass.buffer.trimEnd()+' ';
                    _o.lineJoin = false;
                }
                _o.buffer += s;
            },
            store(){
                let s = this.objClass.buffer;
                let d = this.objClass.depth;
                s = s.trim();
                if (s.length>0){
                    this.objClass.output.push(tabStop.repeat(d)+ s);
                }
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
            
            objClass.resetRange();
            objClass.line = line;
            objClass.pos = 0;
            objClass.continue = false;
            objClass.lineCount++;
            
            if (_marker){
                objClass.continue = true;
                objClass.lineJoin = false;
                if (!_marker.allowMultiline){
                    throw new Error(`marker '${_marker.name}' do not allow multi line definition.`);
                }

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
                _info.append(c);
                option.pos+= c.length - b;
                return _marker.parent; 
        }
        return null;
    }
    _handleBeginEndMarker(_marker, option, _info, startLine){
        // + | for begin/end marker logic
        if (!_info.markerInfo){
            _info.markerInfo = [];
        }
        let _old=null , _endRegex=null, _matcher=null, _buffer =null;
        let _start = true;
        let b = startLine ? 0 : 1;
        // move group forward
       
        _old = _info.markerInfo.shift();
        
        if (_old){
            if (_old.marker == _marker)
            {
                // continue reading with this marker
                _endRegex = _old.endRegex;
                _buffer = _old.content;
                _start = false;
                if (startLine){
                    if (_marker.preserveLineFeed){
                        _buffer+= option.lineFeed;
                    }
                }
            }
        }
        if (_start){
            option.pos += _marker.group[0].length;
        }
        _endRegex = _endRegex || _marker.endRegex(_marker.group);
        _matcher = Utils.GetPatternMatcher(_marker.patterns, option);
        _buffer = ((_buffer!=null) ? _buffer : _marker.group[0]);

        let l = option.line.substring(option.pos);
        let _p = _endRegex.exec(l);
        if (_matcher==null){
            if (_p){
                // + | end found
                l = (_start ? _marker.group[0] : _buffer)+l.substring(0, _p.index)+_p[0];
                _info.append(l);
                // + | move cursor to contain [ expression ]
                option.pos += _p.index+_p[0].length-b; 
                return _marker.parent;
            } else {
                if (startLine && !_marker.allowMultiline){
                    throw new Error('do not allow multiline');
                }
                // update group definition 
                l = ((_buffer!=null) ? _buffer : _marker.group[0])+l;
                _info.markerInfo.push({
                    marker : _marker,
                    content : l,
                    endRegex : _endRegex,
                }); 
                option.pos = option.line.length;
                return _marker;
            }
        } else {
            if (_p){
                if (_matcher.group.index < _p.index)
                {
                    l = _buffer+ l.substring(0, _matcher.group.index)+_matcher.group[0];// ((_buffer!=null) ? _buffer : _marker.group[0])+l;
              
                    option.pos += _matcher.group.index+_matcher.group[0].length-b;
                    _info.markerInfo.push({
                        marker : _marker,
                        content : l,
                        endRegex : _endRegex,
                    }); 
                }
                // end found
                return _matcher.parent;
            }
        }

    }
    _store(_out, s, tabStop, depth){
        s = s.trim();
        if (s.length>0){
            _out.push(tabStop.repeat(depth)+ s);
        }
    }
    append(s){
        this.buffer +=s;
    }
}


exports.Formatters = Formatters;
exports.Utils = Utils;
exports.Patterns = Patterns;
exports.JSonParser = JSonParser;