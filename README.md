# ng-qlik-isolated

Angular wrapper for [qlik-isolated.js](https://github.com/hrivks/qlik-isolated)

### :zap: [live demo](http://meetvikas.net/misc/qlik-isolated/demo/Index.html) :zap:
 
### Installation
---

through npm

```bash
npm install ng-qlik-isolated
```

Include the ng-qlik-isolated.js 
```HTML

<script src="qlik-isolated.min.js"></script> 

<script src="ng-qlik-isolated.min.js"></script>
```
anuglar.js and [qlik-isolated.js](https://github.com/hrivks/qlik-isolated) must be loaded first

##### Add module dependency
```javascript
angular.module('app', ['ngQlikIsolated']);
```

### ngQlikIsolatedService
---
##### Get qlik object
```javascript
ngQlikIsolatedService
    .getQlik('http://<qlikserver>:<port>')
    .then(function(qlik){ 
        /* qlik object available here */
    }, function(error){
        /* error info */
    });
    
```

##### Globally set qlik server url
```javascript
ngQlikIsolatedService.baseUrl('http://<qlikserver>:<port>'); // set
var currentUrl = ngQlikIsolatedService.baseUrl(); // get
```
once baseUrl is set, `ngQlikIsolatedService.getQlik()` can be called without any parameters

##### Get qlikIsolated object
once qlik-isolated.js is loaded, qlikIsolated is available globally. However, to get it safely in an angular-ish way,
```javascript
ngQlikIsolatedService.qlikIsolated
    
```

### qlikIsolatedObject directive
---
##### Embed a qlik object

```html
<qlik-isolated-object base-url="http://<qlikserver>:<port>"
                      app-id="My App.qvf"
                      obj="HdVjz"
                      show-selection-bar
                      clearSelection
                      disableInteraction
                      disableSelection
                      disableAnimation
                      selections = "FieldName1,Value1; FieldName2, value1, value2" />
```
The `base-url` attribute can be ommitted if the baseUrl has already been set globally. <br>
Apart from `app-id` and `obj` all other attributes are optional

##### Embed a qlik sheet

```html
<qlik-isolated-object base-url="http://<qlikserver>:<port>"
                      app-id="My App.qvf"
					  sheet="aBcDeF" />
```
### qlikIsolatedSelectionBar directive
---

##### Embed selection bar
if you have a number of qlik objects and would like a common selection bar say, at the top

```HTML
<qlik-isolated-selection-bar base-url="http://<qlikserver>:<port>"
                             app-id="My App.qvf" />
```

### License
---
MIT