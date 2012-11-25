var glob= require("glob"),
  Q= require("q"),
  fs= require("fs"),
  yaml= require("yaml"),
  util= require("util")

var glob= Q.nbind(glob),
  readFile= Q.nbind(fs.readFile)

var vars= {},
  result= {}

//console.log("ARGS,CWD",process.cwd(),process.argv)

for(var i in process.argv){
	var arg= process.argv[i],
	  frags= arg.split("=")
	if(frags.length == 1)
		continue
	vars[frags[0]] = frags.splice(1).join("=")
}

if(!vars.yaml && !vars.json){
	console.log('{"changed":false}')
	return
}

function addAll(arr){
	return Q.all(arr).then(function(){
		var ret= []
		for(var i in arguments){
			ret= ret.concat.apply(ret,arguments[i])
		}
		return Q.all(ret)
	})
}

var promises= []

if(vars.yaml){
	var yamls= vars.yaml.split(",")
	for(var i in yamls){
		var globPromise= glob(yamls[i])
		.then(function(yamlFilenames){
			var evalled= []
			for(var j in yamlFilenames){
				var filename= yamlFilenames[j],
				  evalPromise= readFile(filename,"utf-8")
				.then(function(yamlContents){
					return yaml.eval(yamlContents)
				})
				evalled.push(evalPromise)
			}
			return evalled
		})
		promises.push(globPromise)
	}
}

if(vars.json){
	var jsons= vars.json.split(",")
	for(var i in jsons){
		var globPromise= glob(jsons[i])
		.then(function(jsonFilenames){
			var evalled= []
			for(var j in jsonFilenames){
				var filename= jsonFilenames[j],
				  evalPromise= readFile(filename,"utf-8")
				.then(function(jsonContents){
					return JSON.parse(jsonContents)
				})
				evalled.push(evalPromise)
			}
			return evalled
		})
		promises.push(globPromise)
	}
}

addAll(promises).then(function(objs){
	var arr= false,
	  obj= false
	for(var i in objs){
		if(objs[i] instanceof Array)
			arr= true
		else if (objs[i] instanceof Object)
			obj= true
	}
	if(arr && obj)
		throw "Invalid return"
	if((!arr) && (!obj)){
		console.log('{"changed":false}')
		return
	}
	var ret
	if(obj){
		ret= {}
		for(var i in objs){
			var e= objs[i]
			for(var j in e){
				ret[j]= e[j]
			}
		}
	}else{
		ret= []
		for(var i in objs){
			ret= ret.concat(objs[i])
		}
	}
	if(vars.prefix){
		wrap= {}
		wrap[vars.prefix]= ret
		ret= wrap
	}
	ret= {"changed":true, "ansible_facts":ret}
	console.log(util.inspect(ret,false,999))
}).fail(function(err){
	throw err
}).done()
