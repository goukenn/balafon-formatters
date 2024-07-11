"use strict";
Object.defineProperty(exports, '__esModule', { value: true });

const { CssStyleRenderer } = require('./CssStyleRenderer');

/**
 * class Used to store style definition
 */
class CssStyleDefinitions{
    /**
     * store charset
     */
    charset;
    /**
     * store frames list
     */
    frames;
    /**
     * store global style definition
     */
    styles;

    /**
     * retrieve color profiles
     * @var {*}
     */
    colorProfile;
    // medias;
    imports;

    /**
     * retrieve container
     * @var {*}
     */
    container;

    /**
     * get or set counter style
     */
    counterStyle;

    /**
     * get or set font faces
     */
    fontFace;

    /**
     * get or set font feature values
     */
    fontFeatureValues;
    /**
     * get or set font palette values
     */
    fontPaletteValues;
    /**
     * get or set layer definition
     */
    layer;
    /**
     * get or set namespace
     */
    namespace;
    /**
     * get or set page
     */
    page;
    /**
     * get or set property
     */
    property;
    /**
     * get or set scope
     */
    scope;
    /**
     * get or set startingStyle
     */
    startingStyle;
    /**
     * get or set supports
     */
    supports;






    constructor(){
        this.styles = {}; 
        var m_media = null;
        Object.defineProperty(this, 'medias',{
            get(){
                if (!m_media){
                    m_media = {};
                }
                return m_media;
            }
        })
    }
    /**
     * export to json definition
     * @returns 
     */
    toJSON(){
        let ref = {};
        let { medias, styles } = this;
        
        for(let i in this){
            if (/\b(medias|styles)\b/.test(i)) continue;
            const lt = this[i];
            if (lt){
                ref[i] = lt;
            }
        }
        if(styles && (Object.keys(styles).length>0)){
            ref.styles = styles;
        } 
        if(medias && (Object.keys(medias).length>0)){
            // get only non null medias

            ref.medias = medias;
        }
        return ref;
    }
    /**
     * build css litteral
     * @returns 
     */
    css(){
        function _glueStyle(m){
            let p = [];
            let sep = '';
            for(let i in m){
                let j = m[i];
                if (j !== null){
                    if (typeof(j)=='object'){
                        j = "'"+j+"'";
                    }
                    p.push(i+":"+sep+j);
                }
            }
            return p.join(";");
        }
        const sep = '';
        const res = [];
        if (this.charset){
            res.push('@charset '+this.charset);
        } 
        
        const render = new CssStyleRenderer;   
        let s = render.render(this);
        if (s && s.length>0){
            res.push(s);
        } 
        if (this.frames){
            for(let i in this.frames){
                let s = "@keyframes "+i;
                let def = this.frames[i];

                s+="{";
                for(let j in def){
                    s+=j+'{';
                    s+= _glueStyle(def[j]);
                    s+='}';
                }
                s+="}";
                res.push(s);
            }
        }

        if (this.styles){
            for (let i in this.styles){
                let m = this.styles[i];
                let l = _glueStyle(m);
                if (l && (l.length>0))
                res.push(i+"{"+ l +"}");
            }
        }
        if (this.medias){
            let s = render.renderMedias(this.medias);
            if (s){
            res.push(s);
            }
        } 
        return res.join(sep);
    }
    initMedia(){
        this.medias = {};
    }
}


exports.CssStyleDefinitions = CssStyleDefinitions;