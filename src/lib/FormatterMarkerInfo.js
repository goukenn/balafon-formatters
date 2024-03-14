"use strict"; 
Object.defineProperty(exports, '__esModule', {value:true});

const { Debug } = require('./Debug');
const { FormatterBuffer } = require('./FormatterBuffer');

/**
 * formatter marker info setting
 */
class FormatterMarkerInfo{

    start = false;
    state;
    childType; 
    startBlock;
    oldBlockStart;
    blockStarted;
    useEntry = true;

    constructor(formatter, _marker, entry, _endRegex, option){
        var m_content = '';
        var m_formatterBuffer = new FormatterBuffer;

        this.startBlock = _marker.isBlock ? 1 : 0;
        this.oldBlockStart = _marker.isBlock;
        this.blockStarted = false;
        

        Object.defineProperty(this, 'formatter', {get(){return formatter;}});
        Object.defineProperty(this, 'formatterBuffer', {get(){return m_formatterBuffer;}});
        Object.defineProperty(this, 'marker', {get(){return _marker;}});
        Object.defineProperty(this, 'endRegex', {get(){return _endRegex;}});

        this.state = {
            buffer: option.formatterBuffer.buffer, // store old buffer
            output: option.output,
            formatterBuffer: option.formatterBuffer
        };

        // {
            // marker: _marker,
            // start: false,
            // content: l, // define content property
            // endRegex: _endRegex,
            // startBlock: _marker.isBlock ? 1 : 0, // start join mode 0|block = append new line before 
            // autoStartChildBlock: false, // indicate that child is an autostarted child start bloc
            // oldBlockStart: _marker.isBlock, // backup the start source start 
            // blockStarted: false, // block stared flags for buffer 
            // state: { // backup buffer 
            //     // buffer: option.buffer,
            //     buffer: option.formatterBuffer.buffer, // store old buffer
            //     output: option.output,
            //     formatterBuffer: option.formatterBuffer
            // },
            //useEntry: true
        // };
        (function (entry, _inf) {
            var _content = '';
            Object.defineProperty(_inf, 'entryBuffer', {
                get() {
                    return entry;
                }
            });
            Object.defineProperty(_inf, 'content', {
                get() {
                    return _content;
                },
                set(v) {
                    if (v != _content) {
                        option.debug && Debug.log("store content :" + v)
                        _content = v;
                    }
                }
            });
            Object.defineProperty(_inf, 'childs', {
                get() {
                    return _inf.marker.childs;
                }
            });
        })(entry, this);

     
    

       
        /**
         * get or set current buffering content.
         */
        // defineProperty(this, 'content', {
        //     get(){
        //         return m_content;
        //     },
        //     set(v) {
        //         if (v != m_content) {
        //             Debug.IsEnabled && Debug.log("store content :" + v);
        //             m_content = v;
        //         }
        //     }
        // });
       
    }
    /**
     * update this marker info
     */
    update(){

    }
}

exports.FormatterMarkerInfo = FormatterMarkerInfo;