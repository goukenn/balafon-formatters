(()=>{var e={215:(e,t)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0});class r{static LogLevel=3;static#e=!1;static get IsEnabled(){return r.#e}static log(e,t){if(t&&t<r.LogLevel)return;"object"==typeof e&&(e=JSON.stringify(e,((e,t)=>0==e.length?t:"object"==typeof t?{}:"array"==typeof t?[]:t)));let n=[];if(arguments)for(let e=1;e<arguments.length;e++)n.push(arguments[e]);console.log(`[igk-formatters] - ${e}`,...n)}static Enable(e){r.#e=e}}t.Debug=r},554:(e,t,r)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0});const{Debug:n}=r(215),{Patterns:i}=r(705),{Utils:a}=r(57);t.FormatterListener=class{objClass=null;treatBuffer;constructor(){var e;Object.defineProperty(this,"lastMarker",{get:()=>e}),this.setLastMarker=function(t){e=t}}startNewBlock(e){const t=this.objClass;if(!t)return;let r=t.depth;t.output.length=0,t.output.push(""),t.output.push(t.tabStop.repeat(r))}treatEndBufferCapture(e,t,r,n){const{endCaptures:i}=e;if(i)for(let t in i){let r=e.endCaptures[t];0==t&&r.nextTrimWhiteSpace&&(n=n.trimEnd())}return n}treatEndCapture(e,t,r){const{endCaptures:n}=e;if(n)for(let t in n)e.endCaptures[t].nextTrimWhiteSpace&&(this.objClass.buffer=this.objClass.buffer.trimEnd());return t}treatBeginCapture(e,t){}treatValue(e,t,r=!1){let n=this.lastMarker;if(n&&n.nextTrimWhiteSpace&&(this.objClass.buffer=this.objClass.buffer.trimEnd()),r&&e.endCaptures)for(let t in e.endCaptures){let r=e.endCaptures[t];0==t&&r.nextTrimWhiteSpace&&(this.objClass.buffer=this.objClass.buffer.trimEnd())}if(e.replaceWith&&e.match){let r=a.GetRegexFrom(e.replaceWith.toString(),e.group);r=r.toString().substring(1).slice(0,-1),t=t.replace(e.match,r)}return e.tokenID&&this.setLastMarker(e),t}append(e,t,r=!1){let i=this.objClass;if(i&&0!=e.length){if(t&&(i.debug&&n.log({tokenID:t.tokenID,value:e,name:t.name}),e=this.treatValue(t,e,r)),t&&t.isBlockDefinition&&!i.blockOnSingleLine&&i.buffer.length>0&&this.store(),t?t.lineFeed&&(i.buffer=this.objClass.buffer.trimEnd()):e=e.replace(/\s+/g," "),i.debug&&n.log("append: "+e),i.buffer.length>0){let t=new RegExp("^\\s+(.+)\\s+$");e=e.replace(t," "+e.trim()+" ")}i.lineJoin&&(i.noSpaceJoin||(i.buffer=i.buffer.trimEnd()+" "),i.lineJoin=!1),i.buffer+=e,t&&t.lineFeed&&this.store()}}appendAndStore(e,t,r=!1){this.append(e,t,r),this.store()}store({buffer:e,output:t,depth:r,tabStop:n,startBlock:i}){let a=e,s=r;if(a=a.trim(),a.length>0){i&&t.unshift("");let e=s>0?n.repeat(s):"";t.push(e+a)}}output(e,{output:t,lineFeed:r}){let n=t.join(r);return e&&(t=[]),n}appendLine(){const e=this.objClass;e.output.length>0&&(e.output[e.output.length-1]+=e.lineFeed)}treat}},480:(e,t)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.FormatterSetting=class{tabStop="\t";lineFeed="\n";blockOnSingleLine=!0;noSpaceJoin=!1;depth=0;line=0;useCurrentFormatterInstance=!0}},509:(e,t,r)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0});const{Utils:n}=r(57),{Patterns:i}=r(705),{RefPatterns:a}=r(370),{JSonParser:s}=r(459),{Debug:o}=r(215),{FormatterListener:l}=r(554),{FormatterSetting:u}=r(480),{PatternMatchInfo:c}=r(61);n.Classes={RefPatterns:a,Patterns:i,PatternMatchInfo:c};class p{patterns;repository;scopeName;debug;settings;constructor(){let e,t,r=[],n={isSubFormatting:0,captureGroup:null};this.debug=!1,this.patterns=[],this.repository={},Object.defineProperty(this,"listener",{get:()=>e,set(t){e=t}}),Object.defineProperty(this,"errors",{get:()=>r}),Object.defineProperty(this,"info",{get:()=>n}),Object.defineProperty(this,"objClass",{get:()=>t}),this.pushError=e=>{this.m_errors.push({101:"not in capture."}[e])},this._storeObjClass=function(e){t=e,delete this._storeObjClass}}get lineFeed(){return this.m_option.lineFeed}set lineFeed(e){this.m_option=e}json_keys(){const e="repository";let t=Object.keys(this),r=t.indexOf(e);return delete t[r],t.unshift(e),t}json_validate(e,t,r){const n={patterns:e=>Array.isArray(e),repository:e=>"object"==typeof e,debug:e=>"boolean"==typeof e||/(yes|no|1|0)/.test(e),settings:e=>null==e||"object"==typeof e,scopeName:e=>null==e||"string"==typeof e};let i=n[e];if(i&&!i(t)){if(r)throw new Error(`[${e}] is not valid`);return!1}return!0}json_parse(e,t,r,o){const l={patterns:n.ArrayParser(i,a),repository(e,t){let r={},n=null;const{registry:a}=t;for(let a in e)n=new i,s._LoadData(t,n,e[a],a,n),t.initialize(n),r[a]=n;return t.repositoryKey=null,r},debug:e=>"boolean"==typeof e?e:!!e,settings:(e,t)=>null==e?null:s._LoadData(t,new u,e)};let c=l[t];return c?c(r,e,o):r}static CreateFrom(e){const t={};let r=null;const a=n.JSonParseData(p,e,{initialize(e){e instanceof i&&e.name&&this.registerName(e.name)},registerName(e){e.length<=0||(t[e]=1)}});return Object.defineProperty(a,"registerNames",{get:()=>t}),a._funcRegistryExpression=function(){if(null!=r)return r;let e={},i=[];for(let r in t){if("global"==r)throw new Error("global is reserved");n.DefineProp(r,void 0,e);let t=r.split(".")[0];-1==i.indexOf(t)&&i.push(t)}return r={namespaces:i,registry:e},r},a}static CreateDefaultOption(){return new u}#t(){const{listener:e}=this;let t=null;return e&&(t=e()),t||new l}#r(e){const t=e||this.settings||p.CreateDefaultOption(),{lineFeed:r,tabStop:i}=t,{debug:a}=this,s=[],l=[];let u=t.depth||0,c=this,h=this.#t(),f=0,k={line:0,start:0,end:0,updateLine(e){this.line=e,this.start=this.end=0},updateRange(e,t){this.start=e,this.end=void 0===t?e:t}};const y={PrevLineFeedConstant:new d,PrevConstant:new m,GlobalConstant:new g};let _={...t,line:"",pos:0,lineCount:0,depth:u,continue:!1,lineJoin:!1,lineFeedFlag:!1,buffer:"",output:[],listener:h,debug:c.debug,lineFeed:r,state:"",range:{start:0,end:0},resetRange(){this.storeRange(0,0)},storeRange(e,t){this.range.start=e,this.range.end=void 0===t?e:t}};function P(e){return!e&&0==e.length}function B(e){return 0==Object.keys(e).length}function C(){let e=Object.keys(_),t={};e.forEach((e=>{let r=typeof _[e];if(/function|object/.test(r))return;let n=Object.getOwnPropertyDescriptor(_,e);(!n||n.get&&n.set)&&(t[e]=_[e])})),l.unshift({...t})}function x(){let e=l.shift();if(e)for(let t in e)_[t]=e[t]}return Object.defineProperty(_,"outputBufferInfo",{get:()=>k}),Object.defineProperty(_,"length",{get:function(){return this.line.length}}),Object.defineProperty(_,"tabStop",{get:function(){return i}}),Object.defineProperty(_,"lineFeed",{get:function(){return r}}),Object.defineProperty(_,"debug",{get:function(){return a}}),Object.defineProperty(_,"markerInfo",{get:function(){return s}}),Object.defineProperty(_,"constants",{get:function(){return y}}),Object.defineProperty(_,"pos",{get:function(){return f},set(e){f=e}}),_.unshiftMarker=e=>{s.unshift(e)},_.shiftMarker=()=>s.shift(),_.empty=P,_.updateBufferValue=function(e,t,r){if(P(t))return e;if(r.replaceWith){let e=r?.parent?.group;"begin/end"==this.state&&(e=r.group),t=c._operationReplaceWith(r,t,e)}return r.transform&&(t=n.StringValueTransform(t,r.transform)),this.listener.treatBuffer?this.listener.treatBuffer.append(e,t,r,this):this.joinBuffer(e,t)},_.joinBuffer=function(e,t){const{lineJoin:r,noSpaceJoin:n}=this;let i=e;if(r){let e=" ";n&&(e=""),i=[i.trimEnd(),t.trimStart()].join(e),this.lineJoin=!1}else i+=t;return i},_.appendToBuffer=function(e,t){this.debug&&o.log("[append to buffer] "+e);let r=this.buffer;r=this.updateBufferValue(r,e,t),this.buffer=r},_.treatBeginCaptures=function(e,t){let r={...e.captures,...e.beginCaptures};if(!B(r))return this.treatCaptures(r,e,t)},_.treatEndCaptures=function(e,t){let r={...e.captures,...e.endCaptures};if(B(r))return;const{debug:i}=this;let a=[];a.markers={};let l=null,u=c.info.captureGroup;c.info.captureGroup=e.group;for(let u in r){a.push(u);let h=r[u];if(!(u in t)){this.pushError(101);continue}let f=t[u];if(h.replaceWith&&p.DoReplaceWith(f,c,h.replaceWith.toString(),e.group),h.nextTrimWhiteSpace,h.transform&&(f=n.StringValueTransform(f,h.transform)),h.name&&(l=new b,l.name=h.name,l.isClosingBlock=h.isClosingBlock,a.markers[u]={marker:l,value:f,parent:e}),h.patterns)if(i&&o.log("---::::treatEndCaptures::::--- contains patterns"),c.settings.useCurrentFormatterInstance){C();let e={patterns:c.patterns,buffer:this.buffer,output:this.output,lineCount:this.lineCount,markerInfo:this.markerInfo.slice(0),line:this.line,pos:this.pos};this.output=[],this.buffer=[],this.lineCount=0,s.length=0,c.info.isSubFormatting++,c.patterns=h.patterns,f=c.format(f),c.info.isSubFormatting--,c.patterns=e.patterns,this.output=e.output,this.buffer=e.buffer,this.lineCount=e.lineCount,this.line=e.line,this.pos=e.pos,e.markerInfo.forEach((e=>s.push(e))),x()}else f=p.CreateFrom({patterns:h.patterns}).format(f);t[u]=f}return c.info.captureGroup=u,a},_.treatCaptures=function(e,t,r){let i=[];i.markers={};let a=null;for(let s in e){i.push(s);let o=e[s];if(!(s in r)){this.pushError(101);continue}let l=r[s];if(o.replaceWith){let e=n.ReplaceRegexGroup(o.replaceWith.toString(),t.group);l=l.replace(l,e)}o.nextTrimWhiteSpace,o.transform&&(l=n.StringValueTransform(l,o.transform)),o.name&&(a=new b,a.name=o.name,i.markers[s]={marker:a,value:l}),r[s]=l}return i},_.moveTo=function(e){this.pos=e},_.store=function(e=!1){const{listener:t}=this;if(t){const r=this,{buffer:n,output:a,depth:s}=r;t.store.apply(null,[{buffer:n,output:a,depth:s,tabStop:i,_ctx:r,startBlock:e}]),this.buffer=""}},_.flush=function(e){const{buffer:t,output:n,listener:i}=this;let a="";return a=i?i.output.apply(null,[e,{buffer:t,output:n,lineFeed:r,_ctx:this}]):this.output.join(r),e&&(this.buffer="",this.output=[]),a},this._storeObjClass(_),_}format(e,t){if(!Array.isArray(e)){if("string"!=typeof e)throw new Error("argument not valid");e=[e]}let r=this.objClass;r||(r=this.#r(t));let i=null,a=this;const{debug:s,lineFeed:l}=r;if(e.forEach((e=>{if(r.debug&&o.log("read:["+r.lineCount+"]::: "+e),r.resetRange(),r.line=e,r.pos=0,r.continue=!1,r.lineCount++,i){if(!i.marker.allowMultiline)throw new Error(`marker '${i.name}' do not allow multi line definition.`);r.continue=!0,r.lineJoin=!1,r.startLine=!0,i=a._handleMarker(i,r,_info)}else r.line=r.line.trimStart();if(e.length<=0)return;r.startLine=!1;let t=r.length,s=r.pos;const{debug:l}=r;for(;s<t;)r.continue=!1,i?(r.continue=!0,r.storeRange(r.pos),i=a._handleMarker(i,r)):(i=n.GetPatternMatcher(this.patterns,r),i?(r.storeRange(s,i.index),i=a._handleMarker(i,r)):(r.appendToBuffer(r.line.substring(r.pos),r.constants.GlobalConstant),r.pos=t)),s=r.pos;r.lineJoin=!0})),s&&console.log(".....end....."),r.markerInfo.length>0){s&&console.log(".....contains marker info .....");let e=null;for(;e=r.markerInfo.shift();)this._restoreBuffer(r,e),e.marker.isBlock&&(r.buffer+=e.content,r.depth=Math.max(--r.depth,0),r.output.push(r.buffer),r.buffer="",_info.appendAndStore(e.marker.blockEnd))}r.store();const u=r.output.join(l);return this.objClass.buffer="",this.objClass.output=[],u}_isBlockAndStart(e,t){return e.isBlock&&!t.continue}_startNewBlock(e,t){if(0!=t.buffer.trim().length)throw new Error("buffer must be trimmed before start a new block");t.buffer=t.buffer.trimEnd(),t.depth++,t.listener.startNewBlock()}static DoReplaceWith(e,t,r,i){let a=i,s=r,o="";return o=a?n.ReplaceRegexGroup(s,a):s.replace(/\\\//g,"/"),e.replace(e,o)}_handleMarker(e,t){if(!e)return;if(!t.continue){let e=t.line.substring(t.range.start,t.range.end);e.length>0&&(t.appendToBuffer(e,t.constants.PrevLineFeedConstant),t.pos+=e.length),t.storeRange(t.pos)}const r=this._handleCallback(e.marker.matchType,t);if(!r||"function"!=typeof r)throw new Error("marker type handler is not a valid callback");return r.apply(this,[e,t])}_operationReplaceWith(e,t,r){let i=this;if(e.replaceWith){let a=e.replaceWith.toString();const s=e.replaceWithCondition;let o=s?.match,l=r;if(!l&&i.info.isSubFormatting>0&&(l=i.info.captureGroup),o){let e=s.operator||"=",r=n.ReplaceRegexGroup(s.check,l);if(/(!)?=/.test(e)){let n=o.test(r);if(e&&("="==e&&!n||"!="==e&&n))return t}else if(/(\<\>)=/.test(e)){let n=o.toString().replace(/\\\//g,"");if((">="==e&&r>=n||"<="==e&&r<=n)&&r>=n)return t}}t=p.DoReplaceWith(t,i,a,l)}return t}_handleCallback(e,t){return{0:t.listener?.handleBeginEndMarker||this._handleBeginEndMarker2,1:t.listener?.handleMatchMarker||this._handleMatchMarker}[e]}_handleMatchMarker(e,t){t.debug&&o.log("--:: Handle match marker :--"),t.state="match";let r=e.group[0];t.pos+=r.length;let n=t.markerInfo.length>0?t.markerInfo[0]:null;return n&&this._updateMarkerChild(n,e),(!e.lineFeed||t.buffer.length>0)&&(t.appendToBuffer(r,e),e.lineFeed&&(t.lineFeedFlag=!0)),e.parent}_handleBeginEndMarker2(e,t){t.state="begin/end";const{debug:r,listener:i,line:a,markerInfo:s,startLine:l}=t,{group:u}=e;r&&o.log("-------------: handle marker 2 :----------------------");let c=null,p=!0,h="",f=null,d=null,g="",m=null;s.length>0&&s[0].marker==e&&(d=s.shift())?(p=d.start,g=this._updateOldMarker(d,e,l,t)):e.start&&(t.treatBeginCaptures(e.marker,e.group),e.start=!1),c=e.endRegex,g=g||e.group[0];let b=e.group.index+e.group.offset;p&&(t.pos=b),h=a.substring(t.pos);let k=!1;return f=h.length>0&&e.patterns&&e.patterns.length>0?n.GetPatternMatcher(e.patterns,t,e):null,m=h.length>0?c.exec(h):null,m&&(m.index+=t.pos),0==h.length?(this._updateMarkerInfoOld(e,d,g,c,t),e):null!=f?null==m||f.group.index<m.index?(this._updateMarkerInfoOld(e,d,g,c,t),t.storeRange(t.pos,f.group.index),this._handleMarker(f,t)):f.group.index==m.index?this._handleSameGroup2(e,f,m,d,g,t,c):this._handleFoundEndPattern(g,h,e,m,t,d):null!=m?this._handleFoundEndPattern(g,h,e,m,t,d):(k=!0,i.append(h),t.pos=t.line.length,k?(this._updateMarkerInfoOld(e,d,g,c,t),e):(i.append(u[0],e),t.moveTo(b),null))}_handleFoundEndPattern(e,t,r,n,i,a){const{debug:s}=i;s&&o.log("--::handleFoundEndPattern::--"),s&&o.log("matcher-end: ",{__name:r.toString(),name:r.name,line:i.line,pos:n.index,depth:i.depth,hasParent:null!=r.parent,isBlock:r.isBlock,value:n[0],regex:r.endRegex});let l=!1;r.isBlock&&(i.depth=Math.max(--i.depth,0),r.isBlock=a.oldBlockStart,l=!0);const u=n.index+n[0].length;let c=i.treatEndCaptures(r,n),p=n[0],h=i.line.substring(i.pos,n.index),f=r?.parent?.isBlock,d=i.markerInfo.length>0?i.markerInfo[0]:null;d&&this._updateMarkerChild(d,r),this._updateParentProps(r);let g=a&&!f&&r?.parent?.isBlock;g?r.parent.isBlock=this._isEmptyRequestBlock({_marker:r,_old:a,childs:a.childs,condition:r.requestParentBlockCondition}):!f&&r?.parent?.isBlock&&(r.parent.isBlock=!1),!c&&h!=p&&h.trim().length>0||g&&r.parent.isBlock?(g&&(d?(a.entryBuffer.length>0&&(d.content=i.updateBufferValue(d.content,a.entryBuffer,d.marker),e=e.replace(new RegExp("^"+a.entryBuffer),"")),d.startBlock=1,d.oldBlockStart=f):(i.appendToBuffer(e,r),i.store()),this._startNewBlock(r.parent,i)),!c&&h!=p&&h.trim().length>0&&(e=i.updateBufferValue(e,h,r))):g&&(r.parent.isBlock=d.oldBlockStart),i.appendToBuffer(e,r),e="";let m=r;if(c&&0 in c.markers){let e=c.markers[0];e.marker&&(m=e.marker)}if(l&&i.store(),p.length>0&&i.appendToBuffer(p,m),i.moveTo(u),a&&a.marker==r){const e=i.buffer;let t=i.flush(!0);t+=e,this._restoreBuffer(i,a),t.length>0&&(i.buffer+=t)}if(null==a&&i.markerInfo.length>0){let t=i.markerInfo[0],n=t.parent;if(n)if(!n?.isBlock&&t.marker.updateParentProps?.isBlock){let n=!0;t.marker.requestParentBlockCondition&&(n=this._isEmptyRequestBlock({childs:t.childs,_marker:t.marker,_old:t,condition:t.marker.requestParentBlockCondition})),n&&(t.marker.parent.isBlock=!0,t.startBlock=0,t.autoStartChildBlock=!0,e=i.buffer,i.buffer="",i.store(),this._startNewBlock(t.marker,i),i.appendToBuffer(e,r),i.store(!0))}else n?.isBlock&&t.autoStartChildBlock&&i.store(!0)}return r.parent}_isEmptyRequestBlock({childs:e,_marker:t,_old:r,condition:n}){if(r){if(0==e.length)return!1;if(n){let r=!0,i=null,a=this._funcRegistryExpression();const s=a.namespaces.join(",");let o=new Function("registry","child","marker",`const {${s}} = registry;  return ${n};`);for(;e.length>0;){i=e.shift();try{r=o.apply({child:i},[a.registry,i,t])}catch(e){return console.error("error : ",e),!0}if(r)return!0}return!1}}return!0}_updateMarkerChild(e,t){e.childs.push({name:t.name,marker:t,range:{start:0,end:0}})}_updateMarkerInfoOld(e,t,r,n,i){t?(t.content=r,i.markerInfo.unshift(t)):this._backupMarkerSwapBuffer(i,e,r,n)}_restoreBuffer(e,t){e.debug&&o.log("restore buffer"),e.buffer=t.state.buffer,e.output=t.state.output}_backupMarkerSwapBuffer(e,t,r,n){e.debug&&o.log("backup and swap buffer.");const i={marker:t,start:!1,endRegex:n,startBlock:t.isBlock?1:0,autoStartChildBlock:!1,oldBlockStart:t.isBlock,childs:[],state:{buffer:e.buffer,output:e.output},entryBuffer:r};var a;a=r,Object.defineProperty(i,"content",{get:()=>a,set(t){t!=a&&(e.debug&&o.log("store content :"+t),a=t)}}),e.unshiftMarker(i),e.buffer="",e.output=[]}_updateOldMarker(e,t,r,n){let i="",a=1==e.startBlock?n.lineFeed:"",s=e.content;const o=n.listener;return r?(t.preserveLineFeed&&(s+=n.lineFeed),(n.output.length>0||e.startBlock)&&(o.store(),s=s.trimEnd(),n.output.unshift(""),i=n.flush(!0),a="")):n.output.length>0||e.startBlock?(n.store(e.startBlock),i=n.flush(!0),a=""):(i=n.buffer,n.flush(!0),n.buffer=""),i&&(s+=a+i),e.startBlock=0,e.content=s,s}_handleSameGroup2(e,t,r,n,i,a,s){return 0==t.group[0].length&&s.test(i)?this._handleFoundEndPattern(i,a.line,e,a,n):(0!=a.markerInfo.length&&a.markerInfo[0]===e||this._updateMarkerInfoOld(e,n,i,s,a),this._handleMarker(t,a))}_updateParentProps(e,t){if(!e.updateParentProps)return;const{isBlock:r,lineFeed:n}=e.updateParentProps;e.parent.isBlock=r||e.parent.isBlock,e.parent.lineFeed=n||e.parent.lineFeed}_getMatchList(){return[]}_renderMatchList(e,t){const{listener:r}=t;e.forEach((e=>{r.append(e.value,e.marker),e.marker.lineFeed&&r.store()}))}}class h extends i{get isSpecial(){return!0}}class f extends h{tokenID="constant";transform=[function(e){return 0==e.trim().length?"":e},"joinSpace"]}class d extends f{name="system.prev.line.feed.constant"}class g extends f{name="system.global.line.constant"}class m extends f{name="system.prev.line.constant"}class b extends h{get matchType(){return 3}}t.Formatters=p,t.Utils=n,t.Patterns=i,t.JSonParser=s},459:(e,t)=>{Object.defineProperty(t,"__esModule",{value:!0});class r{source;data;registry;repositoryKey;throwOnError;get current(){return this.m_current}constructor(){this.m_current=null,this.throwOnError=!0}initialize(e){this.registry&&this.registry.initialize(e)}parse(){return obj=new this.source,this.m_current=this.data,r._LoadData(this,obj,this.data),obj}static _LoadData(e,t,r,n,i){const a=e.throwOnError;let s=t.json_validate,o=t.json_parse;return(t.json_keys?t.json_keys():Object.keys(t)).forEach((l=>{let u=r[l];void 0!==u&&(s&&!s.apply(t,[l,u,a])||(o&&(u=o.apply(t,[e,l,u,n,i])),t[l]=u))})),t}}t.JSonParser=r},61:(e,t)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.PatternMatchInfo=class{start=!0;isBlock;startLine=0;range={start:0,end:0};constructor(){var e,t,r,n,i,a=!1,s=!1;Object.defineProperty(this,"parent",{get:()=>e}),Object.defineProperty(this,"isBlock",{get:()=>a,set(e){a=e}}),Object.defineProperty(this,"lineFeed",{get:()=>s,set(e){s=e}}),Object.defineProperty(this,"marker",{get:()=>t}),Object.defineProperty(this,"endRegex",{get:()=>r}),Object.defineProperty(this,"group",{get:()=>n}),Object.defineProperty(this,"line",{get:()=>i}),this.use=function({marker:s,endRegex:o,group:l,line:u,parent:c}){t=s,a=s.isBlock,r=o,n=l,i=u,e=c,function(e,t){const r=Object.keys(e),n=Object.keys(t);["isBlock","lineFeed"].forEach((e=>{delete n[n.indexOf(e)]})),n.forEach((n=>{if(-1!=r.indexOf(n))return void console.log("property alreay defined ["+n+"]");let i=Object.getOwnPropertyDescriptor(t,n);(!i||i.get||i.writable)&&Object.defineProperty(e,n,{get:()=>t[n]})}))}(this,t)}}get index(){return this.group?.index}get offset(){return this.group?.offset}get name(){return this.marker?.name}get captures(){return this.marker?.captures}get endCaptures(){return this.marker?.endCaptures}get beginCaptures(){return this.marker?.beginCaptures}get replaceWith(){return this.marker?.replaceWith}get replaceWithCondition(){return this.marker?.replaceWithCondition}toString(){return"[PatternMatchInfo: "+this.marker?.toString()+"]"}}},705:(e,t,r)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0});const{JSonParser:n}=r(459),{ReplaceWithCondition:i}=r(123),{Utils:a}=r(57);class s{match;begin;end;name;contentName;comment;tokenID;patterns;lineFeed;isBlock;isClosingBlock=!1;emptyBlockCondition;requestParentBlockCondition;block;allowMultiline;preserveLineFeed;nextTrimWhiteSpace=!1;replaceWith;replaceWithCondition;beginCaptures;endCaptures;captures;updateParentProps;transformToken;transform;constructor(){this.patterns=[],this.isBlock=!1,this.allowMultiline=!0,this.preserveLineFeed=!1;var e=null;Object.defineProperty(this,"parent",{get:()=>e,set(t){if(!(null==t||t instanceof s))throw Error("parent value not valid");e=t}})}json_parse(e,t,r,s,o){const{Patterns:l,RefPatterns:u}=a.Classes,c=a.ArrayParser(l,u),p=e=>a.RegexParse(e,"d"),h=(e,t)=>{let r={};for(let i in e){let a=new l;n._LoadData(t,a,e[i]),r[i]=a,t.initialize(a)}return r},f=this,d={patterns(e,t,r,n){let i=c.apply(f,[e,t,r,n]);return i.forEach((e=>{e.parent=f})),i},begin:p,end:p,match:p,replaceWith:p,replaceWithCondition(e,t){let r=new i;return n._LoadData(t,r,e,o),r},beginCaptures:h,endCaptures:h,captures:h,transform(e,t){if("string"==typeof e){let t=[];return e.split(",").forEach((e=>{e.trim(),e.length>0&&t.push(e)})),t}if(Array.isArray(e))return e}};let g=d[t];return g?g.apply(f,[r,e,s,o]):r}json_validate(e,t,r){const n={patterns:e=>Array.isArray(e),replaceWithCondition:e=>"object"==typeof e};let i=n[e];if(i&&!i(t)){if(r)throw new Error(`[${e}] is not valid`);return!1}return!0}get matchType(){return this.begin?0:this.match?1:-1}check(e){let t=null;if(this.begin)t=this.begin.exec(e);else{if(!this.match)throw new Error("cannot check : "+e);t=this.match.exec(e)}return t}get matchRegex(){return 0==this.matchType?this.begin:this.match}get index(){return this.m_match?.index}get group(){return this.m_match}endRegex(e){if(0==this.matchType){let t=this.end.toString();return a.GetRegexFrom(t,e)}return null}get blockStart(){const e=this.matchType;return this.isBlock&&0==e?this.block?.start||this.begin.toString().trim():""}get blockEnd(){const e=this.matchType;return this.isBlock&&0==e?this.block?.end||this.end.toString().trim():""}toString(){return`Patterns[#${this.name}]`}}t.Patterns=s},370:(e,t,r)=>{Object.defineProperty(t,"__esModule",{value:!0});const{Patterns:n}=r(705);t.RefPatterns=class extends n{constructor(e){if(super(),!(e&&e instanceof n))throw new Error("pattern not a Pattern instance");!function(e,t){Object.keys(e).forEach((r=>{let n=Object.getOwnPropertyDescriptor(e,r);(!n||n.get||n.writable)&&Object.defineProperty(e,r,{get:()=>t[r]})}))}(this,e),Object.defineProperty(this,"pattern",{get:()=>e})}check(e){return this.pattern.check(e)}toString(){return`RefPatterns[#${this.pattern.name}]`}endRegex(e){return this.pattern.endRegex(e)}}},123:(e,t,r)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0});const{Utils:n}=r(57);t.ReplaceWithCondition=class{check;operator="=";match;constructor(){}json_parse(e,t,r,i){return n.JSonParse(this,{match:e=>n.RegexParse(e)},e,t,r,i)}json_validate(e,t,r){let i=e=>"string"==typeof e;return n.JSonValidate(this,{check:i,operator:i,operator:i},e,t,r)}}},57:(e,t,r)=>{Object.defineProperty(t,"__esModule",{value:!0});const{JSonParser:n}=r(459),{PatternMatchInfo:i}=r(61);class a{static FunctionDefineArg(e,t,r){let n=0,i=0,a="";return r&&(a="((w,p,q,n)=>{n=w; while((p.length>1) && (q = p.shift())){ n[q] = n[q] || {}; n = n[q];} n[p[0]] = v})("+r+', "'+e+"\".split('.'), v) || "),e.split(".").forEach((e=>{i?(n&&(i+="{"),i+=e+":",n++):i=e+"=((v)=>{ return "+a+"{"})),t=void 0===t?"undefined":("object"==typeof t?JSON.stringify(t):t)||'"'+e+'"',i+=t+"}".repeat(n)+"})("+t+")",i}static DefineProp(e,t,r){return((t,r,n)=>{let i=null,a=null,s=null,o=null;return r=void 0!==r?r:e,0==t.length?r:(t.forEach((e=>{null==i&&(i=a=(n?n[e]:null)||{},n&&(n[e]=i)),s&&(o=a,"string"==typeof a[e]&&(a[e]={}),a[e]=a[e]||{},a=a[e]),s=e})),o?o[s]=r:n&&(n[t[0]]=r),i)})(e.split("."),t,r)}static JSonParseData(e,t,r){let i=new n;return i.source=e,i.data=t,i.includes={},r&&(i.registry=r),a.LoadData(i,new e,t,null)}static LoadData(e,t,r,i){return n._LoadData(e,t,r,i)}static ArrayParser(e,t){if(!t||void 0===t)throw new Error("missing refkey_class_name");return function(r,i,a,s){let o=[],l=s||this;return r.forEach((r=>{const{include:u}=r,c=r.extends;let p=null,h=null,f=null;if(u)"#"==u[0]&&(h=u.substring(1),a&&a==h&&s?p=new t(l):(f=i.data.repository[h],f&&(p=new e,i.includes[h]=p,n._LoadData(i,p,f,h,s||p),i.initialize(p))));else{if(c)throw new Error("extends not support yet");p=new e,n._LoadData(i,p,r,a,s||p),i.initialize(p)}p&&o.push(p)})),o}}static GetPatternMatcher(e,t,n=null){const{line:a,pos:s,debug:o,depth:l}=t;let u=null,c=0,p=-1,h=a.substring(s);const{RefPatterns:f}=r(370);if(e.forEach((e=>{let t=e.check(h);t&&(-1==p||p>t.index)&&(p=t.index,u=e,c=t)})),u){c.index+=s,o&&console.log("matcher-begin: ",{__name:u.toString(),name:u.name,line:a,pos:c.index,depth:l,hasParent:null!=u.parent,isBlock:u.isBlock,isRef:u instanceof f,value:c[0],regex:u.matchRegex}),c.offset=c[0].length;let e=new i;return e.use({marker:u,endRegex:u.endRegex(c),line:a,group:c,parent:n}),e}return u}static GetRegexFrom(e,t){return e=e.replace(/[^\\]?\$([\d]+)/,((e,r)=>"\\"==e[0]?e:"$"!=e[0]?e[0]+t[r]:t[r])),e=/^\/.+\/$/.test(e)?e.substring(1).slice(0,-1):e,new RegExp(e)}static ReplaceRegexGroup(e,t){let r=a.GetRegexFrom(e,t);return r=r.toString().substring(1).slice(0,-1).replace(/\\\//g,"/"),e.replace(e,r)}static RegexInfo(e){let t=/^\(\?(?<active>[ixm]+)(-(?<disable>[ixm]+))?\)/,r="",n=null;if(n=t.exec(e)){let i="";n.groups&&(i=n.groups.active??"",n.groups.disable&&n.groups.disable.split().forEach((e=>{i=i.replace(e,"")}))),e=e.replace(t,""),r=i}return{s:e,option:r}}static RegexParse(e,t){if("string"==typeof e){let r=a.RegexInfo(e);return t&&(r.option=t),new RegExp(r.s,r.option)}if("object"==typeof e){if(e instanceof RegExp)return e;const{option:t,regex:r}=e;return r instanceof RegExp?(r=a.GetRegexFrom(r.toString(),t),r):new RegExp(r,t)}return e}static StringValueTransform(e,t){const r={joinSpace:e=>e.replace(/\s+/g," "),upperCase:e=>e.toUpperCase(),lowerCase:e=>e.toLowerCase(),trim:e=>e.trim(),rtrim:e=>e.trimStart(),ltrim:e=>e.trimEnd()};return t.forEach((t=>{if(0==e.length)return;let n=null;if(n=/^:(?<symbol>=|^|#)(.)(?<number>\d+)/.exec(t)){let t=parseInt(n.groups.number),r=n.groups.symbol;if(t>e.length){let i=n[2];if("#"==r)e=e.toString().padEnd(t,i);else if("^"==r)e=e.toString().padStart(t,i);else if("="==r){let r=Math.floor((t-e.length)/2);e=(e=e.toString().padEnd(r%2==0?t-r:t-r+1,i)).toString().padStart(t,i)}}return e}e="function"==typeof t?t(e):r[t](e)})),e}static JSonValidate(e,t,r,n,i){let a=t?t[r]:null;if(a&&!a(n)){if(i)throw new Error(`[${r}] is not valid`);return!1}return!0}static JSonParse(e,t,r,n,i,a){let s=t?t[n]:null;return s?s.apply(e,[i,r,a]):i}}t.Utils=a},823:e=>{"use strict";e.exports=JSON.parse('{"settings":{"noSpaceJoin":true},"repository":{"html-space-constant":{"match":"\\\\s+","name":"constant.empty.space.html","replaceWith":" "},"string":{"begin":"(\\"|\')","end":"\\\\$1","name":"string.definition","allowMultiline":false,"tokenID":"string","patterns":[{"match":"\\\\\\\\.","name":"escaped.char"}]},"string-named":{"begin":"(\\"|\')","end":"\\\\$1","name":"string.definition.with.name","allowMultiline":false,"tokenID":"string","patterns":[{"match":"(?i)\\\\bbondje\\\\b","name":"author.name","transform":["upperCase"]},{"match":"\\\\\\\\.","name":"escaped.char"}]},"url":{"match":"(?i)(?<scheme>(?:ftp|http(?:s)|[a-z]+)):(?:\\\\/\\\\/|\\\\/|)(?<path>(?:\\\\/|\\\\.\\\\.(?:\\\\/)?|\\\\.(?:\\\\/)?)[^\\\\/\\\\)\\\\(]+(?:\\\\/|/[^\\\\/\\\\)\\\\()\\\\;]+))(?:;(?<queryo>[^\\\\?\\\\#]+))?(?:\\\\?(?<query>[^\\\\#]+))?(?:(?<anchor>#.+))?","name":"url.text","tokenID":"url","patterns":[{"match":"\\\\\\\\.","name":"escaped.char"}]},"tag-definition":{"begin":"\\\\<(\\\\b[\\\\w]+\\\\b)","end":"(\\\\/|\\\\<\\\\/$1\\\\s*)?\\\\>","name":"tag.definition.html","tokenID":"tagname","isBlock":false,"block":{"start":"<$1","end":"\\\\<\\\\/$1\\\\>"},"endCaptures":{"0":{"comment":"remove not used white space","match":"<\\\\/([\\\\w]+)\\\\s+\\\\>","replaceWith":"\\\\<\\\\/$1\\\\>"}},"patterns":[{"include":"#end-tag"},{"match":"(?=\\\\<\\\\/[\\\\w]+\\\\>)","name":"end.tag.block.html","tokenID":"endtag.block"},{"match":"(?:\\\\>)","name":"start.html.end.block.html","lineFeed":false,"updateParentProps":{"isBlock":true}},{"match":"(\\\\/\\\\>)","name":"start.empty.html.block.html","tokenID":"endtag.block","lineFeed":true,"updateParentProps":{"isBlock":true}},{"include":"#html-attribute"},{"include":"#function-html-attribute"},{"include":"#bracket-html-attribute"},{"include":"#string"},{"include":"#comment"},{"include":"#operator"}]},"empty-tag":{"begin":"\\\\<([\\\\w]+)\\\\s*\\\\/\\\\>","end":"(?:>)","lineFeed":true,"tokenID":"empty.tag","name":"empty.tag.definition.html"},"operator":{"match":"\\\\s*(\\\\+|\\\\*|-|%|=)\\\\s*","name":"tag.operator.html","tokenID":"tag.operator","replaceWith":"$1","nextTrimWhiteSpace":true},"comment":{"begin":"\\\\<\\\\!--","end":"--\\\\>","tokenID":"comment","name":"comment.html","lineFeed":true},"doctype":{"begin":"\\\\<!DOCTYPE","end":"\\\\>","tokenID":"doctype","name":"constant.doctype.html","lineFeed":true,"patterns":[{"include":"#string"},{"include":"#url"}]},"processor-expression":{"begin":"\\\\<\\\\?[\\\\w]+","end":"\\\\?>","tokenID":"processor","name":"constant.processor.html","lineFeed":true,"patterns":[{"include":"#string"},{"include":"#url"}]},"end-tag":{"begin":"\\\\<\\\\/[\\\\w]+(\\\\s+|$)","end":"\\\\>","tokenID":"detect-bad-end.tag","name":"end.tag.definition.html","comment":"detect non well formed end tags","nextTrimWhiteSpace":true,"transformToken":true,"endCaptures":{"0":{"nextTrimWhiteSpace":true}}},"html-attribute":{"match":"(\\\\*)?\\\\b[\\\\w]+\\\\b","name":"tag.attribute.html"},"bracket-html-attribute":{"match":"\\\\[\\\\s*\\\\b[\\\\w]+\\\\b\\\\*\\\\]","name":"tag.bracket.attribute.html"},"function-html-attribute":{"match":"\\\\[\\\\s*\\\\b[\\\\w]+\\\\b\\\\*\\\\]","name":"tag.function.attribute.html"},"global-html-tag":{"begin":"(\\\\<)\\\\b([\\\\w][\\\\w:\\\\-]*)\\\\b","end":"(\\\\s*\\\\/\\\\>|\\\\<\\\\/$2\\\\s*>)","name":"global.html.tag.html","beginCaptures":{"1":{"name":"tab.symbol.start.html"},"2":{"name":"tabname.html"}},"endCaptures":{"0":{"name":"html.end.tag_definition","transform":["trim"],"patterns":[{"match":"^\\\\s*\\\\/\\\\>","name":"close.tag","replaceWith":"></$2>","replaceWithCondition":{"check":"$2","operator":"!=","match":"br|hr|img|input|source|link|meta|base|col|embed|param|track|wbr"},"updateParentProps":{"isBlock":false}},{"match":"\\\\<\\\\/\\\\b[\\\\w][\\\\w:\\\\-]*\\\\b\\\\>","name":"end.tag","isClosingBlock":true}]}},"patterns":[{"begin":"([\\\\w\\\\-]+)\\\\s*","end":"(?=([=]|>|\\\\s|$))","name":"attribute.html","tokenID":"attribute","comment":"detect attribute definition-primary","beginCaptures":{"0":{"transform":"trim"}}},{"begin":"\\\\s*=\\\\s*","end":"(?=[\\\\w]|\\\\/|\\\\>)","name":"operator.attribute.affectation.html","beginCaptures":{"0":{"transform":"trim"}},"patterns":[{"include":"#string"}]},{"begin":"\\\\>","end":"(?=\\\\<(\\\\/)?)","name":"inner.html","comment":"Detect inner content. start block definition if contains global.html.tag.html","requestParentBlockCondition":"child.name == global.html.tag.html","updateParentProps":{"isBlock":true},"beginCaptures":{"0":{"name":"start.inner.html"}},"patterns":[{"include":"#global-html-tag"},{"include":"#html-space-constant"},{"include":"#string"},{"include":"#url"}]}]}},"patterns":[{"include":"#global-html-tag"},{"include":"#string-named"},{"include":"#string"},{"include":"#url"},{"include":"#comment"},{"include":"#doctype"},{"include":"#end-tag"},{"include":"#processor-expression"}],"scopeName":"source.text.html","repository__":{"main":{"name":"start.main","match":"\\\\b\\\\w+\\\\b","patterns":[{"include":"#main"}]}},"patterns__":[{"include":"#main"}]}')},197:e=>{"use strict";e.exports=JSON.parse('{"tests":[{"comment":"multine test","s":["<div><span>open</span></div>"],"e":["<div></div>"]}]}')}},t={};function r(n){var i=t[n];if(void 0!==i)return i.exports;var a=t[n]={exports:{}};return e[n](a,a.exports,r),a.exports}(()=>{"use strict";const{Formatters:e,Utils:t}=r(509),n=r(823),i=e.CreateFrom(n);i.debug=!0,function(e,t){let r=0;e.forEach((e=>{let n=t.format(e.s),i=e.e;if(Array.isArray(e.e)&&(i=i.join("\n")),n!=i)throw function(e,t){let r=0,n="string"==typeof t?t.split("\n"):t;console.log(" ++++ = expected"),console.log(" ---- = return"),console.log("\n-result"),console.log(e),console.log("\n-compare"),e.split("\n").forEach((e=>{let t=r in n?n[r]:"";e==t?console.log(e):(console.log("++++ |"+(t+"").length.toString().padStart(10," ")+" |"+t),console.log("---- |"+(e+"").length.toString().padStart(10," ")+" |"+e)),r++})),r<n.length&&n.slice(r).forEach((e=>{console.log("++++ "+e)}))}(n,e.e),new Error("failed : "+r);r++}))}(r(197).tests,i)})()})();
//# sourceMappingURL=bformatter.js.map