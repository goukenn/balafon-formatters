"use strict"; 
Object.defineProperty(exports, '__esModule', {value:true});

const { Debug } = require('./Debug');
const { FormatterBuffer } = require('./FormatterBuffer');

/**
 * formatter marker info setting
 */
class FormatterMarkerInfo{
    /**
     * buffering buffer start
     */
    start = false;
    /**
     * backup state
     */
    state;
    /**
     * flag: indicate newly start block
     * @var {bool}
     */
    startBlock;

    oldBlockStart;
    blockStarted;
    useEntry = true;

    toString(){
        return 'FormatterMarkerInfo#'+this.marker.toString();
    }
    constructor(formatter, _marker, entry, _endRegex, option){  
        this.startBlock = _marker.isBlock ? 1 : 0;
        this.oldBlockStart = _marker.isBlock;
        this.blockStarted = false;
        

        Object.defineProperty(this, 'formatter', {get(){return formatter;}}); 
        Object.defineProperty(this, 'marker', {get(){return _marker;}});
        Object.defineProperty(this, 'endRegex', {get(){return _endRegex;}});

        
    
        (function (entry, _inf) {
            var _content = entry;
            var _isNew  = true;
            _inf.set = function(){
                _isNew = false;
            };
            
            /**
             * is new marker info 
             */
            Object.defineProperty(_inf, 'isNew', {get(){
                return _isNew;
            }});
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
                        option.debug && Debug.log("---::store content ::---\n" + v)
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
    } 
    /**
     * save state 
     * @param {*} option mode definition 
     * @param {number} mode formatting mode
     */
    saveState(option, mode){
        // + | save buffer state 
        this.state = {
            buffer: option.formatterBuffer.buffer, // store old buffer
            output: option.output,
            formatterBuffer: option.formatterBuffer,
            get currentBufferContent(){
                return this.formatterBuffer.buffer;
            },
            get mode(){
                return mode;
            }
        }; 
    }

}

exports.FormatterMarkerInfo = FormatterMarkerInfo;