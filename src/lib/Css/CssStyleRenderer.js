"use strict";
Object.defineProperty(exports, '__esModule', { value: true });

const profileNames = {
    "colorProfile": "color-profile",
    "counterStyles": "counter-styles",
    "fontFace": "font-face",
    "fontFeatureValues": "font-feature-values",
    "startingStyle": "starting-style",
    "fontPaletteValues": "font-palette-values"
}
const _multi_def = ['scope', 'layer', 'counter-styles', 'font-face', 'font-feature-values', 'font-palette-values', 'imports', 'namespace', 'pages','starting-style', 'supports','view-transition'];

const _get_directive = (n) => {
    return profileNames[n] || n.replace(/[A-Z]/g, (o) => '-' + o.toLowerCase()).toLowerCase();
};
/**
 * 
 * @param {*} m list
 * @param {*} filter use to filter property 
 * @param {*} filter_sub use to filter object 
 * @returns 
 */
const _glueStyles = (m, filter, filter_sub) => {
    let p = [];
    let sep = '';
    function _set_join(p) {
        const m = p.join(';');
        p.length = 0;
        p.push(m);
        return p;
    }
    for (let i in m) {
        let f = m[i];
        if (filter && filter(i)) {
            continue;
        }
        if (typeof (f) == 'object') {
            if (filter_sub) {
                if (filter_sub(p, i, f)) {
                    _set_join(p);
                    continue;
                }
            }
        }
        p.push(i + ":" + sep + m[i]);
    }
    _set_join(p);
    return p[0];//.join(";");
}
class CssStyleRenderer {
    pretty = false;
    minify = true;
    renderMedias(medias) {
        let s = [];
        let _keys = Object.keys(medias);
        if (_keys.length > 0)
            _keys.forEach(s => {
                let l = medias[s];
                s.push('@media ' + s);
                s.push('{');
                s.push(_glueStyles(l));
                s.push('}');

            })

        return s.join('');

    }
    /**
     * object to render 
     * @param {*} obj 
     */
    render(obj) {
        const objKeys = Object.keys(obj);
        let s = '';
        objKeys.forEach(o => {
            if (/\b(charset|frames|medias|styles)\b/.test(o)) {
                return;
            }
            let _f = obj[o];
            if (_f) {
                let _k = _get_directive(o);

                let _fc = this['_render_' + o.toLowerCase().replace('-', '_')];
                if (typeof (_fc) == 'function') {
                    if (_multi_def.indexOf(_k) == -1)
                        s += '@' + _k + ' ';
                    s += _fc.apply(this, [_f]);
                } else {
                    s += '/* missing rendering for [' + o + "] */";
                }
            }

        });
        return s;
    }
    /**
     * render global rules
     * @param {*} d 
     * @param {{pretty:boolean}} option 
     * @param {(s:string[], i:string, l:object, refObj:undefined|{space:boolean})=>boolean} filter filter callback 
     * @returns 
     */
    static RenderRule(d, { pretty }, filter) {
        const s = [];
        let _n = false;
        let _refObj = { space: _n };
        let _filter_sub = filter ? (s, i, l) => {
            return filter(s, i, l, _refObj);
        } : null;
        Object.keys(d).sort().forEach(i => {

            let l = d[i];
            _n = _refObj.space;
            if (pretty && _n) {
                s.push(' ');
            }
            s.push(i);
            s.push('{');
            s.push(_glueStyles(l, null, _filter_sub));
            s.push('}');
            _n = true;
        });

        return s.join('');
    }
    _render_colorprofile(d) {
        const s = [];
        for (let i in d) {
            let l = d[i];
            s.push(i);
            s.push('{');
            s.push(_glueStyles(l));
            s.push('}');
        }
        return s.join('');
    }
    _render_container(d) {
        const s = [];

        for (let i in d) {
            let l = d[i];
            s.push(i);
            s.push('{');
            let j = l['$container'];
            if (j) {
                s.push(('@container ' + this._render_container(j)).replace(/^@container\s+\(/, '@container('));
            }
            s.push(_glueStyles(l, (o) => /\$\bcontainer\b/.test(o)));
            s.push('}');
        }
        return s.join('')
    }
    _render_property(d) {
        return CssStyleRenderer.RenderRule(d, this);
    }
    _render_scope(d) {
        let s = [];
        for (let i in d) {
            let l = d[i];
            s.push('@scope ' + i);
            s.push('{');
            s.push(CssStyleRenderer.RenderRule(l, this));
            s.push('}');
        }
        return s.join('');
    }
    _render_layer(d) {
        const q = this;
        const s = [];
        if (d.list.length > 0) {
            s.push('@layer ' + d.list.join(',') + ';');
        }
        function _render_layer(s, i, _f) {
            let _n = i != '@global' ? ' ' + i : '';
            s.push('@layer' + _n);
            s.push('{');
            s.push(_f);
            s.push('}');
        }
        function _render_layer_child(s, i, l) {
            let _op = { ...l };
            let _f = _get_inner_layer(_op);
            if (_f && (_f.length > 0)) {
                _render_layer(s, i, _f);
            }
        }
        function _get_inner_layer(_copy) {
            const _childs = _copy['@childs'];
            const s = [];
            const _filter = (s, i, l, refObj) => {
                if (i == '@childs') {
                    const _s = [];
                    for (let k in l) {
                        _render_layer_child(_s, k, l[k]);
                    }
                    s.push(_s.join(''));
                    refObj.space = true;
                    return true;
                }
                return false;
            };
            if (_childs) {
                for (let i in _childs) {
                    let _op = { ..._childs[i] };
                    let _f = _get_inner_layer(_op);
                    if (_f && (_f.length > 0)) {
                        _render_layer(s, i, _f);
                    }
                }
            }

            delete (_copy['@childs']);
            s.push(CssStyleRenderer.RenderRule(_copy, q, _filter));
            return s.join('');
        }

        for (let i in d.styles) {
            let l = d.styles[i];
            let _copy = { ...l };
            let _f = _get_inner_layer(_copy, this);
            if (_f && (_f.length > 0)) {
                _render_layer(s, i, _f);
            }
        }

        return s.join('');

    }

    _render_counterstyles(d) {
        const s = [];
        const sep = '';
        for (let i in d) {
            let l = d[i];
            let m = { ...l };

            s.push("@counter-styles " + i);
            s.push('{');
            let cp = [];
            for (let k in m) {
                let _v = m[k];
                if (_v) {
                    _v = /^\s+$/.test(_v) ? "'" + _v + "'" : _v;
                    cp.push(k + ":" + sep + _v)
                }
            }
            s.push(cp.join(';'));
            s.push('}');
        }
        return s.join('');
    }
    _render_fontface(d) {
        const s = [];
        d.forEach(i => {
            let l = i;
            s.push('@font-face{');
            _render_in_def(s, l);
            s.push('}');
        });
        return s.join('');
    }
    _render_fontfeaturevalues(d) {
        const s = _render_def("@font-feature-values ", d, this);
        return s;
    }
    _render_fontpalettevalues(d) {
        const s = _render_def("@font-palette-values ", d, this);
        return s;
    }
    _render_imports(d) {
        const s = [];
        d._list.forEach((a) => {
            let cd = [];

            if (a.url) {
                cd.push(a.url);
                ['layer', 'supports','queries'].forEach((i)=>{
                    if (a[i])
                    cd.push(a[i])
                });
            }
            if (cd.length > 0) {
                cd = cd.join(' ')+";";
                s.push('@import ' + cd);
            }
        });

        return s.length > 0 ? s.join('') : null;
    }
    _render_namespace(d){
        const s =  [];
        d.forEach((a)=>{
            const d = [];
            ['prefix','url'].forEach(i=>{
                if (a[i]){
                    d.push(a[i]);
                }
            });
            if (d.length>0){
                s.push('@namespace '+d.join(' ')+';');
            }
        });
        return s.join('');
    }
    _render_pages(d){
        const s = [];
        let i = null;
        for (i in d){
            let m = '';
            let l = d[i];
            if (i !='$global'){
                m += i;
            }
            let r = _glueStyles(d[i]);
            if (r){
                m += '{'+r+'}';
            } 
            if (m){
                s.push("@page ");
                s.push(m);
            } 
        }
        return s.join('');
    }
    _render_startingstyle(d){
        const s = [];
        s.push(_render_def("@starting-style", d, this));
        return s.join('');
    }
    _render_supports(d){
        const s = [];
        // condition => setting
        for(let i in d){
            let m = [];
            let l = d[i];
            m.push('@supports');
            if (i!='$global'){
                let sep = /^[^a-z@]/.test(i) ? '': ' ';
                m.push(sep+i);
            }
            m.push('{');
            m.push(_render_def('', l, this).trim());
            m.push('}');

            s.push(m.join(''));
        }

        return s.join('');
    }
    _render_viewtransition(d){
        const s = []; 
        const m = [];
        m.push('{');
        m.push(_glueStyles(d));
        m.push('}');
        s.push('@view-transition'+m.join('')); 
        return s.join('');
    }
}
/**
 * render in def 
 * @param {*} s 
 * @param {*} m 
 */
function _render_in_def(s, m) {
    let cp = [];
    const sep = '';

    for (let k in m) {
        let _v = m[k];
        if (_v) {
            _v = /^\s+$/.test(_v) || (typeof (_v) == 'object') ? "'" + _v + "'" : _v;
            cp.push(k + ":" + sep + _v)
        }
    }
    s.push(cp.join(';'));
}
/**
 * render definition 
 * @param {*} key 
 * @param {*} d 
 * @param {*} renderer 
 * @returns 
 */
function _render_def(key, d, renderer) {
    const s = [];
    const sep = '';
    for (let i in d) {
        let l = d[i];
        let m = { ...l };
        s.push(key + ' ' + i);
        s.push('{');
        let cp = [];
        for (let k in m) {
            let _v = m[k];
            if (_v) {
                if (typeof (_v) == 'object') {
                    let g = _glueStyles(_v);
                    if (g && (g.length > 0))
                        cp.push(k + ":" + sep + g);
                } else {
                    _v = /^\s+$/.test(_v) ? "'" + _v + "'" : _v;
                    cp.push(k + ":" + sep + _v);
                }
            }
        }
        s.push(cp.join(';'));
        s.push('}');
    }
    return s.join('');
}

exports.CssStyleRenderer = CssStyleRenderer;
exports.Utils = {
    glueStyles: _glueStyles
};