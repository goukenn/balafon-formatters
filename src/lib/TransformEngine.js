"use strict";
Object.defineProperty(exports, "__ESModule", { value: true });

const _REGISTRY = {};
/**
 * base transform engine
 */
class TransformEngine
{
    /**
     * register transform engine
     * @param {*} id 
     * @param {*} func_or_class_name 
     */
    static Register(id, func_or_class_name){
        _REGISTRY[id] = func_or_class_name;
    }
    static CleareRegistry(){
        Object.keys(_REGISTRY).forEach((o)=>{
            delete(_REGISTRY[o]);
        });

    }
    /**
     * create a transform engine 
     * @param {*} id 
     * @returns 
     */
    static Create(id){
        const def = _REGISTRY[id];
        if (def){
            return new def();
        }
        return null;
    }
}

exports.TransformEngine = TransformEngine;