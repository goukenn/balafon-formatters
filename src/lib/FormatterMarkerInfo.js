"use strict"; 
Object.defineProperty(exports, 'enModule', {value:true});

const { Debug } = require('./Debug');

class FormatterMarkerInfo{
    marker;
    start;
    endRegex;
    childs;
    state;
    childType; 

    constructor(){
        var m_content = '';
        defineProperty(this, 'content', {
            get(){
                return m_content;
            },
            set(v) {
                if (v != m_content) {
                    Debug.IsEnabled && Debug.log("store content :" + v)
                    m_content = v;
                }
            }
        })
    }
}

exports.FormatterMarkerInfo;