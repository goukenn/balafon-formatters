Object.defineProperty(exports, '__esModule', {value:true});

/**
 * json parser info
 */
class JSonParser{
    source;
    data; 
    registry;
    repositoryKey;
    throwOnError;
    /**
     * store pattern class name
     */
    patternClassName;
    /**
     * store capture info class name
     */
    captureInfoClassName;

    get current(){
        return this.m_current;
    }

    constructor(){
        this.m_current = null;
        this.throwOnError = true;
    }

    /**
     * initialize object to registry
     * @param {*} _o 
     */
    initialize(_o){
        if (this.registry){
            this.registry.initialize(_o);
        }
    }

    parse(){
        obj = new this.source();
        this.m_current = this.data;
        JSonParser._LoadData(this, obj, this.data);
        return obj;
    }
    /**
     * load data with reference object 
     * @param {*} parser 
     * @param {*} obj 
     * @param {*} data 
     * @param {*} refKey 
     * @param {*} _refObj 
     * @returns 
     */
    static _LoadData(parser, obj, data, refKey, _refObj){
        const _throwOnError = parser.throwOnError;
        const keyData = ()=>{
            if (obj.json_keys){
                return obj.json_keys();
            }
            return Object.keys(obj);
        };
        let validation = obj.json_validate;
        let json_parsing = obj.json_parse;
        keyData().forEach((i)=>{
            let _r = data[i];
            if (typeof(_r)=='undefined'){
                return;
            } 
            if ((validation)&& !validation.apply(obj, [i, _r, _throwOnError])){
                return;
            }
            if (json_parsing){
                _r = json_parsing.apply(obj, [parser, i, _r, refKey, _refObj]);
            }
            obj[i] = _r;
        });
        return obj;
    }
}

exports.JSonParser = JSonParser;