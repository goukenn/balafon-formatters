'use strict';
Object.defineProperty(exports, '__ESModule', { value: true });

const { FormatterListener } = require('../FormatterListener');
const { Formatters } = require('../Formatters');
const { CssStyleDefinitions } = require('./CssStyleDefinitions');
const { CssStyle } = require('./CssStyle');
const { CssAtRuleProperty } = require('./CssAtRuleProperty');
const json_data = require("../../formatters/css-transform.btm-syntax.json");
const { CssAtLayerDefinition } = require('./CssAtLayerDefinition');
const { CssLayerStyle } = require('./CssLayerStyle');
const { CssCounterStyle } = require('./CssCounterStyle');
const { CssFontFaceStyle } = require('./CssFontFaceStyle');
const { CssImports } = require('./CssImports');

const _formatter = Formatters.CreateFrom(json_data);
const _baseFormatterListener = new FormatterListener;

/**
 * retrieve method suffix name
 * @param {string} n 
 * @returns 
 */
function methodSuffixName(n) {
    n = n.replace(/(-|_)[a-z]/g, (o) => o[1].toUpperCase()).replace(/(^-)|_/g, '');
    n = n[0].toUpperCase() + n.substring(1);
    return n;
}

function get_container_id(inf) {
    const tab = [];
    if (inf.name) {
        tab.push(inf.name);
    }
    if (inf.condition) {
        tab.push(inf.condition);
    }
    return tab.length > 0 ? tab.join(' ') : '$global';
}

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
    mergeDefinitions;
    /**
     * storage of global propertiy to by pass listener 
     */
    styleStore;
    /**
     * build style listener
     * @param {*} listener 
     */
    constructor(listener) {
        if (!listener) {
            throw new Error('invalid parameters');
        }
        this.value = this.property = this.key = '';
        Object.defineProperty(this, "listener", { get() { return listener } });
    }
    /**
     * init definition
     * @param {*} def 
     */
    initDefinition(def) {
        const _init_style = () => new CssStyles();
        if (def) {
            const { key } = this;
            this.definitions = ((key in def) ? def[key] : null) || _init_style();
        } else {
            this.definitions = this.getStylesDefinition(this.key) || _init_style();
        }
        this.store(def);
    }
    start() {
        this.property = '';
        this.key = '';
        this.value = '';
        this.definitions = null;
    }
    /**
     * update property value
     */
    update() {
        const { property, value, definitions } = this;
        let c = '';
        function litteralString(n) {
            this.toJSON = () => {
                return n;
            }
            this.toString = () => {
                return n;
            }
        }
        if (property && definitions) {
            const _regex = /^('|")(.*)\1$/g;
            const _is_litteral = _regex.test(value?.trim());

            if (_is_litteral) {
                c = new litteralString(value?.trim().replace(_regex, '$2'));

            }
            else {
                c = (value.trim().length == 0) && (value.length > 0) ? value : value?.trim().replace(_regex, '$2');
            }
            definitions[property] = c;
            this.value = '';
        }
    }
    /**
     * store key definition. div property 
     * @param {*} def 
     */
    store(def) {
        /** */
        this.update();
        const { listener, key, definitions, styleStore } = this;
        if (key) {
            if (def) {
                def[key] = definitions;
                this._loadSeparator(def, key, definitions);
            } else {
                const _def= styleStore || listener.styles;
                _def[key] = definitions;
                this._loadSeparator(listener.styles, key, definitions);
            }
        }
    }
    _loadSeparator(def, key, definitions) {
        const _tab = key.split(',');
        if (_tab.length > 1) {
            this._mergeFromDefinition(def);
            if (!(key in this.mergeDefinitions.keys) || (this.mergeDefinitions.keys[key].indexOf(def) == -1)) {
                if (!(key in this.mergeDefinitions.keys)) {
                    this.mergeDefinitions.keys[key] = [];
                }
                this.mergeDefinitions.keys[key].push(def);
            }
        }
    }
    _mergeDefinition(style, definitions) {
        for (let key in definitions) {
            style[key] = definitions[key];
        }
    }
    _mergeDefinitionComplete() {
        const { mergeDefinitions } = this;
        if (!mergeDefinitions) return;
        const list = Object.keys(mergeDefinitions.keys);
        while (list.length > 0) {
            let q = list.shift();
            const _tab = q.split(/\s*,\s*/);
            const _tdef = this.mergeDefinitions.keys[q];
            while (_tdef.length > 0) {
                const definitions = _tdef.shift()[q];


                _tab.forEach(o => {
                    o = o.trim();
                    if (o in def) {
                        this._mergeDefinition(def[o], definitions);
                    } else {
                        if (o in pdef) {
                        }

                    }
                    //     pdef[o] = ;
                    // }
                });
            }
        }
    }
    complete() {
        this._mergeDefinitionComplete();
    }
    _mergeFromDefinition(def) {
        if (!this.mergeDefinitions) {
            this.mergeDefinitions = [];
            this.mergeDefinitions.styles = {};
            this.mergeDefinitions.keys = {};

        }
        const { mergeDefinitions } = this;
        let _index = this.mergeDefinitions.indexOf(def);
        if (_index == -1) {
            this.mergeDefinitions.push(def);
            _index = this.mergeDefinitions.length - 1;
            this.mergeDefinitions.styles[_index] = new CssStyles;
        }
        const pdef = this.mergeDefinitions.styles[_index];
        return pdef;
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

function _initListener(_formatter, _selectorDefinition, callBacks) {
    const { _updateMediaDefinition, _updatePropertyDefinition, _css_definition } = callBacks;

    // + | retrieve key frames
    const _get_frames = function () {
        if (!_css_definition.frames) {
            _css_definition.frames = {};
        }
        const _frame = _css_definition.frames;
        return { frame: _frame };
    };
    // + | retrieve color profilie
    const _get_color_profile = function () {
        if (!_css_definition.colorProfile) {
            _css_definition.colorProfile = {};
        }
        return _css_definition;
    }
    function _initDef(obj, key, data) {
        if (!(key in obj)) {
            obj[key] = data != undefined ? data : {};
        }
    }
    const _listener = {
        mode: null,
        medias_definition: null,
        media_states: null,
        ref_mode: [],
        _auto: false,
        _frame_info: null,
        renderToken(value, tokenList, tokenID, engine, option) {
            return value;
        },
        onStartHandler(marker, option) {
            // check on start - 
            const { tokenID } = marker;
            console.log("************* start **************", tokenID);
            let _auto = false; // state auto mode
            switch (tokenID) {
                case "css-media":
                    _updatePropertyDefinition();
                    _updateMediaDefinition();
                    this.mode = 'media';
                    _selectorDefinition.start();
                    _selectorDefinition.store();
                    break;
                case "css-value":
                case "css-selector":
                case "css-property":
                    break;
                default:
                    if (tokenID && /^invalid./.test(tokenID)) {
                        throw new Error(`invalid syntax.${tokenID}`);
                    }
                    if (tokenID && /^css-/.test(tokenID)) {
                        const _mode = tokenID.toLowerCase().replace(/-/g, '_').substring(4);
                        // save old mode
                        if (this.mode)
                            this.ref_mode.push([this.mode, this._auto]);
                        this.mode = _mode;
                        _auto = true;

                        const _mfc = this['_onStart' + methodSuffixName(_mode)];
                        if (_mfc) {
                            _mfc.apply(this);
                        }
                    }
                    this._auto = _auto;
                    break;
            }
        },
        _handleColorprofile(data, marker, tokenID, tokenList, _handle) {
            _handle.handle = true;
            const { colorProfile } = _get_color_profile();
            switch (tokenID) {
                case 'css-profile-name':
                    const _n = data.source;
                    //_initDef(colorProfile, _n); 
                    this._initSelectorDefinition(_n, colorProfile);
                    break;
                case 'css-colorProfile':
                    // on end clear keys
                    //const def = _selectorDefinition.definitions;
                    this._resetSelectorDefinition();
                    break;
                default:
                    _handle.handle = false;
                    break;
            }
        },
        _handleKeyframes(data, marker, tokenID, tokenList, _handle) {
            // console.log("==================> handle key frames: "+tokenID);
            const { frame } = _get_frames();
            _handle.handle = true;
            switch (tokenID) {
                case 'css-keyname':
                    const _n = data.source;
                    const ref = _n in frame ? frame[_n] : {};
                    frame[_n] = ref;
                    this._frame_info = { key: _n, object: ref };
                    break;
                case 'css-keyentry':
                    this._handleKeyentry(data);
                    break;
                default:
                    _handle.handle = false;
                    break;
            }
        },
        _handleKeyentry(data) {
            const { frame } = _get_frames();
            const _name = this._frame_info.key;
            const key = data.source;
            const def = frame[_name];
            this._initSelectorDefinition(key, def);
        },
        _handleMedia(data, marker, tokenID, tokenList, _handle) {

            // console.log("on media ::::: ", tokenID);
            let _condition = null;

            switch (tokenID) {
                case 'css-media-condition':

                    // retrieve media definitions to merge keys
                    _condition = data.value;
                    if (!this.media_states) {
                        this.media_states = { condition: _condition }
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
        _resetSelectorDefinition() {
            _selectorDefinition.key = null;
            _selectorDefinition.property = '';
            _selectorDefinition.value = '';
            _selectorDefinition.definitions = null;
        },
        /**
         * initialize selector definition
         * @param {*} key 
         * @param {*} def 
         */
        _initSelectorDefinition(key, def) {
            this._resetSelectorDefinition();
            _selectorDefinition.key = key;
            _selectorDefinition.initDefinition(def);
        },
        _handleCharset_value(data, marker, tokenID, tokenList, _handle) {
            // console.log('charset value', data)
            _css_definition.charset = data.value.slice(1, -1);
        },
        _onStartContainer() {
            const { objDef } = this;
            if (objDef) {
                // check is nested container - if $global not a named container
                if (objDef.type != 'container') {
                    throw new Error('container not allowed in ' + objDef.type);
                }
            }
            const inf = (() => {
                let _ref = { type: 'container', name: '', list: null, condition: null, parent: null, childs: [], def: null };
                this._resetSelectorDefinition();
                _selectorDefinition.initDefinition(null);
                _ref.def = _selectorDefinition.definitions;
                return this.objDef = _ref;
            })();
            if (objDef) {
                this.objDef.parent = objDef;
            }
            return { inf };
        },
        _onStartAtRuleProperty() {
            this._resetSelectorDefinition();
            _selectorDefinition.definitions = new CssAtRuleProperty;
            this.objDef = { type: 'property', name: '', def: _selectorDefinition.definitions };
            if (!_css_definition.property) {
                _css_definition.property = {};
            }
        },
        _handleAtRuleProperty(data, marker, tokenID, tokenList, _handle) {
            _handle.handle = true;
            switch (tokenID) {
                case 'css-property-name':
                    this.objDef.name = data.source;
                    break;
                case 'css-at-rule-property':
                    _css_definition.property[this.objDef.name] = this.objDef.def;
                    this.objDef = null;
                    _selectorDefinition.definitions = null;
                    break;
                default:
                    _handle.handle = false;
                    break;
            }
        },
        _onStartScope() {
            this._resetSelectorDefinition();
            this.objDef = { type: 'scope', condition: null, selector: null };
            if (!_css_definition.scope) {
                _css_definition.scope = {};
            }
            _selectorDefinition.definitions = null;

        },
        _closeAutoHandle() {
            _selectorDefinition.definitions = null;
            this.objDef = null;
            this._auto = true;
        },
        _handleScope(data, marker, tokenID, tokenList, _handle) {
            let _h = true;
            let _obj = this.objDef;
            let _value = data.value;
            function get_scope_id(obj) {
                let r = [];
                if (obj.condition) {
                    r.push(obj.condition);
                }
                return r.length > 0 ? r.join(' ') : '$global';
            }
            let _id = '';
            switch (tokenID) {
                case 'scope-condition':
                    if (_obj.condition) {
                        _obj.condition += _value;
                    } else
                        _obj.condition = _value;
                    break;
                case 'css-scope':
                    // - close and auto
                    this._closeAutoHandle();
                    _h = false;
                    break;
                case 'css-selector':
                    _id = get_scope_id(_obj);
                    if (!_css_definition.scope[_id]) {
                        _css_definition.scope[_id] = {};
                    }
                    let _def = _css_definition.scope[_id] ? _css_definition.scope[_id][_value] : null;
                    if (!_def) {
                        _def = new CssStyle;
                        _css_definition.scope[_id][_value] = _def;
                    }
                    _selectorDefinition.definitions = _def;
                    _obj.selector = _value;
                    break;
                default:
                    _h = false;
                    break;
            }
            _handle.handle = _h;
        },
        /**
         * pop auto mode
         * @param {*} tokenID 
         * @returns 
         */
        _popMode(tokenID, force = false) {
            if ((force || this._auto) && /^css-/.test(tokenID)) {
                const g = this.ref_mode.pop();
                if (g) {
                    this.mode = g[0];
                    this._auto = g[1];
                } else {
                    this.mode = undefined;
                    this._auto = false;
                }
                return true;
            }
        },
        _handleLayer(data, marker, tokenID, tokenList, _handle) {
            let _h = true;
            let _v = data.value;
            const _obj = this.objDef;
            function _store_style(_obj, def, key) {
                if (_obj.store) {
                    return;
                }
                const _key = key || _selectorDefinition.key;
                const _id = _obj.names.join(', ') || '@global';

                if (!(def instanceof CssLayerStyle) && _key && _obj.def) {
                    _obj.def[_key] = def;
                    def = _obj.def;
                    _css_definition.layer.styles[_id] = def;
                }
                else {
                    if (!_css_definition.layer.styles[_id]) {
                        _css_definition.layer.styles[_id] = {};
                    }
                    if (_key !== null) {
                        _css_definition.layer.styles[_id][_key] = def;
                    } else {
                        _css_definition.layer.styles[_id] = def;
                    }
                }
                _obj.store = true;
            }

            switch (tokenID) {
                case 'layer-name':
                    _obj.names.push(_v);
                    break;
                case 'end.instruction':
                    if (_css_definition.layer.list.length > 0) {
                        throw new Error("already declared a list layer tree");
                    }
                    if (_obj.parent) {
                        throw new Error("layer declaration not allowed in parent layer");
                    }
                    _css_definition.layer.list.push(..._obj.names);
                    this._closeAutoHandle();
                    this._popMode();
                    _h = false;
                    break;
                case 'css-selector':
                    _selectorDefinition.key = _v;
                    _selectorDefinition.definitions = new CssStyle;
                    break;
                case 'css-layer':
                    let _p = _obj?.parent;
                    if (!_p) {

                        // store childs
                        _store_style(_obj, _selectorDefinition.definitions)
                        this._closeAutoHandle();
                        _h = false;
                    }
                    this.objDef = _p;
                    _selectorDefinition.definitions = _p?.def;
                    _selectorDefinition.key = null;
                    break;
                // case 'css-selector':
                //     break;
                case 'selector-block':
                    let _id = null;
                    let def = _selectorDefinition.definitions;
                    let _key = _selectorDefinition.key;
                    if (_obj.parent) {
                        _id = _obj.names.join(', ');
                        const _pdef = _obj.parent.def;
                        if (!_pdef.childs[_id]) {
                            _pdef.childs[_id] = {};
                        }
                        _pdef.childs[_id][_key] = def;
                        def = _pdef;
                    } else {
                        _store_style(_obj, def);
                        // _obj.def = def;
                        def = _obj.def;
                    }
                    _selectorDefinition.definitions = def;
                    _selectorDefinition.key = null;

                    break;
                default:
                    _h = false;
                    break;
            }
            _handle.handle = _h;
        },
        _onStartLayer() {
            const _obj = this.objDef;
            let _parent = null;

            if (_obj) {
                if (_obj.type != 'layer') {
                    throw new Error('layer not allowed in ' + _obj.type);
                }
                _parent = _obj;
                if (!_parent.def) {
                    _parent.def = new CssLayerStyle;
                }
                //  _def = _selectorDefinition.definitions;
            }

            let _ndef = _parent?.def;//  || new CssLayerStyle;
            this.objDef = { type: 'layer', names: [], parent: _parent, def: _ndef, store: false };
            if (!_css_definition.layer) {
                // + | create layer definitions
                _css_definition.layer = new CssAtLayerDefinition;
            }
            _selectorDefinition.definitions = _ndef;
        },
        _handleContainer(data, marker, tokenID, tokenList, _handle) {
            const inf = this.objDef; //._onStartContainer();
            let _value = data.source;
            // console.log("init container....:" + tokenID);
            _handle.handle = true;
            switch (tokenID) {
                case 'container-condition':
                    let _op = /\s*,\s*/g.test(_value)
                    _value = _op ? _value.replace(/\s*,\s*/g, ',') : _value;
                    if (inf.condition) {
                        inf.condition += (_op ? '' : ' ') + _value;
                    } else {
                        if (/^\s*\b(and|or)\b/.test(_value)) {
                            throw new Error('start with boolean operator not allowed');
                        }
                        inf.condition = _value;
                    }
                    break;
                case 'container-name':
                    inf.name = _value;
                    inf.list = _value.replace(/\s*,\s*/, ',').split(',');
                    break;
                case 'css-container':
                    // + | end css container 
                    const def = _selectorDefinition.definitions;
                    if (def) {
                        const _container_name = get_container_id(inf);
                        if (!_css_definition.container) {
                            _css_definition.container = {};
                        }
                        if (inf.parent) {
                            inf.childs.push(def);
                            if (!('$container' in inf.parent.def)) {
                                inf.parent.def["$container"] = {};
                            }
                            let _p = inf.parent.def["$container"][_container_name];
                            if (_p) {
                                CssStyle.AppendDef(_p, def);
                            } else
                                inf.parent.def["$container"][_container_name] = def;
                        } else {
                            let _p = _css_definition.container[_container_name];
                            if (_p) {
                                CssStyle.AppendDef(_p, def);
                            } else {
                                _css_definition.container[_container_name] = def;
                            }
                        }

                    }
                    this._resetSelectorDefinition();
                    if (inf.parent) {
                        this.objDef = inf.parent;
                        _selectorDefinition.definitions = inf.parent.def;
                    } else {
                        // reset contener reference
                        this.objDef = null;
                    }
                    break;
                default:
                    _handle.handle = false;
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

            console.log("************* end **************", tokenID, _value.source);


            if (mode) {
                const _mfc = this['_handle' + methodSuffixName(mode)];
                if (_mfc) {
                    const _handle = { handle: false };
                    _mfc.apply(this, [_value, marker, tokenID, tokenList, _handle]);
                    if (_handle.handle) {
                        return;
                    }
                }
                // if auto register
                if (this._popMode(tokenID)) {
                    return;
                }
            }

            switch (tokenID) {
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
        },


        // counter-style
        _onStartCounterStyle() {
            this._resetSelectorDefinition();
        },
        _handleCounterStyle(data, marker, tokenID, tokenList, _handle) {

            _handle.handle = (() => {
                let _h = true;
                let _v = data.value;
                switch (tokenID) {
                    case 'counter-style-name':
                        _selectorDefinition.key = _v;
                        _selectorDefinition.definitions = new CssCounterStyle;
                        break;
                    case 'css-counter-style':
                        const _key = _selectorDefinition.key;
                        if (!_css_definition.counterStyles) {
                            _css_definition.counterStyles = {};
                        }
                        _css_definition.counterStyles[_key] = _selectorDefinition.definitions;
                        this._resetSelectorDefinition();
                        break;
                    default:
                        _h = false;
                        break;
                }
                return _h
            })();
        },

        // font-face
        _onStartFontFace() {
            this._resetSelectorDefinition();
            _selectorDefinition.definitions = new CssFontFaceStyle;
        },
        _handleFontFace(data, marker, tokenID, tokenList, _handle) {
            _handle.handle = (() => {
                let _h = true;
                let _v = data.value;
                switch (tokenID) {
                    case 'css-font-face':
                        if (!_css_definition.fontFace) {
                            _css_definition.fontFace = []
                        }
                        _css_definition.fontFace.push(_selectorDefinition.definitions);
                        this._resetSelectorDefinition();
                        break;
                    default:
                        _h = false;
                        break;
                }
                return _h
            })();
        },
        // font-feature-values
        _onStartFontFeatureValues() {
            this._resetSelectorDefinition();
            this.objDef = { type: 'font-feature-values', key: null, ident: null, names: [] }
        },
        _handleFontFeatureValues(data, marker, tokenID, tokenList, _handle) {
            _handle.handle = (() => {
                let _h = true;
                let _v = data.value;
                let _obj = this.objDef;
                switch (tokenID) {
                    case 'ftv-name':
                        if (!_css_definition.fontFeatureValues) {
                            _css_definition.fontFeatureValues = {};
                        }
                        _obj.names.push(_v);
                        break;
                    case 'ftv-type':
                        this.objDef.key = _v;
                        const _id = _obj.names.join(' ');
                        const _ref = _css_definition.fontFeatureValues;
                        this._resetSelectorDefinition();
                        if (!_ref[_id]) {
                            _ref[_id] = {};
                        }
                        _ndef = _ref[_id][_v] || (() => {
                            const c = new CssStyle;
                            _ref[_id][_v] = c;
                            return c;
                        });
                        _selectorDefinition.definitions = _ndef;
                        break;
                    case 'ftv-ident':
                        this.objDef.ident = _v;
                        break;
                    case 'css-font-feature-values':
                        this._resetSelectorDefinition();
                        this.objDef = null;
                        break;
                    default:
                        _h = false;
                        break;
                }
                return _h
            })();
        },
        // font-feature-values
        _onStartFontPaletteValues() {
            this._resetSelectorDefinition();
            this.objDef = { type: 'font-palette-values', key: null, ident: null, names: [] }
        },
        _handleFontPaletteValues(data, marker, tokenID, tokenList, _handle) {
            _handle.handle = (() => {
                let _h = true;
                let _v = data.value;
                let _obj = this.objDef;
                switch (tokenID) {
                    case 'ftp-name':
                        if (!_css_definition.fontPaletteValues) {
                            _css_definition.fontPaletteValues = {};
                        }
                        _obj.names.push(_v);
                        const _id = _obj.names.join(' ');
                        let _ndef = _css_definition.fontPaletteValues[_id] || (() => {
                            let c = new CssStyle;
                            _css_definition.fontPaletteValues[_id] = c;
                            return c;
                        })();
                        _selectorDefinition.definitions = _ndef;

                        break;
                    case 'css-font-palette-values':
                        this._resetSelectorDefinition();
                        this.objDef = null;
                        break;
                    default:
                        _h = false;
                        break;
                }
                return _h
            })();
        },

        // imports
        _onStartImport() {
            this._resetSelectorDefinition();
            this.objDef = {
                type: 'imports', key: null, ident: null, names: [],
                url: null, layer: null, supports: null, queries: null
            }
        },
        _handleImport(data, marker, tokenID, tokenList, _handle) {
            const q = this;
            _handle.handle = (() => {
                let _h = true;
                let _v = data.value;
                let _obj = q.objDef;
                if (!_css_definition.imports) {
                    _css_definition.imports = new CssImports;
                }
                switch (tokenID) {
                    case 'url':
                        _obj.url = _v;
                        break;
                    case 'media-queries':
                        _obj.queries = _v;
                        break;
                    case 'method-call':
                        if (/^layer/.test(_v)) {
                            _obj.layer = _v;
                        }
                        if (/^supports/.test(_v)) {
                            _obj.supports = _v;
                        }
                        break;
                    case 'css-import':
                        _css_definition.imports.store(_obj);
                        break;
                    default:
                        _h = false;
                        break;
                }
                return _h
            })();
        },
        // namespace
        _onStartNamespace() {
            this._resetSelectorDefinition();
            this.objDef = {
                type: 'namespace', prefix: null, url: null
            }
        },
        _handleNamespace(data, marker, tokenID, tokenList, _handle) {
            const q = this;
            _handle.handle = (() => {
                let _h = true;
                let _v = data.value;
                let _obj = q.objDef;
                if (!_css_definition.namespace) {
                    _css_definition.namespace = []
                }
                switch (tokenID) {
                    case 'ns-prefix':
                        _obj.prefix = _v;
                        break;
                    case 'url':
                        _obj.url = _v;
                        break;
                    case 'css-namespace':
                        this._resetSelectorDefinition();
                        this.objDef = null;
                        const { prefix, url } = _obj;
                        _css_definition.namespace.push({ prefix, url })
                        break;
                    default:
                        _h = false;
                        break;
                }
                return _h
            })();
        },

        // page
        _onStartPage() {
            this._resetSelectorDefinition();
            this.objDef = {
                type: 'page', selector: [],
                def: new CssStyle
            };
            _selectorDefinition.definitions = this.objDef.def;
            if (!_css_definition.pages) {
                _css_definition.pages = {};
            }
        },
        _handlePage(data, marker, tokenID, tokenList, _handle) {
            const q = this;
            _handle.handle = (() => {
                let _h = true;
                let _v = data.value;
                let _obj = q.objDef;
                switch (tokenID) {
                    case 'page-selector':
                        _obj.selector.push(_v);
                        break;
                    case 'url':
                        _obj.url = _v;
                        break;
                    case 'css-page':
                        const _def = _obj.def;
                        const _id = (_obj.selector.length > 0 ? _obj.selector.join(', ') : null) || '$global';
                        let _inf = _css_definition.pages[_id];
                        if (_inf) {
                            CssStyle.AppendDef(_inf, _def);
                        } else {
                            _css_definition.pages[_id] = _def;
                        }
                        this._resetSelectorDefinition();
                        this.objDef = null;
                        break;
                    default:
                        _h = false;
                        break;
                }
                return _h
            })();
        },

        // starting-style
        _onStartStartingStyle() {
            this._resetSelectorDefinition();
            this.objDef = {
                type: 'starting-style',
                current: _selectorDefinition.listener.styles
            };
            _selectorDefinition.definitions = new CssStyle;
            if (!_css_definition.startingStyle) {
                _css_definition.startingStyle = {};
            }
            _selectorDefinition.styleStore = _css_definition.startingStyle;
             
        },
        _handleStartingStyle(data, marker, tokenID, tokenList, _handle) {
            const q = this;
            _handle.handle = (() => {
                let _h = true; 
                let _obj = q.objDef;
                switch (tokenID) {
                    case 'css-starting-style':
                        // const _gdef = _selectorDefinition.definitions;
                        // const _def = _obj.def;
                        this._resetSelectorDefinition();
                        this.objDef = null;
                        _selectorDefinition.styleStore = _obj.current;
                        break;
                    default:
                        _h = false;
                        break;
                }
                return _h
            })();
        },

         // supports
         _onStartSupports() {
            this._resetSelectorDefinition();
            this.objDef = {
                type: 'supports', 
                key : '$global',
                storage: null
            };
            _selectorDefinition.definitions = new CssStyle;
            if (!_css_definition.supports) {
                _css_definition.supports = {};
            }
            this.objDef.storage = _css_definition.supports[this.objDef.key] || {};
            _selectorDefinition.styleStore = this.objDef.storage;
            _selectorDefinition.key = this.objDef.key;
             
        },
        _handleSupports(data, marker, tokenID, tokenList, _handle) {
            const q = this;
            _handle.handle = (() => {
                let _h = true; 
                let _obj = q.objDef;
                let _v = data.value;
                let _g = null;
                switch (tokenID) {
                    case 'support-condition':
                        _obj.key = _v;
                        _g = _css_definition.supports[_v];
                        if (_g){
                            this.objDef.storage = _g;
                            _selectorDefinition.styleStore = this.objDef.storage;
                             
                        } else{
                            _g = {};
                            this.objDef.storage = _g;
                            _selectorDefinition.styleStore = this.objDef.storage;
                            _css_definition.supports[_v] = _g;
                        }
                        break;
                    case 'css-supports':
                        // const _gdef = _selectorDefinition.definitions;
                        // const _def = _obj.def;
                        let _key = _obj.key;
                        if (_key=='$global'){
                            _css_definition.supports[_key] = _obj.storage; // selectorDefinition.definitions;
                        } 

                        this._resetSelectorDefinition();
                        this.objDef = null;
                        _selectorDefinition.styleStore = _obj.current;
                        break;
                    default:
                        _h = false;
                        break;
                }
                return _h
            })();
        },

        _onStartViewTransition() {
            this._resetSelectorDefinition();
            this.objDef = {
                type: 'view-transition',  
                storage: null
            };
            // + | direct style properties definition 
            _selectorDefinition.definitions = new CssStyle;
            if (!_css_definition.viewTransition) {
                _css_definition.viewTransition = _selectorDefinition.definitions ;
            }
             
        },
        _handleViewTransition(data, marker, tokenID, tokenList, _handle) {
            const q = this;
            _handle.handle = (() => {
                let _h = true; 
                let _obj = q.objDef; 
                switch (tokenID) { 
                    case 'css-view-transition':  
                        this._resetSelectorDefinition();
                        this.objDef = null;
                        _selectorDefinition.styleStore = _obj.current;
                        break;
                    default:
                        _h = false;
                        break;
                }
                return _h
            })();
        },
    };
    _formatter.listener = _listener;

}



/**
 * @typedef {undefined|boolean|string|string[]} IDebugFeatures 
 */

class CssTransformer {

    /**
     * 
     * @param {*} src 
     * @param {undefined|{debug:undefined|IDebugFeatures|bool, complete:undefined|(d:string)=>void, output: undefined|(css:CssStyleDefinitions)=>void} option 
     * @returns {string}
     */
    static ToJSON(src, option) {
        const _css_definition = new CssStyleDefinitions();
        const _selectorDefinition = new SelectorDefinition(_css_definition);


        function _updatePropertyDefinition() {
            _selectorDefinition.update();
        }
        function _updateMediaDefinition() {
            // console.log("update media definition : ");
            if (_listener.medias_definition) {
                if (!_css_definition.medias) {
                    _css_definition.initMedia();
                }
                _css_definition.medias[_listener.medias_definition.condition] =
                    _listener.medias_definition.styles;
            }
        }
        let _debug = false;

        if (option) {
            (() => {
                const { debug } = option;
                _debug = debug;
            })();
        }
        _formatter.debug = _debug;
        _initListener(_formatter, _selectorDefinition, {
            _updatePropertyDefinition,
            _updateMediaDefinition, _css_definition
        });
        const _listener = _formatter.listener;
        const _format = _formatter.format(src, {
            complete() {
                _selectorDefinition.store();
                _selectorDefinition.complete();
            }
        }
        );
        if (typeof (option?.format) == 'function') {
            option.format(_format);
        }
        if (typeof (option?.output) == 'function') {
            option.output(_css_definition);
        }
        return JSON.stringify(_css_definition, null, 4);
    }
}
exports.CssTransformer = CssTransformer