"use strict";
Object.defineProperty(exports, '__esModule', { value: true });


/**
 * class Used to store style definition
 */
class CssStyleDefinitions{
    charset;
    frames;
    styles;
    // medias;
    imports;
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
    toJSON(){
        let ref = {};
        let { medias } = this;
        if(medias && (Object.keys(medias).length>0)){
            ref.medias = medias;
        }
        return {...this,...ref}
    }
    initMedia(){
       // this.medias = {};
    }
}


exports.CssStyleDefinitions = CssStyleDefinitions;