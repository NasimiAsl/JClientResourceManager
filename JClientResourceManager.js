/**************************************************** 
version            : 0.0.0.12                           
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
  offline :return availible Data from client Side 
   
  ****** important :  You do not need to change their data structure for this module.
 
  call Structure :

  resources
     .add([params])  * Mandatory
     .child([params]) ...  * Optional
     .getList([params with LiveEvent 1]) ... * Optional
     .getItem([params with LiveEvent 1]) ... * Optional

 *.getList(
         selector,      // str               :  event control Selector 
         liveEvent,     // str               :  live event callback -  * important html event names
         callback,      // fun(data,params)  :  callback for any item
         filter,        // fun(data,params)  :  callback befor success
         error,         // fun(data,params)  :  callback when server has error in response
         finish,        // fun(data,params)  :  finish after success or error
         level,         // int               :  deep watcher in multi level items
         params);       // json              :  Helper varilable to send params to server 
                                                + params.event append after happend live event
         

 *.getItem(
         selector,      // str               :  event control Selector 
         liveEvent,     // str               :  live event callback -  * important html event names
         callback,      // fun(data,params)  :  callback for result
         filter,        // fun(data,params)  :  callback befor success
         error,         // fun(data,params)  :  callback when server has error in response
         finish,        // fun(data,params)  :  finish after success or error
         level,         // int               :  deep watcher in multi level items
         params );      // json              :  Helper varilable to send params to server 
                                                + params.event append after happend live event
        



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
        obj = {
            parent: resourceStruct.parent,
            runtime: resourceStruct.runtime,
            helper: resourceStruct.helper
        }

        obj.mode = 'offLine';
        obj.data = data;
    }
    else if (runtime != null && runtime != undefined) {
        obj = {
            parent: resourceStruct.parent,
            helper: resourceStruct.helper
        }
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
    fetchData: function (struct, params, success, filter, error, finish) {
        if (struct.mode == 'runtime') {
            if (struct.runtime.catchEnable && struct.data != null) {
                if (filter != null && filter != undefined)
                    data = filter(struct.data, params);
                success(struct.data);
                if (finish != null && finish != undefined)
                    finish(struct.data, params);
            }
            else {
                struct.runtime.ajaxOption.success = function (data) {
                    struct.data = data;
                    if (filter != null && filter != undefined)
                        data = filter(data, params);
                    success(data);
                    if (finish != null && finish != undefined)
                        finish(data, params);
                };
                struct.runtime.ajaxOption.error = function (data) {

                    error(data);
                    if (finish != null && finish != undefined)
                        finish(data, params);
                };
                if (params != null && params != undefined)
                    struct.runtime.ajaxOption.data = params;
                struct.helper(struct.runtime.ajaxOption);
            }
        }
        else {
            if (filter != null && filter != undefined)
                data = filter(struct.data, params);

            success(struct.data);

            if (finish != null && finish != undefined)
                finish(struct.data, params);
        }
    },
    fetch: function (key, params, success, filter, error, finish) {
        resources.fetchData(resources.getStruct(key), params, success, filter, error, finish);
    },
    fetchChild: function (key, level, params, success, filter, error, finish) {
        resources.fetchData(resources.getStruct(key, level), params, success, filter, error, finish);
    },
    getItem: function (selector , liveEvent, callback, filter, error, finish, level, params) {
        $(selector).attr('res_key', resources.currentKey);
        $(selector).live(liveEvent, function (eventInstance) {
            var currentControl = this;
             resources.fetchData(resources.getStruct($(selector).attr('res_key'), level), params,
                function (data) {
                    callback(data, params);
                },
                filter, error, finish);
        });
        return resources;
    },
    getList: function (selector , liveEvent, callback, filter, error, finish, level, params) {
        resources.getItem(
            selector, 
            liveEvent,
            function (data) {
                for (var k in data) {
                    callback(data[k], params);
                }
            },
            filter,
            error,
            finish,
            level,
            params);

        return resources;
    }
};
