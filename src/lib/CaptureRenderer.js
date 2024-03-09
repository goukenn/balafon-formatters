"use strict";
Object.defineProperty(exports, '__esModule', {value:true});

class CaptureRenderer{
    matches;
    roots;
    subcaptures;
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
        return _o;
    }
    /**
     * 
     * @param {*} listener 
     * @param {*} captures 
     * @param {*} end 
     * @returns 
     */
    render(listener, captures, end=false ){ 
        if (!captures){
            throw new Error('missing captures info');
        }
        const { matches, roots } = this;
        let _input = matches[0];// .input.substring(matches.index);
        let _begin = 0;
        let _output = ''; 
        let treat_root = function (_input, root, listener, captures, tokens){
            let rf = root.value;
            let subchilds = [{root, output:[], treat:false, sub:false}];
            while(subchilds.length>0){
                let q = subchilds.shift();
                let {id}= q.root;
                if (q.treat){
                    continue;
                }
                if (!q.sub && q.root.childs.length>0){  
                    const childrens = q.root.childs.slice(0);
                    q.sub = true;
                    subchilds.unshift(q);
                    while(childrens.length>0){
                        let croot = childrens.pop();
                        subchilds.unshift({parent: q, treat:false, root: croot});
                    }
                }else{
                    rf = q.sub ? q.output : q.root.value;
                    tokens = tokens ? tokens.slice(0) : [];// default constant 
                    if (id in captures){
                        let cap = captures[id];
                        if (cap.name){
                            tokens.unshift(cap.name);
                        }
                        // treat pattern or other stuff 
                        if (end){
                            // special treatment for end captures
                            rf = end(rf, cap, id, listener);
                          
                        }
                    }  
                    if (Array.isArray(rf)){
                        const nv = q.root.value;
                        let offset = 0;
                        let _out = '';
                        let c = '';
                        rf.forEach(s=>{
                            c = treat_constant(nv.substring(offset, s.range[0]), listener);
                            let dt = c+s.rf;// +nv;//.substring(s.range[0]+s.range[1]);
                            offset = s.range[0]+s.range[1];
                            _out +=dt;
                        });
                        _out+= treat_constant(nv.substring(offset), listener);
                        rf = _out;
                    }
                    if (listener){
                        rf = listener.renderToken(rf, tokens); 
                    }
                    if (q.parent){
                        // update parent value.
                        let s = -q.parent.root.start + q.root.start;
                        let e = -q.root.start+ q.root.end;
                        let v =  q.parent.root.value;
                         
                        q.parent.output.push({range:[s,e], rf}); 
                    }

                    q.treat = true;
                }
            }

            return rf;
        };
        let treat_constant = function(c, listener){
            if (c.length>0){
                if (listener){
                    c = listener.renderToken(c, ['constant.definition']);
                }
            }
            return c;
        }
        let c = '';
        let _keys = Object.keys(roots);

        for(let j in roots){
            if ((j==0)&&(_keys.length>1)){
                continue;
            }
            let rt = roots[j];

            c = _input.substring(_begin, rt.start);
            c = treat_constant(c, listener); 
            _output += c;
            _output += treat_root(_input, rt,  listener,captures);
            _begin = rt.end;
        }
        if (_begin < _input.length){
            c = treat_constant(_input.substring(_begin), listener); 
            _output += c;
        } 
        return _output;
    }
}
exports.CaptureRenderer = CaptureRenderer;