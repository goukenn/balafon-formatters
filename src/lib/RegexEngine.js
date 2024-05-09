"use strict";
Object.defineProperty(exports, '__esModule', {value:true});

const { RegexUtils } = require("./RegexUtils")




class RegexEngine{
    info;

    constructor(def, empty){ 
        const _reg = def;
        var _type;
        Object.defineProperty(this, '_regex', {get(){return _reg;}});
        Object.defineProperty(this, '_type', {get(){return _type;}});
        Object.defineProperty(this, 'isEmpty', {get(){return empty;}});

        this._store =(e)=>{
            _reg.push(e);
        };
        this._clear =()=>{ _reg.length = 0; };
        this._changeType = (f)=>{
            _type = f;
        };
    }
    toString(){
        if (this._regex.length==1){
            return this._regex[0].toString();
        }
        return this.info.s;
    }
    static Load(expression, empty){
        if (!expression){
            return null;
        }
        if (empty){
            return new RegexEngine([expression], empty);
        }
        let _flag = null;
        if (typeof(expression)!='string'){
            expression = expression.toString();
            let ind = expression.lastIndexOf("/");
            let option = expression.substring(ind+1);
            expression = expression.substring(0, ind+1).slice(1,-1);
            if (option){
                let moption = [];
                if (option.indexOf('i')!=-1) moption['i'] = 'i';
                if (option.indexOf('m')!=-1) moption['m'] = 'm';
                if (option.indexOf('d')!=-1) _flag = 'd';
                // - //
                if (moption.length>0){
                    expression = "(?"+moption.join("|")+")"+expression;
                }
            }
            //expression = expression.slice(1,-1);
        }
        let inf = RegexUtils.RegexInfo(expression);
        let _s = inf.s;
        //treat 
        let _offset = 0;
        let _p = null;
        let _start = 0;
        let _def = [];
        let _match = /\(\?[i]:/d;
        let _ss = null;
        let _is_extended = inf.option.indexOf('x')!=-1;
        inf.option = inf.option.replace("x",'');
        if (_flag){
            inf.option+= _flag;
        }

        if (_is_extended){
            let lit = inf.s.split("\n");
            let _gt = [];
            lit.forEach(i=>{
                i = i.trimStart();
                if (/^#/.test(i)) return;
                i = i.replace(/^\| /, "|");
                _gt.push(i);
                //
            })
            _s = _gt.join('');
            inf.s = _s; 

        }


        while (_p = _match.exec(_s)){
            // remove section flags - then 
            _offset = _p.index;
            let _pre_exec = _s.substring(0, _offset);
            if (!_start){
                _def.push(new RegExp(_pre_exec, inf.option));
            } 
            let _ms = _s.substring(_offset);
            _s = _ss = _ms.replace(_match, "(?:");
            _ss = RegexUtils.ReadBrank(_ss, 0, 0);
            if (_match.test(_ss)){
                // contains sub activated flags
                throw new Error("contains sub activate flag - not allowed")
            }
            _def.push(new RegExp(_ss, "i")); 
            _offset = _ss.length;
            _s = _s.substring(_offset);
        } 
        if (_s.length>0){
            _def.push(new RegExp(_s, _def.length>0?'': inf.option));  
        }

        if (_def.length>0){
            let _engine = new RegexEngine(_def);  
            _engine.info = inf; 
            return _engine;
        }
        return null;
    }
    test(l){
        return this.exec(l) !==null;
    }
    exec(l){
        if (this.isEmpty){
            return null;
        }
        let _cond = true;
        let _q = this._regex.slice();
        let _ret = null;
        let _gret = null;
        let _index = 0;
        while(_cond && (_q.length>0)){
            let m = _q.shift();
            _ret = m.exec(l);
            if (_ret){
                if (_gret==null){
                    // initial source
                    _gret = _ret;
                }else{
                    // update gret
                    // update group 
                    _gret[0] += _ret[0];
                    _index+= _ret[0].length;
                    l = l.substring(_index);
                }
            }else{
                _cond = false;
                _gret = null;
            }
        }
        return _gret;
    }   
}

exports.RegexEngine = RegexEngine;