"use strict";
Object.defineProperty(exports, '__esModule', {value:true});

const START_HERE = "(??)";

/**
 * regex utility class 
 */
class RegexUtils{
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
        f = s.length==0;  
        return f;
    }
    /**
     * unset capture definition 
     * @param {*} m 
     */
    static UnsetCapture(m){
        return m.replace(/\(\?(?:(?:=|<=|:))(.+)\)/, "$1");
    }
}

exports.RegexUtils = RegexUtils;