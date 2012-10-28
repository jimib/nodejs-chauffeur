module.exports = function(app, cb){
	var routes = {};
	
	//need to handle paths without a trailing slash - as chauffeur adds them by default
	app.all("*", function(req, res, next){
		var indexOfLastSlash = req.path.lastIndexOf("/");
		//check if the last character is a slash
		//is there an extension/path between the last slash and the end
		//it's not an asset - e.g. no extension such as favicon.ico
		if(indexOfLastSlash != req.path.length - 1 && req.path.indexOf(".", indexOfLastSlash) == -1){
			res.redirect(req.path + "/");	
		}else{
			next();
		}
	});
	
	//create the mapper passing the routes object that we want built up
	var mapper = new Mapper(app, "", routes);
	
	//callback - get it build up the routes
	cb(mapper);
	
	//return the routes that have been generated
	return routes;
}

function Mapper(app, rootPath,routes){
	
	function createRoute(method, path, controller, id){
		path = createFullPath(rootPath, path);
		//implement the route
		app[method](path, controller);
	
		if(id){//make note of the route we just formed
			checkRoute(id);
			routes[id] = path;
		}
	}
	
	function checkRoute(id){
		if(routes[id] != undefined)console.log("warning: route with id '"+id+"' already exists");
	}
	
	function createNameSpace(id, path){
		checkRoute(id);
		path = path || id;
		routes[id] = {};
		return new Mapper(app, createFullPath(rootPath, path), routes[id]);
	}

	return {
		get : function(path, controller, id){createRoute("get", path, controller, id);},
		post : function(path, controller, id){createRoute("post", path, controller, id);},
		put : function(path, controller, id){createRoute("put", path, controller, id);},
		delete : function(path, controller, id){createRoute("delete", path, controller, id);},
		all : function(path, controller, id){createRoute("all", path, controller, id);},
		namespace : function(path, id, cb){
			if(typeof id == "function"){
				cb = id;
				id = path;
			}
			console.log("namespace: ", path, id);
			//create a new mapper
			var mapper = createNameSpace(id, path);
			cb = typeof cb == 'function' ? cb : function(){};
			cb(mapper);
		},
		resource : function(id, owner, cb){
			//build up the methods, based on the available methods on the owner, i.e. not all methods to create a full resource is required
			var mapper = createNameSpace(id);
			//list methods
			if(owner.index)mapper.get("/", owner.index, 'index');
			//constructor methods
			if(owner.newGET)mapper.get("/new", owner.newGET, 'newGET');
			if(owner.newPOST)mapper.post("/new", owner.newPOST, 'newPOST');
			//methods related to a resource
			var resourceId = "/:" + id + "/";
			if(owner.show)mapper.get(resourceId, owner.show, 'show');
			if(owner.edit)mapper.get(resourceId + "edit", owner.edit, 'edit');
			if(owner.update)mapper.put(resourceId, owner.update, 'update');
			if(owner.destroy)mapper.delete(resourceId, owner.destroy, 'destroy');
			//now callback passing the mapper we just created - option for them to build it up
			cb = typeof cb == 'function' ? cb : function(){};
			cb(mapper);
		}
	}
}

//general helper methods
function createFullPath(pathA, pathB){
	//eliminate trailing '/' from pathA
	//eliminate leading '/' from pathA
	pathA = stripEncasingSlash(pathA);
	pathB = stripEncasingSlash(pathB);
	
	var path = "/";
	if(pathA && pathA.length > 0){
		path += pathA + "/";
	}
	
	if(pathB && pathB.length > 0){	
	 	path += pathB + "/";
	}
	
	return path;
}

function stripEncasingSlash(path){
	return stripTrailingSlash(stripLeadingSlash(path));
}

function stripTrailingSlash(path){
	var p = path ? path.toString() : "";
	if(p.length > 0 && p.charAt(p.length - 1) == '\/'){
		//drop it
		p = p.substr(0, p.length - 1);
	}
	return p;
}

function stripLeadingSlash(path){
	var p = path ? path.toString() : "";
	if(p.length > 0 && p.charAt(0) == '/'){
		//drop it
		p = p.substr(1);
	}
	return p;
}