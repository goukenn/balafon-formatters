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
    
    /**
     * store marker update mode
     * @var {number}
     */
    currentMode;

    /**
     * use to capture entry 
     * @var {?string}
     */
    captureEntry;

    /**
     * store context join with
     */
    joinWith;

    /**
     * data stored
     */
    prependExtra;

    storePrependExtra(data){
        if (!this.prependExtra && data){
            if (!Array.isArray(this.prependExtra)){
                this.prependExtra = [this.prependExtra]
            }
            this.prependExtra.push(data);
            return;
        }
        this.prependExtra = data;
    }

    toString(){
        return 'FormatterMarkerInfo#'+this.marker.toString();
    }

    /**
     * update marker info
     * @param {*} data 
     */
    updateDataSegments(data){
        const {bufferSegment, dataSegment} = data;
        const _data = this.data;
        const ic = _data.bufferSegment.length;
        _data.bufferSegment.push(...bufferSegment);
        _data.dataSegment.push(...dataSegment);

        const _marked = bufferSegment.marked?.slice(0);
        if (_marked){
            for(let c = 0; c <  _marked.length; c++){
                let _new_id =    _marked[c] + ic;
                _marked[c] += ic;
                if (c in bufferSegment.marked.op){
                    let _op = bufferSegment.marked.op[c];
                    delete(bufferSegment.marked.op[c]);
                    bufferSegment.marked.op[_new_id]  = _op;
                }
            }
            if ( !_data.bufferSegment.marked )
                _data.bufferSegment.marked  = [];
            _data.bufferSegment.marked.push( ..._marked);
            _data.bufferSegment.marked.op = { ... _data.bufferSegment.marked.op, ... bufferSegment.marked.op };
        }

    }
    /**
     * create a formatter marker info 
     * @param {*} formatter 
     * @param {*} _marker 
     * @param {*} entry 
     * @param {*} _endRegex 
     * @param {*} option 
     */
    constructor(formatter, _marker, entry, _endRegex, option){  
        this.startBlock = _marker.isBlock ? 1 : 0;
        this.oldBlockStart = _marker.isBlock;
        this.blockStarted = false;
        this.currentMode = _marker.mode;
        

        Object.defineProperty(this, 'formatter', {get(){return formatter;}}); 
        Object.defineProperty(this, 'marker', {get(){return _marker;}});
        Object.defineProperty(this, 'endRegex', {get(){return _endRegex;}});

        
    
        (function (entry, _marker_info) {
            var _content = entry;
            var _isNew  = true;
            // + | static storage - presentation value 
            var _data = null;

            _marker_info.updateStore

            if (option?.lastDefineStates?.bufferSegment.join('')==entry){
                const { dataSegment, bufferSegment } = option.lastDefineStates;
                _data = { dataSegment, bufferSegment };
            }else{
                _data = {dataSegment: [], bufferSegment:[]}
            }
            _marker_info.set = function(){
                _isNew = false;
            };
            /**
             * get stored data segment
             */
            Object.defineProperty(_marker_info, 'data', {get(){
                return _data;
            }});
            /**
             * is new marker info 
             */
            Object.defineProperty(_marker_info, 'isNew', {get(){
                return _isNew;
            }});
            Object.defineProperty(_marker_info, 'entryBuffer', {
                get() {
                    return entry;
                }
            });
            Object.defineProperty(_marker_info, 'content', {
                get() {
                    return _content;
                },
                set(v) {
                    
                    if (v != _content) {
                        option.debug?.feature("store-content") && (()=>{
                            Debug.log("---::store content ::---\n[value::'" + v+"']"); 
                            console.log({newValue: v, oldValue:_content});
                        })();
                        _content = v;
                    } 
                }
            });
            Object.defineProperty(_marker_info, 'childs', {
                get() {
                    return _marker_info.marker.childs;
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