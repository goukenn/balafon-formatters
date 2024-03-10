"use strict";
Object.defineProperty(exports, '__esModule', {value:true});

/**
 * export pattern match info
 */
class PatternMatchInfo{
    /**
     * @var {bool}
     */
    start = true; 
    /**
     * current definition block
     * @var {bool}
     */
    isBlock;
    /**
     * store start line
     */
    startLine = 0;
    /**
     * 
     */
    range = {
        start : 0,
        end : 0
    }
     /**
     * store marker info childs
     */
    childs = [];

    /**
     * store value
     * @var {null|{value:string, source:string }}
     */
    value;

    /**
     * define block start information
     */
    blockStartInfo;
 

    constructor(){
        var m_parent;
        var m_marker;
        var m_endRegex;
        var m_group;
        var m_line;
        var m_isBlock = false;
        var m_lineFeed = false;
        var m_startOutput = null;
        var m_endOutput = null;
        var m_updatedProperties = {};
        var m_isBlockStared = false;
        /**
         * get or set the parent info matcher
         */
        Object.defineProperty(this, 'isBlockStarted', {get(){ 
            return (this.isBlock) ? m_isBlockStared : false; 
        }, set(v){
            if (typeof(v) != 'boolean'){
                throw new Error('not a valid value');
            }
            if (this.isBlock){
                m_isBlockStared = v;
            }
        }});

        Object.defineProperty(this, 'parent', {get(){return m_parent; }});
        Object.defineProperty(this, 'updatedProperties', {get(){return m_updatedProperties; }});
        Object.defineProperty(this, 'isBlock', {get(){return m_isBlock; }, set(value){ m_isBlock = value; }});
        Object.defineProperty(this, 'lineFeed', {get(){return m_lineFeed; }, set(value){ m_lineFeed = value; }});
        Object.defineProperty(this, 'marker', {get(){return m_marker; }});
        Object.defineProperty(this, 'endRegex', {get(){return m_endRegex; }});
        Object.defineProperty(this, 'group', {get(){return m_group; }});
        Object.defineProperty(this, 'line', {get(){return m_line; }});
        Object.defineProperty(this, 'startOutput', {get(){return m_startOutput || m_group[0]; }, set(v){
            m_startOutput = v;
        }});
        Object.defineProperty(this, 'endOutput', {get(){return m_endOutput; }, set(v){
            m_endOutput = v;
        }});

        /**
         * 
         * @param {*} marker 
         */
        this.use = function({marker, endRegex, group, line, parent}){
            m_marker = marker;
            m_isBlock = marker.isBlock;
            m_endRegex = endRegex;
            m_group = group;
            m_line = line;
            m_parent = parent;

            (function(q, pattern){
                const _keys = Object.keys(q);
                const _keys_t = Object.keys(pattern);
                ['isBlock','lineFeed'].forEach(s=>{
                    delete _keys_t[_keys_t.indexOf(s)];
                });
                _keys_t.forEach(i => { 
                    
                    if (_keys.indexOf(i)!=-1){
                        console.log("property alreay defined ["+i+"]");
                        return;
                    } 



                    let _i = Object.getOwnPropertyDescriptor(pattern, i);
                    if (!_i || (_i.get) || _i.writable) {
                        // q[i] = pattern[i];
                        Object.defineProperty(q, i, {get(){ return pattern[i]; }})
                    } 
                });
            })(this, m_marker);
        };
    }

    get index(){
        return this.group?.index;
    }
    get offset(){
        return this.group?.offset;
    }
    get name(){
        return this.marker?.name;
    } 
    get captures(){
        return this.marker?.captures;
    } 
    get endCaptures(){
        return this.marker?.endCaptures;
    } 
    get beginCaptures(){
        return this.marker?.beginCaptures;
    } 
    get replaceWith(){
        return this.marker?.replaceWith;
    }
    get replaceWithCondition(){
        return this.marker?.replaceWithCondition;
    }
    toString(){
        return "[PatternMatchInfo: "+this.marker?.toString()+"]";
    }

}

exports.PatternMatchInfo = PatternMatchInfo;