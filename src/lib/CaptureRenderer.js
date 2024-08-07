"use strict";
Object.defineProperty(exports, '__esModule', {value:true});

const { FormatterMatchTreatment } = require('./FormatterMatchTreatment');
const { FormatterOptions } = require('./FormatterOptions');
const { FormatterSyntaxException } = require('./FormatterSyntaxException');
const { Utils } = require('./Utils');
class CaptureRenderer{
    matches;
    roots;
    subcaptures;
    token;
    /**
     * null or capture renderer
     * @param {*} matches 
     * @param {string} token base token name
     * @returns {null|CaptureRenderer}
     */
    static CreateFromGroup(matches, token='constant'){
        function get_matche_token_info(matches, token='constant'){
            if (!matches){
                throw new Error('matches missing')
            } 
            let _t = matches[0]; 
            if (matches.length<1){
                return {value:_t, token: token};
            }
            const {indices} = matches;
            if (typeof(indices) == 'undefined'){
                console.log("missing [d] flag");
                return null;
            }
            let _startIndex = indices[0][0];
            let rootgroup = {};
            let subcaptures = {};
            let _troot = null;
            let _offset = 0;
            let _info = null;
            let chain_root = function(_troot, i){
                subcaptures[i] = _troot;
                rootgroup[i] = _troot;
            }
            let begin_root = function(idx, v, range, i){
                _offset = idx+v.length;
                _troot = def_info(range, v, null, i); 
                chain_root(_troot, i);
                _info = null;
            }
            let info_contains = function (s, d){
                return ((s.start<=d.start)&&(s.end>=d.end));
            }
            let def_info = function(range, v, parent, id){
                return {...range, value:v,id, get index(){ return this.start + matches.index; }, parent: parent, childs:[]};
            }
            let lp;
            let range;
         
            for(let i = 1; i < matches.length; i++){
                lp = indices[i];
                if (typeof(lp)=='undefined'){
                    subcaptures[i] = {value: undefined};
                    continue;
                }
                let v = matches[i];
                range = {start:lp[0] - _startIndex,end:lp[1] - _startIndex}; // range to litteral captured string
                let idx = _t.indexOf(v, _offset); 
                if (_troot==null){ 
                    // first root 
                    begin_root(idx,v, range, i);
            
                }else{
                    // check for group
                    if((_troot.start == range.start) && (_troot.end==range.end))
                    {
                        // skip the same root capture property 
                        subcaptures[i] = _troot;
                    } else {
                        if ((_troot.start<= range.start) && (_troot.end>=range.end)){
                            if (_info && info_contains(_info, range)){
                                // create and info with
                                let _minfo = def_info(range, v, _info, i);
                                _info = _minfo;
                            }else{
                                _info = def_info(range, v, _troot, i); // {...range, value:v, get index(){ return this.start - matches.index; }, parent: _troot};
                                _troot.childs.push(_info);
                            }
        
                            subcaptures[i] = _info;
                        }else{
                            // begin a new root
                            begin_root(idx,v, range, i);
                        }
                    }
                }
            }
            // register to group top group
            if (_t.length>0){
                lp = indices[0];
                range = {start:lp[0] - _startIndex,end:lp[1] - _startIndex};
                chain_root (def_info(range, matches[0], null, 0), 0); 
            }
            return {matches, roots: rootgroup, subcaptures: subcaptures};
        }
        const _info = get_matche_token_info(matches, token);
        if(!_info){
            return null;
        }
        const { roots , subcaptures } = _info;
        let _o = new CaptureRenderer;
        _o.roots = roots;
        _o.matches = _info.matches;
        _o.subcaptures = subcaptures;
        _o.token = token;
        return _o;
    }
    /**
     * 
     * @param {*} listener 
     * @param {*} captures 
     * @param {false|(rf, cap, id, listener):string} end 
     * @param {*} tokens 
     * @param {*|{debug:bool}} option 
     * @param {*|{treat:bool}} params 
     * @returns 
     */
    render(listener, captures, end, tokens, option, outdefine, treat=true){ 
        if (!captures){
            throw new Error('missing captures info');
        }
        if (!outdefine){
            throw new Error('missing outdefine info');
        }
        const self = this;
        const { matches, roots } = self;
        const { debug, engine} = option;
        let _input = matches[0];// .input.substring(matches.index);
        let _begin = 0;
        let _output = ''; 
        let _formatter = option.formatter;
        let treat_root = function (_input, root, listener, captures, tokens, refData){
            // treat rf value
            let rf = root.value;
            let rd = rf;
            let subchilds = [{root, output:[], treat:false, sub:false}];
            let _end = false;
            while(subchilds.length>0){
                let q = subchilds.shift();
                let {id}= q.root;
                if (q.treat){
                    continue;
                }
                _end = false;
                if (!q.sub && q.root.childs.length>0){  
                    const childrens = q.root.childs.slice(0);
                    q.sub = true;
                    subchilds.unshift(q);
                    while(childrens.length>0){
                        let croot = childrens.pop();
                        subchilds.unshift({parent: q, treat:false, root: croot, sub:false});
                    }
                }else{
                    rf = q.sub ? q.output : q.root.value;
                    tokens = tokens ? tokens.slice(0) : [];// default constant 
                    let tokenID = null;
                    let cap = null;
                   
                    if (Array.isArray(rf)){
                        // + | transform reference to rf 
                        const nv = q.root.value;
                        let offset = 0;
                        let _out = '';
                        let c = '';
                        // + | glue value to for rendering
                        rf.forEach(s=>{
                            // c = treat_constant(nv.substring(offset, s.range[0]), listener);
                            c = nv.substring(offset, s.range[0]);//, listener);
                            let dt = c+s.rf;
                            offset = s.range[0]+s.range[1];
                            _out +=dt;
                        });
                        // _out+= treat_constant(nv.substring(offset), listener);
                        _out+= nv.substring(offset);//, listener);
                        rf = _out;
                    }
                    let _treat_pattern = false;
                    const _op = FormatterMatchTreatment.Init(rf);
                    if (id in captures){
                        cap = captures[id];
                        if (cap.throwError){
                            //+ | use match to handle throw error
                            let e_obj = CaptureRenderer.CheckError(cap.throwError, rf, option); 
                            if (e_obj){
                                throw e_obj;
                            }
                        } 
                        if (cap.name){
                            Utils.StoreTokens(cap.name, tokens);
                        }
                        if (cap.tokenID){
                            tokenID = cap.tokenID;
                        }
                        // treat pattern or other stuff 
                        if (end){
                            // special treatment for end captures
                            rd = rf;
                            rf = end(rf, cap, id, listener, {tokens, engine, debug, tokenID});
                            _end = true; 
                        } else {
                            // treat value. cap
                            if(_formatter){
                                rf = _formatter.treatMarkerValue(cap, rf, _op, option, self.matches);

                            }else{
                                if (cap.transform){
                                    rf = Utils.StringValueTransform(rf, cap.transform); 
                                }  
                            }  
                            if (cap.patterns?.length>0){
                                const _bckTokens = option.tokenList.slice(0);
                                option.tokenList = tokens.slice(0, tokens.length-1);
                                rf = Utils.TreatPatternValue(rf, cap.patterns, 
                                    self.matches, option);
                                _treat_pattern = true;

                                option.tokenList = _bckTokens;
                            }
                        }
                    } 
                    if (listener && !_treat_pattern && listener.renderToken){
                        
                        rd = rf;
                        rf = _end || !rf ? rf : rf.length>0? listener.renderToken(rf, tokens, tokenID, engine, debug, cap, option) : ''; 
                    }
                    if (q.parent){
                        // update parent value.
                        let s =  q.root.start - q.parent.root.start;
                        let e =  q.root.end - q.root.start;
                        // + | transform to range - at [start_index, length] of nv to replace
                        if (rf.length>0){
                            q.parent.output.push({range:[s,e], rf, rd}); 
                        }
                    }
                    q.treat = true;
                }
            }
            refData.data = rd;
            return rf;
        };
        let treat_constant = function(c, listener){
            if (treat && (c.length>0)){
                if (listener){
                    c = listener.renderToken(c, ['constant.definition'], 'constant', engine, debug, null, option);
                }
            }
            return c;
        }
        let c = '';
        let d = '';
        let _keys = Object.keys(roots);
        let _Capkeys = Object.keys(captures);
        let _root_only = ( 0 in captures) && (_Capkeys.length==1);
        let _ref_data = {data:null, input:_input, bufferSegment:[],dataSegment:[]};
        for(let j in roots){ 
            if ( !_root_only && ((j==0)&&(_keys.length>1))){
                continue;
            }
            let rt = roots[j];

            c = _input.substring(_begin, rt.start);
            if (c.length>0){
                d += c; 
                _ref_data.dataSegment.push(c);
                c = treat_constant(c, listener); 
                _output += c;   
                _ref_data.bufferSegment.push(c);
            }         
            c = treat_root(_input, rt,listener,captures,tokens,_ref_data);
            _output += c;
            _begin = rt.end;
            d+=_ref_data.data;
            _ref_data.dataSegment.push(_ref_data.data);
            _ref_data.bufferSegment.push(c);
            if (_root_only)
                break;
        }
        if (_begin < _input.length){
            let l = _input.substring(_begin);
            d+= l;
            _ref_data.dataSegment.push(l);
            c = treat_constant(l, listener); 
            _output += c;
            _ref_data.bufferSegment.push(c);
        } 
        if (outdefine){ 
            outdefine.bufferSegment = _ref_data.bufferSegment;
            outdefine.dataSegment = _ref_data.dataSegment;
        }
        return _output;
    }
    /**
     * 
     * @param {*} error 
     * @param {string} rf 
     * @param {FormatterOptions} option 
     * @returns 
     */
    static CheckError(error, rf, option){
        let e_obj = null;
        let message = null , match = null;
        let _error = true;
        if (typeof(error) == 'object'){
            ({message, match} = error);
        } else{
            message = error;
        }
        if (match){
            const regex = typeof(match)=='string'? new RegExp(match) : match;
            _error = regex.test(rf);
        }  
        if (_error){ 
            e_obj= new FormatterSyntaxException(message, option);
        }
        return e_obj;
    }
}
exports.CaptureRenderer = CaptureRenderer;