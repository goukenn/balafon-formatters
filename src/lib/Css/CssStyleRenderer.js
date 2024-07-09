"use strict";
Object.defineProperty(exports, '__esModule', { value: true });

const profileNames = {
    "colorProfile":"color-profile",
    "counterStylye":"counter-style",
    "fontFace":"font-face",
    "fontFeatureValues":"font-feature-values",
    "startingStyle":"starting-style",
    "fontPaletteValues":"font-palette-values"
}
const _get_directive = (n)=>{
    return profileNames[n] || n.replace(/[A-Z]/g, (o)=>'-'+o.toLowerCase()).toLowerCase();
};
const _glusStyles = (m, filter)=>{
    let p = [];
    let sep = '';
    for(let i in m){
        if (filter && filter(i)){
            continue;
        }
        p.push(i+":"+sep+m[i]);
    }
    return p.join(";");
}
class CssStyleRenderer{
    pretty = false;
    minify = true;
    /**
     * object to render 
     * @param {*} obj 
     */
    render(obj){
        const objKeys = Object.keys(obj);
        let s = '';
        const _multi_def = ['scope'];
        objKeys.forEach(o=>{
            if (/\b(charset|frames|medias|styles)\b/.test(o)){
                return;
            }
            let _f = obj[o];
            if (_f){
                let _k = _get_directive(o);

                let _fc = this['_render_'+o.toLowerCase().replace('-','_')];
                if (typeof(_fc)=='function'){
                    if (_multi_def.indexOf(_k)==-1)
                        s+= '@'+_k+' ';
                    s += _fc.apply(this, [_f]);
                }else{
                    s += '/* missing rendering for ['+o+"] */";
                }
            }

        }); 
        return s;
    }
    static RenderRule(d, {pretty}){
        const s = [];
        let _n = false;
        Object.keys(d).sort().forEach(i=>{

                let l = d[i];
                if (pretty && _n){
                    s.push(' ');
                }
                s.push(i);
                s.push('{');
                s.push(_glusStyles(l));
                s.push('}');
             _n = true;
        });

        return s.join('');
    }
    _render_colorprofile(d){
        const s = [];
        for ( let i in d){
            let l = d[i];
            s.push(i);
            s.push('{');
            s.push(_glusStyles(l));
            s.push('}');
        } 
        return s.join('');
    }
    _render_container(d){
        const s = [];
        
        for(let i in d){
            let l = d[i];  
            s.push(i);
            s.push('{');
            let j = l['$container'];
            if (j){
                s.push(('@container '+this._render_container(j)).replace(/^@container\s+\(/,'@container('));
            }
            s.push(_glusStyles(l, (o)=>/\$\bcontainer\b/.test(o)));
            s.push('}');
        }
        return s.join('')
    }
    _render_property(d){
        return CssStyleRenderer.RenderRule(d, this);
    }
    _render_scope(d){
        let s = [];
        for(let i in d){
            let l = d[i];
            s.push('@scope '+i);
            s.push('{');
       
                s.push(CssStyleRenderer.RenderRule(l, this));
            
            s.push('}');
        }
        return s.join('');
    }
}
exports.CssStyleRenderer = CssStyleRenderer;
exports.Utils = {
    glueStyles:_glusStyles
};