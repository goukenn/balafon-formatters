"use strict";
Object.defineProperty(exports, "__ESModule", { value: true });

const _REGISTRY = {};
/**
 * base transform engine
 */
class TransformEngine
{
    static Register(id, func_or_class_name){
        _REGISTRY[id] = func_or_class_name;
    }
    static Create(id){
        const def = _REGISTRY[id];
        if (def){
            return new def();
        }
        return null;
    }
}

exports.TransformEngine = TransformEngine;