/* jshint browser: true, -W030 */

!function (window, document) {
    //create CSS
    var head = document.head || document.getElementsByTagName('head')[0];
    var style = document.createElement('style');
    style.type = 'text/css';
    var css = '{{csscode}}';
    
    //insert CSS into the stylesheet and head
    (style.styleSheet) ? style.styleSheet.cssText = css : style.appendChild(document.createTextNode(css));
    //insert stylesheet into head
    head.appendChild(style);

    //generate DOM
    var toastDOM = document.createElement('div');
    toastDOM.className = 't-wrap';
    
    // https://gist.github.com/catdad/9399313
    var ready = function(){
		//insert toast DOM into body -- when ready
        document.body.appendChild(toastDOM);
	};
	var readyCheck = function(){ (document.readyState === 'complete') && ready(); };
	//check for when the document is ready
	if (document.addEventListener) document.addEventListener('readystatechange', readyCheck, false);
	else document.attachEvent('onreadystatechange', readyCheck);

    // check if animations are supported
    // we can reuse a div we already created earlier
    var animations = (function(style){
        return 'animation' in style || '-webkit-animation' in style;
    })(toastDOM.style /* document.createElement('div').style */);
    
    // helper -- test if Object is a node
    function isNode(o){
        return (
            !o ? false :
            typeof Node === "object" ? 
            o instanceof Node : 
            o && typeof o === "object" && typeof o.nodeType === "number" && typeof o.nodeName === "string"
        );
    }
    
    // helper -- test if a node is in the DOM
    function isInPage(node) {
        return (node === document.body) ? false : document.body.contains(node);
    }
    
    // helper - very simple forEach
    function arrForEach(arr, fn){
        for (var i = 0, l = arr.length; i < l; i++) {
            fn(arr[i], i, arr);
        }
    }
    
    // helper - animate DOM element exit
    // remove immediately if animations are not available
    function remove(node) {
        function removeDom(){
            // check if the node is still in the DOM
            isInPage(node) && node.parentElement.removeChild(node);
        }
            
        if (animations) {
            node.addEventListener('webkitAnimationEnd', removeDom, false);
            node.addEventListener('animationend', removeDom, false);
            
            // add animated class
            node.className += ' t-exit';
        } else {
            removeDom(node);  
        }
    }
    
    function toastOptions(args) {
        args = [].slice.call(args);
        var opts;
        
        // find the fist Object and assign it to opts
        arrForEach(args, function(el, i){
            if (!opts && typeof el === 'object') {
                opts = el;   
            }
        });
        
        opts = opts || {};
        opts.msg = opts.msg || opts.message;
        opts.group = !!opts.action ? false : opts.group !== undefined? !!opts.group : !!toastr.group;
        
        // overwrite message parameter with 
        if (typeof args[0] === 'string') {
            opts.msg = args[0];   
        }
        
        if (typeof args[1] === 'number') {
            opts.timeout = args[1];   
        }
        
        return opts;
    }
    
    function getActionDOM(action, parent) {
        // if there are multiple actions, recursively add all of them
        if (action instanceof Array) {
            parent = parent || document.createElement('span');
            arrForEach(action, function(el){
                parent.appendChild( getActionDOM(el, parent) );
            });
            return parent;
        // if there is already dom, use it
        } else if (action.dom && isNode(action.dom)) {
            return action.dom;
        // create a single action item
        } else if (action.name && action.onclick) {
            var span = document.createElement('span'),
                text = document.createTextNode(action.name);
            
            span.onclick = action.onclick;
            span.appendChild(text);
            span.className = 't-action';
            return span;
        // return an empty text node if the action object is unknown
        } else { return document.createTextNode(''); }
    }
    
    // toast generator function
    function toaster(type) {
        //an object to track multiple messages
        var tracker = {};
        
        //keep track of toast DOMs
        var Instance = function(msg){
            var that = this;
            
            that.count = 0;
            that.dom = document.createElement('div');
            that.textNode = document.createTextNode('');
            that.autoRemove = undefined;
            that.remove = function(){
                clearTimeout(that.autoRemove);
                delete tracker[msg];
                
                remove(that.dom);
            };
            
            //add text node to div
            that.dom.appendChild(that.textNode);
            
            //add remove function directly to dom element
            that.dom.removeToast = that.remove;
            
            //add classname
            that.dom.className = type + ' t-toast';
            
            //automatically insert into the DOM
            toastDOM.appendChild(that.dom);
            
            //create the instance tracker
            !!toastr.group && (tracker[msg] = that);
        };
        
        //generate a toast function
        return function toast(/* msg, timeout, opts */) {
            //create toast element
            var opts = toastOptions(arguments),
                msg = opts.msg || '',
                dismiss = opts.dismissible,
                onclick = (typeof opts.onclick === 'function') ? opts.onclick : false,
                timeout = (dismiss === false) ? -1 : opts.timeout,
                prev = (opts.group && tracker[msg]) ? tracker[msg] : new Instance(msg),
                div = prev.dom,
                text = (prev && ++prev.count > 1) ? msg + ' (x' + prev.count + ')' : msg;
            
            //set the textNode value
            prev.textNode.nodeValue = text;
            
            //add the action if available
            (opts.action && typeof opts.action === 'object') && div.appendChild( getActionDOM(opts.action) );
            
            //add remove options (unless indefinite requested)
			(timeout !== -1) && (clearTimeout(prev.autoRemove), prev.autoRemove = setTimeout(function () { 
                prev.remove();
            }, (+timeout || +toastr.timeout || 5000)));
            
            div.className += (dismiss !== false || opts.onclick) ? ' t-click' : ''; 
            
            //create function to remove on click
            div.onclick = function () { 
                opts.onclick && opts.onclick({ message: msg, count: prev.count });
                (dismiss !== false) && prev.remove();
            };
			
            //return a remove reference
			return prev.remove;
        };
    }
	
	function clearAll(){
		arrForEach(toastDOM.children, function(el){
            (el.removeToast) ? 
                el.removeToast() : 
                remove(el);
        });
	}

    var toastr = window.toastr = {
        timeout: 4000,
        group: true,
		clear: clearAll,
        log: toaster('t-gray'),
        logw: toaster('t-white'),
        error: toaster('t-red'),
        info: toaster('t-blue'),
        success: toaster('t-green'),
        warning: toaster('t-orange')
    };
}(window, document);
