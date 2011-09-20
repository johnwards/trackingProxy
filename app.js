
/**
 * Module dependencies.
 */

var express = require('express');

var app = module.exports = express.createServer();

var request = require('request');

var transformContent = require('./lib/transform_content');
// Configuration

app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true })); 
});

app.configure('production', function(){
  app.use(express.errorHandler()); 
});

// Routes

/* 
	Just use the static routing for now

app.get('/', function(req, res){
  res.render('index', {
    title: 'Express'
  });
});
*/

app.get('/_', function(req,res){
	 res.json({"urls":["www.example.com/page1.htm","www.example.com/page2.htm","www.example.com/pagex.php"]});
});


// todo (?) use express to deal with this
function proxyError(res, message){
	res.send("Proxy error " + (message || ''),500);
}

var http = require('http');

var TRANSFORM_CONTENT = {
  "text/html": 1,
  "text/css": 1
}

app.get(/\/([^\/]+)(\/.*)/, function(req,res){
	
	var target_host = req.params[0],
		target_path = req.params[1];
    var query_string = null;
    for(var key in req.query) {
        query_string += "&"+encodeURIComponent(key)+"="+encodeURIComponent(req.query[key]);
    }
    
	console.log("Visit: http://" + target_host + target_path);

    var the_url = target_host + target_path;
    if(query_string) {
        the_url += "?"+query_string;
    }
    
    try {

        
        var subreq  = request({uri:"http://"+the_url});
        
        var content = '';
        
        subreq.on('data', function(chunk){
            for (var i in TRANSFORM_CONTENT)
            {
                if(subreq.response.headers["content-type"] == undefined || subreq.response.headers["content-type"].indexOf(i) == -1) {
			        res.write(chunk);
                    break;
                } else {
                    content += chunk;
                    break;
                }
            }
        }).on('end', function(chunk){
            for (var i in TRANSFORM_CONTENT)
            {
                if(subreq.response.headers["content-type"] != undefined && subreq.response.headers["content-type"].indexOf(i) == 0) {
                    content = transformContent.transform_content(target_host,"bar", content);
                    content = transformContent.add_address_bar(content, the_url);
                    content = transformContent.hide_iframes(content);
                    res.write(content);
                    break;
                }
            }
            
			res.end();
		});

    } catch(e) {
        res.end();
    }

})

process.on('uncaughtException', function(){
        
});

String.prototype.supplant = function (o) {
    return this.replace(/{([^{}]*)}/g,
        function (a, b) {
            var r = o[b];
            return typeof r === 'string' || typeof r === 'number' ? r : a;
        }
    );
};




var port = process.env.PORT || 3000;
app.listen(port);
console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
