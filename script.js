(function(){
	var hasFrame = window.parent!=window,
		scripts = document.getElementsByTagName('script'),
		current = scripts[scripts.length-1],
		head = document.getElementsByTagName("head")[0],
		dest = location.href.replace(/scmplayer\=true/g, 'scmplayer=false'),
		destHost = dest.substr(0,dest.indexOf('/',10)),
		scm = current.getAttribute('src').replace(/script\.js/g,'scm.html')+'#'+dest,
		scmHost = scm.substr(0,scm.indexOf('/',10)),
		isOutside = !hasFrame || location.href.indexOf("scmplayer=true")>0,
		frameWindow = function(){
			return window.top.document.getElementById('scmframe').contentWindow;
		},

		addEvent = function(elm, evType, fn) {
			if(elm.addEventListener) 
				elm.addEventListener(evType, fn);
			else if (elm.attachEvent) 
				elm.attachEvent('on' + evType, fn);
			else
				elm['on' + evType] = fn;
		},
		isIE = (function(){
			var undef,v = 3,div = document.createElement('div'),
			all = div.getElementsByTagName('i');
			while (
				div.innerHTML = '<!--[if gt IE ' + (++v) + ']><i></i><![endif]-->',
				all[0] );
			return v > 4 ? v : undef;
		})(),
		isMobile = navigator.userAgent.match(/iPad|iPhone|Android|Blackberry/i),

		init = function(){
			if(!document.body){ 
				setTimeout(init,10); 
				return;
			}
			if(isOutside) outside(); else inside();
		},

		outside = function(){
			var css = 'html,body{overflow:hidden;} body{margin:0;padding:0;border:0;} img,a,embed,object,div,address,table,iframe,p,span,form,header,section,footer{ display:none;border:0;margin:0;padding:0; } #scmframe{display:block; background-color:transparent; position:fixed; top:0px; left:0px; width:100%; height:100%; z-index:167;} ';
			var style = document.createElement('style');
			style.type = 'text/css';
			style.id = 'scmcss';

			if(style.styleSheet) style.styleSheet.cssText = css;
			else style.appendChild(document.createTextNode(css));

			head.appendChild(style);
			/*
			while(head.firstChild.id!="scmcss")
				head.removeChild(head.firstChild);
			*/
			
			var scmframe = document.createElement('iframe');
			scmframe.frameBorder = 0;
			scmframe.id = "scmframe";
			scmframe.allowTransparency = true;
			scmframe.src = scm;
			
			document.body.insertBefore(scmframe,document.body.firstChild);

			addEvent(window,'load',function() {
				while(document.body.lastChild!=scmframe)
					document.body.removeChild(document.body.lastChild);
			});

			//fix frame height in IE
			addEvent(window,'resize',function(){
				scmframe.style.height = (function(){
					if( typeof( window.innerHeight ) == 'number' )
						return window.innerHeight; 
					else if( document.documentElement && document.documentElement.clientHeight ) 
						return document.documentElement.clientHeight; 
					else if( document.body && document.body.clientHeight ) 
						return document.body.clientHeight; 
				})();
			});
			var getPath = function(){
					return location.href.replace(/#.*/,'');
				},
				path = getPath(),
				hash = location.hash;
			setInterval(function(){
				if(getPath()!=path){
					path = getPath();
					window.scminside.location.replace(path);
				}
				if(location.hash != hash){
					hash = location.hash;
					window.scminside.location.hash = hash;
				}
			},50);
		},
		inside = function(){
			//fix links
			addEvent(document.body,'click',function(e){
				var tar = e.target;
				while(!tar.tagName.match(/^(a|area)$/i) && tar!=document.body) 
					tar = tar.parentNode;
				if(tar.tagName.match(/^(a|area)$/i) && 
					!tar.getAttribute('imageanchor')){ //ignore blogger lightbox
					if(tar.href.indexOf('https://')==0 || 
					(tar.href.indexOf(location.host)==-1 && tar.href.indexOf("http://")==0 ))	{
						//external links
						window.open(tar.href,'_blank');
						window.focus();
						e.preventDefault();
					}else if(tar.href.indexOf("http://")==0 && history.pushState){
						//internal link with pushState, change address bar href
						var url = tar.href.replace(destHost,'');
						window.top.scminside = window;
						window.top.history.pushState(null,null,url);
						e.preventDefault();
					}
				}
			});
			
			var config = current.getAttribute('data-config');
			//send config
			if(config)
				frameWindow().postMessage('SCM.config('+config+')',scmHost);
		};

	var hash = location.hash;
	if(isOutside && hash.indexOf('/')>-1){
		location.hash = '';
		location.href = destHost + hash.substr(1);
	}

	if(window.SCM && window.SCMMusicPlayer) return;

	//SCM interface
	window.SCM = (function(keys){
		var keys = keys.split(','),
			obj = {},
			post = function(key){
				return function(arg){
					var argStr = '';
					if(typeof(arg)!='undefined')
						argStr = (key.match(/(play|queue)/) ? 'new Song(':'(') +
							JSON.stringify(arg)+')';
					frameWindow().postMessage('SCM.'+key+'('+argStr+')',scmHost);
				}
			};
		for(var i=0;i<keys.length;i++){
			var key = keys[i];
			obj[key] = post(key);
		}
		return obj;
	})(
		'queue,play,pause,next,previous,volume,skin,placement,'+
		'loadPlaylist,repeatMode,isShuffle,showPlaylist,'+
		'togglePlaylist,toggleShuffle,changeRepeatMode'
	);
	SCM.init = function(config){
		frameWindow().postMessage('SCM.config('+config+')',scmHost);
	};
	window.SCMMusicPlayer = SCM;

	init();

})();
