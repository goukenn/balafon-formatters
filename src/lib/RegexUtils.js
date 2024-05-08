"use strict";
Object.defineProperty(exports, '__esModule', {value:true});

const START_HERE = "(??)";

/**
 * regex utility class 
 */
class RegexUtils{
    /**
     * check request start line
     * @param {*} reg 
     * @returns 
     */
    static CheckRequestStartLine(reg){
        return /([^\\]|^)\^/.test(reg.toString());
    }
    /**
     * stringify and regex result
     * @param {*} c 
     * @returns 
     */
    static Stringify(c){
        return c.toString().slice(1, -1).replace("\\/","/")
    }
    /**
     * remove capture brancket
     * @param {string} str 
     * @returns 
     */
    static RemoveCapture(str){
        let l = str;
        let p = 0;
        let ch = '';
        function rm_brank(l, index, start='(', end=')'){
            let i = 1;
            let ln = l.length;
            const start_index = index;
            let escaped = false;
            while((i < ln) && (i>0) && (index < ln)){
    
                ch = l[index+1];
                if (ch==start){
                   if (!escaped){ 
                        i++;
                   }
                } else if (ch ==end){
                    if (!escaped)
                        i--;
                }
                escaped = ch=="\\";
                index++;
            }
            //+ | fix: remove repeating brank symbol
            if ((index+1<ln)&&(/[\\?\\*]/.test( l[index+1]))){
                index++;
            }
            return l.substring(0, start_index)+l.substring(index+1);
        }
        let capture = false;
        while( p = /\(\?(:|(\<)?=)./.exec(l)){
            l = rm_brank(l, p.index);
            capture= true;
        }
        return capture ? l : null;
    }
    
    /**
     * check if is captured only regex expression
     * @param {string|RegExp} regex 
     * @returns {bool}
     */
    static IsCapturedOnlyRegex(regex){
        let f = false;
        let s = regex.toString();
        s = s.substring(0, s.lastIndexOf('/')+1).slice(1,-1);
        s = RegexUtils.RemoveCapture(s);
        if (s==null){
            return false;
        }
        s = s.split('|').join('').trim();

        f = s.length==0;  
        return f;
    }
    /**
     * unset capture definition 
     * @param {*} m 
     */
    static UnsetCapture(m){
        const _regex = /\(\?(:|<|=)/;
        let p = null;
        let s = '';
        let ch = null;
        while( p = _regex.exec(m)){
            s = m.substring(0, p.index);
            // + | remove branket dans leave content 
            let i = 1;
            let g = m.substring(p.index + p[0].length);
            let ln = g.length;
            let pos = 0;
            while(pos<ln){
                ch = g[pos];
                if (ch==')'){
                    i--;
                    if (i==0){
                        if ((pos+1<ln) && /\?|\*/.test(g[pos+1])){
                            pos++;
                        }
                        let end = g.substring(0, pos)+g.substring(pos+1);
                        s+= end;
                        break;
                    }
                }
                else if (ch=='(') {
                    i++;
                }
                pos++;
            } 
            m = s;
        } 
        return m;
    }
}

exports.RegexUtils = RegexUtils;