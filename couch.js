;(function() {
    // # cb(status, headers, body)
    function ajax(method, url, headers, body, cb) {
        cb = cb || function() {}
        var req = new XMLHttpRequest()
        req.onreadystatechange = onChange
        req.open(method, url)
        // 设置各个头部字段
        if (headers) {
            for (var k in headers) {
                req.setRequestHeader(k, headers[k])
            }
        }
        if (body) {
            req.send(body)
        }
        else {
            req.send()
        }
        return req
        
        function onChange() {
            if (req.readyState !== 4) {
                return
            }
            var status = {
                code: req.status,
                text: req.statusText
            }
            var headers = req.getAllResponseHeaders()
            cb(status, headers, req.responseText)
        }
    }

    ajax.get = function(url, headers, cb) {
        return ajax('GET', url, headers, undefined, cb)
    }

    ajax.post = function(url, headers, body, cb) {
        return ajax('POST', url, headers, body, cb)
    }

    ajax.put = function(url, headers, body, cb) {
        return ajax('PUT', url, headers, body, cb)
    }

    ajax['delete'] = function(url, headers, cb) {
        return ajax('DELETE', url, headers, undefined, cb)
    }

    // essential
    
    window.couchdb = {
        baseUrl: 'http://localhost:5984',
        signin: function(name, password, cb) {
            var absUrl = this.baseUrl + '/_session'
            var headers = {
                'Content-Type': 'application/json;charset=utf-8'
            }
            var reqObj = {
                name: name, 
                password: password
            }
            ajax.post(absUrl, headers, JSON.stringify(reqObj), this._cbProxy(cb))
        },
        signout: function(cb) {
            var absUrl = this.baseUrl + '/_session'
            ajax['delete'](absUrl, null, this._cbProxy(cb))
        },
        // # cb(status, headers, resObj)
        get: function(url, headers, cb) {
            var absUrl = this.baseUrl + url
            ajax.get(absUrl, headers, this._cbProxy(cb))
        },
        // # cb(status, headers, resObj)
        post: function(url, headers, reqObj, cb) {
            var absUrl = this.baseUrl + url
            // reqObj is optional
            if (reqObj) {
                headers = headers || {}
                headers['Content-Type'] = 'application/json;charset=utf-8'
                ajax.post(absUrl, headers, JSON.stringify(reqObj), this._cbProxy(cb))
            }
            else {
                ajax.post(absUrl, headers, undefined, this._cbProxy(cb))
            }
        },
        // # cb(status, headers, resObj)
        put: function(url, headers, reqObj, cb) {
            var absUrl = this.baseUrl + url
            // reqObj is optional
            if (reqObj) {
                headers = headers || {}
                headers['Content-Type'] = 'application/json;charset=utf-8'
                ajax.put(absUrl, headers, JSON.stringify(reqObj), this._cbProxy(cb))
            }
            else {
                ajax.put(absUrl, headers, undefined, this._cbProxy(cb))
            }
        },
        // # cb(status, headers, resObj)
        'delete': function(url, headers, cb) {
            var absUrl = this.baseUrl + url
            ajax['delete'](absUrl, headers, this._cbProxy(cb))
        },
        _cbProxy: function(cb) {
            return function(status, headers, body) {
                try {
                    body = JSON.parse(body)
                }
                catch (err) {
                    console.error(err)
                    body = undefined
                }
                if (cb) cb(status, headers, body)
        
                // debug purpose only
                
                dumpResponse(status, headers, body)
                
                function dumpResponse(status, headers, body) {
                    log(status.code + ' ' + status.text)
                    log(headers)
                    log(typeof body === 'object' ? JSON.stringify(body, null, 4) : body)
                    hr()
                    function log(text) {
                        if (typeof text === 'object') {
                            text = JSON.stringify(text, null, 4)
                        }
                        
                        var e = document.createElement('pre')
                        e.textContent = text
                        document.body.appendChild(e)
                    }
                    function hr() {
                        document.body.appendChild(document.createElement('hr'))
                    }
                }
            }
        }
    }

    // extension

    var couchdb = window.couchdb
    
    // #cb(status, headers, resObj)
    couchdb._uuids = function(count, cb) {
        var query = (count !== undefined ? ('?count=' + encodeURIComponent(count)) : '')
        couchdb.get('/_uuids' + query, null, function(status, headers, resObj) {
            if (status.code !== 200) {
                return
            }
            if (cb) {
                cb(status, headers, resObj)
            }
        })
    }

    couchdb.db = function(name) {
        return {
            _design: {
                
                head: undefined,    // TODO

                // #cb(status, headers, resObj)
                // many arguments can be specified in opt, see couchdb document
                get: function(docid, opt, cb) {
                    var url = '/' + encodeURIComponent(name) + '/_design/' + encodeURIComponent(docid) + obj2query(opt)
                    couchdb.get(url, undefined, cb)
                },

                // #cb(status, headers, resObj)
                // many arguments can be specified in opt, see couchdb document
                put: function(ddoc, opt, cb) {
                    var url = '/' + encodeURIComponent(name) + '/_design/' + encodeURIComponent(ddoc._id) + obj2query(opt)
                    couchdb.put(url, undefined, ddoc, cb)
                },

                // #cb(status, headers, resObj)
                // many arguments can be specified in opt, see couchdb document
                // ddoc: {_id, _rev}
                'delete': function(ddoc, opt, cb) {
                    var _id = ddoc._id
                    var _rev = ddoc._rev
                    var url = '/' + encodeURIComponent(name) + '/_design/' + encodeURIComponent(_id) + obj2query(opt, {rev: _rev})
                    couchdb['delete'](url, undefined, cb)
                }
            }
        }
    }
    
    // you can provide multiple obj
    function obj2query() {
        if (arguments.length < 1) {
            return ''
        }
        var query = []
        for (var i = 0, len = arguments.length; i < len; ++i) {
            obj = arguments[i] || {}
            for (var name in obj) {
                var value = obj[name]
                query.push(encodeURIComponent(name) + '=' + encodeURIComponent(value))
            }
        }
        query = query.join('&')
        query = query ? ('?' + query) : query
        return query
    }
    
    // test only
    // window.obj2query = obj2query
})();

// test

onload = function() {
    couchdb.signin('anna', 'secret', function() {
        couchdb.db('apple-rabbit')._design.put({
            _id: 'xxx'
        })
    })
    //couchdb.put('/xxx')
    //couchdb.signout()
    //couchdb._uuids(undefined)
    //couchdb.db('apple-rabbit')._design.get('xxx')
}