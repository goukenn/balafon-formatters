Object.defineProperty(exports, '__esModule', {value:true});

const { Patterns } = require("./Patterns");

class RefPatterns {
    pattern;
    /**
     * reference pattern
     * @param {Patterns} pattern 
     */
    constructor(pattern){
        this.pattern = pattern;
        
        
        var m_line;
        var m_match;
        var m_parent;

        Object.defineProperty(this, 'group', {get(){ return m_match; }}); 
        Object.defineProperty(this, 'line', {get(){ return m_line; }});
        Object.defineProperty(this, 'parent', {get(){ return m_parent; }, set(v){ m_parent = v;}});


        this.startMatch = (l,p)=>{
            m_line = l;
            m_match = p;
        };
    }
    check(l){
        return this.pattern.check(l);
    } 
     
    
    toString(){
        return `RefPatterns[#${this.pattern.name}]`;
    }
    get name(){
        return this.pattern.name;
    }
    /**
     * 
     * @param {string} l string 
     * @param {*} p regex match result info
     */
    startMatch(l,p){
        this.m_line = l;
        this.m_match =  p;
    }
    get matchType(){
        return this.pattern.matchType;
    }
    get index(){
        return this.group.index;
    }
    
    get line(){
        return this.m_line;
    }
    get isBlock(){
        return this.pattern.isBlock;
    }
    get allowMultiline(){
        return this.pattern.allowMultiline;
    }
    get preserveLineFeed(){
        return this.pattern.preserveLineFeed;
    }

    endRegex(p){
        return this.pattern.endRegex(p);
    }
    get patterns(){
        return this.pattern.patterns;
    }
    get begin(){
        return this.pattern.begin;
    }
    get match(){
        return this.pattern.match;
    }
    get end(){
        return this.pattern.end;
    }
    get blockStart(){
        return this.pattern.blockStart
    }
    get blockEnd(){
        return this.pattern.blockEnd;
    }
    get lineFeed(){
        return this.pattern.lineFeed;
    }
}
exports.RefPatterns = RefPatterns;