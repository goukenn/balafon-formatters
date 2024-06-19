'use strict';
Object.defineProperty(exports, '__ESModule', {value:true});

const { FormatterListener } = require('../FormatterListener');
const { Formatters } = require('../Formatters');
const { CssStyleDefinitions } = require('./CssStyleDefinitions');
const json_data = require("../../formatters/css-transform.btm-syntax.json");

const _formatter = Formatters.CreateFrom(json_data);
const _baseFormatterListener = new FormatterListener; 

/**
 * store style definition property
 */
class CssStyles {

}

/**
 * selector definition
 */
class SelectorDefinition {
    value;
    property;
    key;
    definitions;
    constructor(listener) {
        if (!listener) {
            throw new Error('invalid parameters');
        }
        this.value = this.property = this.key = '';
        Object.defineProperty(this, "listener", { get() { return listener } });
    }
    initDefinition(def) {
        const _init_style = () => new CssStyles();
        if (def){
            const { key } = this; 
            this.definitions = ((key in def)? def[key] : null) || _init_style();
        }else {
            this.definitions = this.getStylesDefinition(this.key) || _init_style();
        }
        this.store(def);
    }
    start(){
        this.property = '';
        this.key = '';
        this.value = '';
        this.definitions = null;
    }
    update() {
        const { property, value, definitions } = this;
        if (property) {
            definitions[property] = value?.trim();
            this.value = '';
        }
    }
    store(def) {
        this.update();
        const { listener, key, value, definitions } = this;
        if (key) {
            if (def){
                def[key] = definitions;
            }else{
                listener.styles[key] = definitions;
            }
        }
    }
    getStylesDefinition(key) {
        const { listener } = this;
        return this._get_definition(key, listener.styles);
    }
    getMediasDefinition(rule) {
        const { listener } = this;
        return this._get_definition(rule, listener.medias);

    }
    _get_definition(key, tab) {
        return (key in tab) ? tab[key] : null;
    }
}
class CssSelectorStyles {

}

function _initListener(_formatter, _selectorDefinition, callBacks){
    const { _updateMediaDefinition, _updatePropertyDefinition,_css_definition} = callBacks;
    const _listener = {
        mode: null,
        medias_definition: null,
        media_states: null,
        renderToken(value, tokenList, tokenID, engine, option) {
            return value;
        },
        onStartHandler(marker, option) {
            // check on start - 
            const { tokenID } = marker;
            //console.log("****************************starting....");
            switch (tokenID) {
                case "css-media":
                    _updatePropertyDefinition();
                    _updateMediaDefinition();
                    this.mode = 'media'; 
                    _selectorDefinition.start();
                    _selectorDefinition.store();
                    break;
                case "css-import":
                    this.mode = 'import';
                    break;
            }
        },
        _handleMedia(data, marker, tokenID, tokenList, _handle) {
    
            // console.log("on media ::::: ", tokenID);
            let _condition = null;
    
            switch (tokenID) {
                case 'css-media-condition':
                    
                    // retrieve media definitions to merge keys
                    _condition = data.value;
                    if (!this.media_states){
                        this.media_states = {condition:_condition}
                    } else { 
                        this.media_states.condition += _condition;
                    }
                    
                  
                    _handle.handle = true;
                    break;
                case 'css-media':
                    // close media definition 
                    _updateMediaDefinition();
                    this.medias_definition = null;
                    this.mode = null;
                    _handle.handle = true;
                    
                    break;
                case 'css-selector':
                    _handle.handle = true;
                    _updatePropertyDefinition();
                    _condition = this.media_states.condition?.trim();
                    const _src = _css_definition.medias[_condition];
                    this.medias_definition = {
                            'condition': _condition,
                            'styles': _src || new CssSelectorStyles() 
                    };
                    this.media_states = null;
                    _selectorDefinition.key = data.value?.trim();
                    _selectorDefinition.property = '';
                    _selectorDefinition.value = '';
                    _selectorDefinition.initDefinition(this.medias_definition.styles);
        
                    break;
            }
    
        },
        onEndHandler(marker, option, isSubFormatting = false) {
            if (isSubFormatting) {
                return;
            }
            let tokenList = option.tokenChains;
            let tokenID = marker.tokenID;
            // for matchType = 0
            const _value = marker.value || (() => ({ value: option.buffer, source: option.data }))();
            const { mode } = this;
    
            if (mode) {
                const _mfc = this['_handle' + mode[0].toUpperCase() + mode.substring(1)];
                if (_mfc) {
                    const _handle = { handle: false };
                    _mfc.apply(this, [_value, marker, tokenID, tokenList, _handle]);
                    if (_handle.handle) {
                        return;
                    }
                }
            }
    
    
    
    
            switch (tokenID) {
                case 'css-media':
                    // close media definition 
    
                    break;
                case 'css-value':
                    _selectorDefinition.value += _value.value;
                    break;
                case 'css-property':
                    _updatePropertyDefinition();
                    _selectorDefinition.property = _value.value?.trim();
                    _selectorDefinition.value = '';
                    break;
                case 'css-selector':
                    _updatePropertyDefinition(); 
                    _selectorDefinition.key = _value.value?.trim();
                    _selectorDefinition.property = '';
                    _selectorDefinition.value = '';
                    _selectorDefinition.initDefinition();
                    break;
                case 'value-definition':
                    // end value definition 
                    _updatePropertyDefinition();
                    _selectorDefinition.property = '';
                    _selectorDefinition.value = '';
                    break;
                case 'selector-block':
                    _updatePropertyDefinition();
                    _selectorDefinition.key = '';
                    _selectorDefinition.property = '';
                    _selectorDefinition.value = '';
                    break;
            }
            //console.log("|*********** end handling *************|" + marker, marker.value, _value, { tokenList, tokenID })
        },
        store() {
            _baseFormatterListener.store.apply(_baseFormatterListener, arguments);
        }
    
    }; 
    _formatter.listener = _listener; 
    
}



/**
 * @typedef {undefined|boolean|string|string[]} IDebugFeatures 
 */

class CssTransformer{

    /**
     * 
     * @param {*} src 
     * @param {undefined|{debug:IDebugFeatures}} option 
     * @returns 
     */
    static ToJSON(src, option){
        const _css_definition = new CssStyleDefinitions();
        const _selectorDefinition = new SelectorDefinition(_css_definition);

      
        function _updatePropertyDefinition() {
            _selectorDefinition.update();
        }
        function _updateMediaDefinition() {
            // console.log("update media definition : ");
            if (_listener.medias_definition) {
                if(!_css_definition.medias){
                    _css_definition.initMedia();
                }
                _css_definition.medias[_listener.medias_definition.condition] =
                    _listener.medias_definition.styles;
            }
        }
        let _debug = false;

        if(option){
            (()=>{
                const { debug } = option;
                _debug = debug;
            })();
        }
        _formatter.debug = _debug;
        _initListener(_formatter,_selectorDefinition, { _updatePropertyDefinition, 
            _updateMediaDefinition, _css_definition});
        const _listener = _formatter.listener;
        _formatter.format(src, {
            complete() {
                _selectorDefinition.store();
            }
        }
        );
        return JSON.stringify(_css_definition, null, 4);
    }
}
exports.CssTransformer = CssTransformer