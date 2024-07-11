"use strict";
Object.defineProperty(exports, '__esModule', { value: true });

class CssImports{
    constructor(){
        this._list = [];
    }
    contains(url){
        return false;
    }
    toJSON(){
        return this._list;
    }
    toRender(){
        return this._list;
    }
    /**
     * 
     * @param {*} param0 
     */
    store({url, layer, supports, queries}){
        this._list.push({url, layer, supports, queries});
    }
}

exports.CssImports = CssImports;