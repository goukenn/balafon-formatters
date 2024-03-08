"use strict";

class TokenScopeInfo{
    constructor(scope){
        this.toString = function(){
            return scope.join(',');
        }
    }
}
class TokenList{
    constructor(){
        var m_list = [];

        Object.defineProperty(this, 'list', { get(){return m_list;}});

        this.add = function({value, token, scope, childs}){
            if (typeof(value)!='string'){
                throw new Error("value is not a string");
            }
            if (value.length==0)return;
            if (!token){
                token = 'constant';
            }
            if (typeof(token)!='string'){
                throw new Error('token value not a string');
            }
            if (scope && !Array.isArray(scope)){
                throw new Error('score not an array');
            }
            if (!scope){
                scope = [token];
            }
            scope = new TokenScopeInfo(scope);
            m_list.push({value, token, scope});
        };
        Object.defineProperty(this, 'length', {get(){return m_list.length; }});
        this.clear = function(){
            m_list.length = 0;
        };
        this.render = function(listener){
            let s = '';
            let range = { start:0 , end:0};
            let _rangeList = [];
            m_list.forEach((i)=>{
                let v = i.value;
                if (i.childs && (i.childs > 0)){

                }
                if (listener){
                    v = listener.render(i);
                }
                s += v;
                range.end += v.length
                _rangeList.push({...range, value:v, token:i.token, scope: i.scope});
                range.start = range.end;
            });
            return s;
        }
    } 
}

class HtmlRenderListener{
    render({value, token}){
        console.log("render : ", token);
        return value;
    }
}
function treatCaptures(v, capture, listener, base_token_names, tokenList){
    let token = null;
    const scope = Array.isArray(base_token_names) ? base_token_names.slice(0) : [base_token_names];
    if (capture.name){
        token = capture.name;
        scope.unshift(token);
    }
    tokenList.add({value:v, token , scope: scope});
    return v;
}
function treat(group, captures, listener, base_token_names){
    tokenList = new TokenList();
    const _keys = Object.keys(captures);
    _keys.sort();
    // 1 . select
    // 2 . transformat 
    // 3 . apply name
    // transform to name list if name defined
    console.log("group length : ", group.length);
    let v = '';
    let tab = null;
    if (group.length > 0){
        v = group[0];
        if (v.length>0){
            // treat only if capture exceed length 0
            const tokenList = new TokenList();
            if (0 in captures){
                // treat captures first capture 
                v = treatCaptures(v, captures[0], listener, base_token_names, tokenList);
                delete(captures[0]);
            }
            const _rangeList = [];
            if (group.length>0){
                for(let i in captures){
                    let cap = captures[i];
                    let gv = group[i];
                    if (gv){

                        let vv = treatCaptures(gv, cap, listener, base_token_names, tokenList);
                        let ic = v.indexOf(gv);
                        let _endpos = ic+gv.length;
                        let _range = {
                            start : ic,
                            end: _endpos,
                            cap: cap,
                            newValue: vv,
                            value : gv
                        }
                        _rangeList.push(_range);
                    }
                }
                _rangeList.sort((a, b)=>{
                    if (a.start == b.start){
                        if (a.value.length < b.value.length){
                            b.start = a.end;
                            return -1;
                        }
                    }else {
                        if (a.start < b.start){
                            b.start = a.end;
                            b.value = b.value.substring(b.start-1);
                            return -1;
                        }
                        return 1;
                    }
                    return 0;
                });
                v = tokenList.toString();
                 
            }
        }

    }
}

var source = "brave = <igk:canvas-editor-l:igk: />";

var group = /<(\b([\w][\-\w]*:)?([\w][\-:\w]*))/.exec(source);

treat(group, {
    "1":{
        name:"tagname"
    }, 
    "2":{
        "name":"namespace"
    },
    "0":{
        name:"tagdetection"
    },
}, null, "constant");

console.log(group);
return;



var tokenList = new TokenList();
var listener = new HtmlRenderListener;

tokenList.add({value:'<',token:"tab.brank.start"})
tokenList.add({value:'div',token:"tagname.html"})
tokenList.add({value:' ',token:"constant.html"})
tokenList.add({value:'/>',token:"brank.close.html"})


console.log('result : ')
console.log(tokenList.render(listener))