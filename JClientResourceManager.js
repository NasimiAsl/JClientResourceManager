/**************************************************** 
version            : 0.0.0.1                           
last change date   : 8/21/2013                             
auther             : R.Nasimi Asl   
browsers           : independent
rquirement         : jquery
*****************************************************/

/* documentation

 why:
    problem :Irregular distribution of data on the user side.
    Solution: Create a unique method to get data from the server or client side.
 what:   

  two mode is Availible for Set Data

  runtime :request and Get Data from Server side with ajax Request or definition by user
  offline :return availible client Side Data
   
  ****** important :  You do not need to change their data structure for this module.
   
  you can have Multi Level data in one resource Struct
  resources.add().child().child()...; 
  sample :
  1 . year: [2000..3000] -> month:  [{name:'Jan',value:1},..,{name:'Dec',value:12}] -> day: [1,..,31]   

  sample
  1. initialize and Configuration :
    1 - 1. resources.add('[control_uniqeKey]', [1,2,3,4,5] );
    1 - 2. resources.addRuntime('[control_uniqeKey]', { catchEnable: true, ajaxOption:{ url:''}});
    1 - 3. resources.addRuntime('[control_uniqeKey]', { catchEnable: true, ajaxOption:{ url:''}} , function(option){ ** xhr or ajax request ** });
     
  2. fetchand Used Data
    resources.fetch('[control_uniqeKey]' , function(data){ success} );  


    refrence:

*/

var resourceStruct = {
    mode: 'runtime',
    data: null,
    parent: null,
    runtime: {
        catchEnable: false,
        ajaxOption: { url: '', type: 'post' }
    },
    helper: function (ajaxOption) {
        $.ajax(ajaxOption);
    }
};

function setResourceStruct(obj, data, runtime, helper) {
    if (data != null && data != undefined) {
        obj = resourceStruct;

        obj.mode = 'offLine';
        obj.data = data;
    }
    else if (runtime != null && runtime != undefined) {
        obj = resourceStruct;

        obj.mode = 'runtime';
        obj.data = null;
        obj.runtime = runtime;
        if (helper != null && helper != undefined)
            obj.helper = helper;
    }
    return obj;
}

var resources = {
    maxChildLevel: 10,
    currentKey: 'default',
    items: new Array(),
    add: function (key, data, runtime, helper) {
        resources.items[key] = setResourceStruct(resources.items[key], data, runtime, helper);
        resources.currentKey = key;
        return resources;
    },
    addRuntime: function (key, runtime, helper) {
        resources.items[key] = setResourceStruct(resources.items[key], null, runtime, helper);
        resources.currentKey = key;
        return resources;
    },
    child: function (data, runtime, helper) {
        var item = resources.items[resources.currentKey];

        for (var i = 0; i < resources.maxChildLevel; i++) {
            if (item != null && item.child != null && item.child != undefined)
                item = item.child;
        }

        item.child = {};
        item.child = setResourceStruct(item.child, data, runtime, helper);
        item.child.parent = item;

        resources.items[resources.currentKey] = item;
        return resources;
    },
    remove: function (key) {
        resources.items[resources.currentKey] = null;
    },
    removeChild: function (key, childLevel) {
        var item = resources.items[key];

        if (childLevel == null || childLevel == undefined || childLevel == 0)
            return item;

        for (var i = 0; i < childLevel; i++) {
            if (item == null || item.child == null || item.child == undefined)
                return null;
            item = item.child;
        }

        item.child = null;

    },
    getStruct: function (key, childLevel) {
        var item = resources.items[key];

        if (childLevel == null || childLevel == undefined || childLevel == 0)
            return item;

        for (var i = 0; i < childLevel; i++) {
            if (item == null || item.child == null || item.child == undefined)
                return null;

            item = item.child;
        }
        return item;
    },
    fetchData: function (struct, params, success, filter, error) {
        if (struct.mode == 'runtime') {
            if (struct.runtime.catchEnable && struct.data != null)
            { success(struct.data); }
            else
            {
                struct.runtime.ajaxOption.success = function (data) {
                    struct.data = data;
                    if (filter != null && filter != undefined)
                        data = filter(data, params);
                    success(data);
                };
                struct.runtime.ajaxOption.error = error;
                if (params != null && params != undefined)
                    struct.runtime.ajaxOption.data = params;
                struct.helper(struct.runtime.ajaxOption);
            }
        }
        else {
            if (filter != null && filter != undefined)
                data = filter(data, params);

            success(struct.data);
        }
    },
    fetch: function (key, params, success, filter, error) {
        resources.fetchData(resources.getStruct(key), params, success, filter, error);
    },
    fetchChild: function (key, level, params, success, filter, error) {
        resources.fetchData(resources.getStruct(key, level), params, success, error);
    }
};
