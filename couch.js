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

var couchdb = {
    baseUrl: 'http://localhost:5984',
    cb: undefined,
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
        cb = cb || this.cb
        return function(status, headers, body) {
            try {
                body = JSON.parse(body)
            }
            catch (err) {
                console.error(err)
                body = undefined
            }
            if (cb) cb(status, headers, body)
        }
    }
}

function showResult(status, headers, body) {
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

couchdb.cb = showResult

onload = function() {
    //couchdb.signin('anna', 'secret')
    //couchdb.put('/xxx')
    couchdb.signout()
}