module.exports = function(app, cb){
	var routes = {};
	
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
	
	function createNameSpace(id){
		checkRoute(id);
		routes[id] = {};
		return new Mapper(app, createFullPath(rootPath, id), routes[id]);
	}

	return {
		get : function(path, controller, id){createRoute("get", path, controller, id);},
		post : function(path, controller, id){createRoute("post", path, controller, id);},
		put : function(path, controller, id){createRoute("put", path, controller, id);},
		delete : function(path, controller, id){createRoute("delete", path, controller, id);},
		all : function(path, controller, id){createRoute("all", path, controller, id);},
		namespace : function(id, cb){
			//create a new mapper
			var mapper = createNameSpace(id);
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
	return stripTrailingSlash(pathA) + "/" + stripLeadingSlash(pathB);
}

function stripTrailingSlash(path){
	var p = path ? path.toString() : "";
	if(p.length > 0 && p.charAt(p.length - 1) == '/'){
		//drop it
		p = p.substr(0, p.length - 2);
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