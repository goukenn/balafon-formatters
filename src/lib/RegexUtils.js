"use strict";
Object.defineProperty(exports, '__esModule', { value: true });

const START_HERE = "(??)";
const CAPTURE_MOVEMENT =/\(\?((<)?!|(\<)?=)./;
const SKIP_REGEX = {
    exec(){
        return null;
    },
    test(){
        return null;
    },
    toString(){
        return '';
    }
};
/**
 * regex utility class 
 */
class RegexUtils {
    /**
     * is skipped end regex
     * @param {regex} skip 
     * @returns 
     */
    static IsSkipped(skip){
        return skip === SKIP_REGEX;
    }
    /**
     * to remove [not-]ahead-backyard: matching
     */
    static get CAPTURE_NOT_AHEAD_BACKYARD() {
        // not-ahead-backyard : (<)?!
        // ahead: (=)
        // backyard: <=
        return /\(\?([imx]|(<)?!|(\<)?=)./;
    }
    static get CAPTURE_MOVEMENT() {
        return CAPTURE_MOVEMENT;
    }
    /**
     * 
     */
    static get CAPTURE_LEAVE_AHEAD_BACKYARD() {
        // not-ahead-backyard : (<)?!
        // ahead: (=)
        // backyard: <=
        return /\((\?(:|[imx])|(?!\?))./; 
    }

    /**
     * check if has selection movement capture
     * @param {*} regex 
     * @returns 
     */
    static HasMovementCapture(regex){
        let rc = RegexUtils.CAPTURE_NOT_AHEAD_BACKYARD;
        let _ret =  rc.test(regex);
        return _ret;
    }
    /**
     * check if regex contains backyard movement capture
     * @param {*} regex 
     * @returns 
     */
    static HasBackyardMovementCapture(regex){
        const rc = /(\(\?<(!|=))./;
        return rc.test(regex);
    }
  
    /**
     * regex parsing
     * @param {{isReadonly:boolean}} q 
     * @returns {(str:string)=>string}
     */
    static RegexParser(q){
        const { Utils } = require("./Utils");
        const { RegexEngine } = require("./RegexEngine");
        return (s) => {
            if (s == '(??)') {
                q.isStartOnly = true;
                s = '';
            }
            let is_empty = false;
            if (s == '') {
                is_empty = true;
            }
            let g = Utils.RegexParse(s, 'd');
            g = RegexEngine.Load(g, is_empty);
            return g;
        }; 
    }

    /**
     * remove regex not-ahead-backyard - group
     * @param {string} str 
     * @returns {?string}
     */
    static RemoveNotAheadBackyardGroup(str) {
        let s = RegexUtils.RemoveCapture(str, RegexUtils.CAPTURE_NOT_AHEAD_BACKYARD);
        if (s) {
            return RegexUtils._TreatCaptureGroup(s);
        }
        return s;
    }
    /**
     * removce capture on regex
     * @param {string} str 
     * @returns 
     */
    static RemoveCaptureAndLeaveMovementCapture(str) {
        let s = RegexUtils.RemoveCapture(str, RegexUtils.CAPTURE_LEAVE_AHEAD_BACKYARD);
        if (s) {
            return RegexUtils._TreatCaptureGroup(s);
        }
        return s;
    }
    static _TreatCaptureGroup(s) {
        if ((s[0]=="/") && (s[s.length-1]=="/")){
            s = s.slice(1,-1);
        }
        return s.split('|').filter(o => o.length > 0).join('|')
    }
    /**
     * regex to string regex
     * @param {RegExp} s 
     * @returns 
     */
    static RegexToStringRegex(s){
        s = s.toString();
        return s.substring(0, s.lastIndexOf('/')+1).slice(1,-1);
    }
    /**
    * get regex info on start line
    * @param {string} s regex string expression
    */
    static RegexInfo(s) {
        let option = '';
        if (s == "(??)") {
            return {
                s: "^.^",
                option,
                beginOnly: true
            };
        }

        let _option = /^\(\?(?<active>[imx]+)(-(?<disable>[ixm]+))?\)/;
        let _potion = null;
        if (_potion = _option.exec(s)) {
            let sp = '';
            if (_potion.groups) {
                sp = _potion.groups.active ?? '';
                if (_potion.groups.disable) {
                    _potion.groups.disable.split().forEach(i => {
                        sp = sp.replace(i, '');
                    });
                }
            }
            s = s.replace(_option, '');
            option = sp;
        }
        return {
            s,
            option
        };
    }
    /**
     * check request start line
     * @param {*} reg 
     * @returns 
     */
    static CheckRequestStartLine(reg) {
        // + | TO CHECK that regex request for start line 
        // - ^ must not be escaped \^
        // - ^ must not be a non validated group [^] 
        return /([^\\\\[]|^)\^/.test(reg.toString());
    }
    /**
     * check regex request on end line
     * @param {*} reg 
     * @returns {boolean}
     */
    static CheckRequestEndLine(reg) {
        // + | TO CHECK that regex request for start line 
        // - ^ must not be escaped \$
        // - ^ must not be a non validated group [$] 
        return /([^\\\\[]|$)\$/.test(reg.toString());
    }
    /**
    /**
     * stringify and regex result
     * @param {*} c 
     * @returns 
     */
    static Stringify(c) {
        return c.toString().slice(1, -1).replace("\\/", "/")
    }
 /**
  * remove capture group
  * @param {string} str regex data 
  * @param {*} regex regex that represent the capture
  * @returns 
  */
    static RemoveCapture(str, regex) {

        if (typeof (str) != 'string') {
            throw new Error('invalid parameter.');
        }

        let l = str;
        let p = 0;
        let ch = '';
        regex = regex || /\(\?(:|(\<)?=)./;
        function rm_brank(l, index, start = '(', end = ')') {
            let i = 1;
            let ln = l.length;
            const start_index = index;
            let escaped = false;
            while ((i < ln) && (i > 0) && (index < ln)) {

                ch = l[index + 1];
                if (ch == start) {
                    if (!escaped) {
                        i++;
                    }
                } else if (ch == end) {
                    if (!escaped)
                        i--;
                }
                escaped = ch == "\\";
                index++;
            }
            //+ | fix: remove repeating brank symbol
            if ((index + 1 < ln) && (/[\\?\\*]/.test(l[index + 1]))) {
                index++;
            }
            return l.substring(0, start_index) + l.substring(index + 1);
        }
        let capture = false;
        let _prev = '';
        while (p = regex.exec(l)) {
            if (p.index>0){
                let _escape = l[p.index-1]=="\\";
                if (_escape){
                    _prev += l.substring(0, p.index+1);
                    l = l.substring(p.index+1);
                    continue;
                }
            }
            l = rm_brank(l, p.index);
            capture = true;
        }
        if (_prev.length>0){
            if (capture){
                l = _prev+l;
            }
        }
        return capture ? l : str;
    }

    static ReadBrank(str, position, count = 1, start = '(', end = ')') {
        const ln = str.length;
        let ch = null;
        let _stpos = position;
        while (position < ln) {
            ch = str[position];
            if (ch == start) {
                count++;
            } else if (ch == end) {
                count--;
                if (count == 0) {
                    position++;
                    break;
                }
            }
            position++;
        }
        return str.substring(_stpos, position);
    }

    /**
     * check if is captured only regex expression
     * @param {string|RegExp} regex 
     * @returns {bool}
     */
    static IsCapturedOnlyRegex(regex) {
        let f = false;
        let s = regex.toString();
        s = s.substring(0, s.lastIndexOf('/') + 1).slice(1, -1);
        s = RegexUtils.RemoveCapture(s, /\(\?((<)?!|(\<)?=)./);
        if (s == null) {
            return false;
        }
        s = s.split('|').join('').trim();

        f = s.length == 0;
        return f;
    }
    /**
     * unset capture definition 
     * @param {*} m 
     */
    static UnsetCapture(m) {
        const _regex = /\(\?(:|<|=)/;
        let p = null;
        let s = '';
        let ch = null;
        while (p = _regex.exec(m)) {
            s = m.substring(0, p.index);
            // + | remove branket dans leave content 
            let i = 1;
            let g = m.substring(p.index + p[0].length);
            let ln = g.length;
            let pos = 0;
            while (pos < ln) {
                ch = g[pos];
                if (ch == ')') {
                    i--;
                    if (i == 0) {
                        if ((pos + 1 < ln) && /\?|\*/.test(g[pos + 1])) {
                            pos++;
                        }
                        let end = g.substring(0, pos) + g.substring(pos + 1);
                        s += end;
                        break;
                    }
                }
                else if (ch == '(') {
                    i++;
                }
                pos++;
            }
            m = s;
        }
        return m;
    }
}

RegexUtils.SKIP_REGEX = SKIP_REGEX;

exports.RegexUtils = RegexUtils;