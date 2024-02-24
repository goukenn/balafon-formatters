Object.defineProperty(exports, '__esModule', {value:true});

const { Utils } = require("./Utils");
const { Patterns } = require("./Patterns");
const { JSonParser } = require("./JSonParser");

/**
 * formatters entry point
 */
class Formatters{
    patterns;
    repository;

    constructor(){  
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
            output : [],
            buffer : '',
            depth: depth,
            markerInfo : null, // store marker field info [{ marker:Pattern, buffer:string}]
            append(s){
                this.buffer += s;
            },
            store(){
                let s = this.buffer;
                s = s.trim();
                if (s.length>0){
                    this.output.push(tabStop.repeat(this.depth)+ s);
                }
            }
        };
        let objClass = {
            line:'',
            pos:0
        };
        Object.defineProperty(objClass, 'length', { get: function(){ return this.line.length ;}})

        data.forEach((line)=>{
            pos = 0;
            let _inf = {line, pos}
            let len = 0; //line.length;
            if (_marker){
                _marker = _formatter._handleMarker(_marker, _inf, _info, true);  
            }else{
                line = _inf.line.trimStart(); 
            } 
            len = line.length; 
            _inf.line = line; 
            pos = _inf.pos;

            while(pos<len){
                _inf.pos = pos;
                if (_marker){
                    _marker = _formatter._handleMarker(_marker, _inf, _info); 
                }

                _matcher = Utils.GetPatternMatcher(this.patterns, _inf);
                if (_matcher){
                    _marker = _formatter._handleMarker(_matcher, _inf, _info); 
                    pos = _inf.pos;
                }else{
                    pos = _inf.pos;
                    _info.append( _inf.line.substring(pos)); 
                    pos = _inf.line.length;
                }
                pos++;
            }
            _rg.line++;
        }); 
        _info.store();   
        return _info.output.join(lineFeed);
    }
    /**
     * handle marker 
     * @param {*} _marker 
     * @param {*} option 
     */
    _handleMarker(_marker, option, _info, startLine){
        if (!_marker)return;
        let _prev = option.line.substring(option.pos, option.pos + _marker.index);
        if (_prev.length>0){
            // append constants
            _info.append(_prev);
            option.pos+= _prev.length;
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
                option.pos += _p.index+_p[0].length; 
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