"use strict";
Object.defineProperty(exports, '__esModule', { value: true });


class CssStyleAttribute{
    _style;
    //. 
    constructor(style){
        this._style = style;
    }
    /**
     * 
     * @param {*} style 
     * @returns 
     */
    static From(style){
        const _attr = new CssStyleAttribute(style);
        return _attr;
    }
    treatProperties(){
        const _ls = Object.keys(this._style);
        _ls.forEach(a=>{
            let _n = CssStyleAttribute.PropertyName(a);
            if (_n != a){
                let _v = this._style[a];
                delete this._style[a];
                if (!(_n in this._style))
                    this._style[_n] = _v; 
            }
        });
        return this;
    }
    get isColorStyle(){
        const _ls = Object.keys(this._style);
        return (_ls.length == 1) && /\b(?:(?:(background|border)-?)?color$)\b/.test( CssStyleAttribute.PropertyName(_ls[0]));
    }
    /**
     * convert to camel case
     * @param {string} name 
     * @returns 
     */
    static PropertyName(name){
        const _regex = /[A-Z]/g;
        if (name.split(_regex).length>0){
            name = name.replace(_regex, (a, m)=>{
                a = a.toLowerCase(); 
                if (m>0){
                    a = '-'+a;
                }
                return a;
            });
        }
        return name.toLowerCase();
    }
}

exports.CssStyleAttribute = CssStyleAttribute;