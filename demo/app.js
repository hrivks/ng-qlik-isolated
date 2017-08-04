angular.module('app', ['ngQlikIsolated'])
    .controller('HomeCtrl', ['$q', 'ngQlikIsolatedService', function ($q, nqi) {

        /**
         * Qlik config object
         * @typedef {Object} qlikConfig
         * @property {string} host host name
         * @property {string} port port number
         * @property {string} prefix prefix before /extension folder 
         * @property {boolean} isSecure true if qlik server is server over https
         */

        /**
         * Qlik app information
         * @typedef {Object} qAppInfo
         * @property {string} name name of the app
         * @property {string} id id of the app
         */

        /**
         * Qlik sheet information in an app
         * @typedef {Object} qSheetInfo
         * @property {string} name name of the sheet
         * @property {string} description description of the object
         * @property {string} id id of the sheet
         * @property {string} img url of the sheet image
         * @property {qObject[]} objects list of objects in the sheet
         */

        /**
         * Qlik object in a sheet
         * @typedef {Object} qObject
         * @property {string} name name (id) of the object
         * @property {string} type type of the object
         */

        /**
         * Object properties to be displayed
         * @typedef {Object} dispObj
         * @property {string} title title of the object
         * @property {string} description description of the object
         * @property {string} type type of the object
         * @property {string} id id of the object
         * @property {string} img image url of the object
         */

        var vm = this;

        /** {qlikConfig} */
        var qConfig;

        /** {Object} qlik object */
        var qlik;
        /** {Object} current open qlik app */
        var currentApp;

        /** {string} */
        vm.baseUrl = '';

        /** {qAppInfo[]} */
        vm.apps = [];

        /** {qSheetInfo[]} */
        vm.sheets = [];

        /** {qAppInfo} */
        vm.selectedApp = null;

        /** {qSheetInfo} */
        vm.selectedSheet = null;

        /** {dispObj} */
        vm.displayItem = null;

        /** {dispObj[]} */
        vm.embeddedObjects = [];

        /** {boolean} */
        vm.showSelectionBar = true;

        /** {boolean} */
        vm.loading = false;

        /**
         * Create qlik config from Qlik Server URL
         * @param {string} url Qlik server base url
         * @return {qlikConfig} config Qlik config JSON
         */
        function createConfig(url) {
            url += '/';
            var protocol = url.substring(0, url.indexOf('//') + 2);
            url = url.replace(protocol, '');
            url.replace('//', '/');

            var index = url.indexOf(':');
            index = index < 0 ? url.indexOf('/') : index;
            var hostname = url.substring(0, index);
            url = url.replace(hostname, '').replace(':', '');

            var port = url.substring(0, url.indexOf('/'));
            url = url.replace(port, '');

            var prefix = url;

            return {
                host: hostname,
                prefix: prefix,
                port: port,
                isSecure: protocol === 'https://'
            };
        }
        /**
         * Get list of app from qlik sense server
         * @param {qlikConfig} config qlik config
         * @return {Promise<qAppInfo[]>}
         */
        function getApps(config) {
            config = config || qConfig;
            var def = $q.defer();
            try {
                qlik.getAppList(function (lst) {
                    var apps = [];
                    lst.forEach(function (l) {
                        apps.push({ name: l.qDocName, id: l.qDocId });
                    });
                    def.resolve(apps);
                    vm.loading = false;
                }, config);
            } catch (e) {
                def.reject(e);
                console.log(e);
                vm.error = "Error retrieving list of apps " + JSON.stringify(e);
            }
            return def.promise;
        }

        /**
         * Get list of sheets in the specified app
         * @param {qAppInfo} appInfo qlik app
         * @param {qlikConfig} [config] qlik configuration object
         * @returns {Promise<qSheetInfo[]>}
         */
        function getSheets(appInfo, config) {
            config = config || qConfig;
            var def = $q.defer();
            try {
                currentApp = qlik.openApp(appInfo.id, config);
                currentApp.getAppObjectList('sheet', function (reply) {

                    var sheets = [];

                    $.each(reply.qAppObjectList.qItems, function (key, value) {
                        var sheet = {
                            name: value.qData.title,
                            id: value.qInfo.qId,
                            description: value.qData.description,
                            img: value.qData.thumbnail.qStaticContentUrl.qUrl,
                            objects: []
                        };

                        $.each(value.qData.cells, function (k, v) {
                            sheet.objects.push({ name: v.name, type: v.type });
                        });
                        sheets.push(sheet);
                    });
                    def.resolve(sheets);
                });
            } catch (e) {
                def.reject(e);
            }
            return def.promise;
        }

        /**
         * Load properties of the specified object
         * @param {string} obj id of the object
         * @return {*}
         */
        function getObjectProperties(obj) {
            var def = $q.defer();
            try {
                currentApp.getObjectProperties(obj).then(function (reply) {
                    console.log(reply);
                    def.resolve(reply);
                }, function (e) {
                    def.reject(e);
                });
            } catch (e) {
                def.reject(e);
            }
            return def.promise;
        }

		/**
		 * Qlik error event listener. Update alert box when received message
		 * @param {{message: string, code: number}} err Qlik error object
		 */
        function onQlikError(err) {
            console.log('Qlik error occured', err);
            var def = $q.defer(); // $q to bring e into angular contextual
            def.resolve(err);
            def.promise.then(function (e) {
                vm.error = "Oops! Qlik error occured. Message: " + e.message + ". Code: " + e.code;
            });
        }

        /**
         * Load list of app from Qlik Sense server
         * @param {string} url base url of the qlik sense server
         */
        vm.loadAppList = function (url) {
            if (!url)
                return;
            vm.loading = true;
            qConfig = createConfig(url);
            window.config = qConfig;
            console.log('You can access your qlik config object as \'config\'', config);

            nqi.getQlik(url).then(function (q) {
                qlik = q;
                console.log('You can access qlik  as \'qlik\'', q);
                window.qlik = q;

                // attach error event handler
                qlik.setOnError(function (e) { onQlikError(e); });

                // load app list
                getApps().then(function (a) {
                    vm.apps = a;
                    vm.qlikLoaded = true;
                    vm.loading = false;
                }, function (e) {
                    console.log(e);
                    vm.error = "Error retrieving list of sheets " + JSON.stringify(e);
                    vm.loading = false;
                });

            }, function (e) {
                console.log(e);
                vm.error = "Error loading qlik.js. Make sure Qlik server URL is working. "
                    + " If you are connecting to Qlik Desktop (http://localhost:4848), "
                    + " make sure it is open. " + JSON.stringify(e);
                vm.loading = false;
            });
        };


        /**
         * Load list of sheets in the selected app
         * @param {qAppInfo} appInfo selected qlik sense app
         */
        vm.loadSheets = function (appInfo) {
            vm.loading = true;
            vm.selectedApp = appInfo;
            getSheets(appInfo).then(function (sheets) {
                vm.sheets = sheets;
                vm.selectedSheet = vm.sheets[0];
                if (vm.selectedSheet)
                    vm.loadSheetProperties(vm.selectedSheet);
                vm.loading = false;
            }, function (e) {
                console.log(e);
                vm.error = "Error retrieving list of objects in sheet " + JSON.stringify(e);
                vm.loading = true;
            });
        };

        /**
         * Load properties of object
         * @param {qObject} obj 
         */
        vm.loadObjectProperties = function (obj) {
            vm.loading = true;
            vm.selectedObject = obj;
            getObjectProperties(obj.name).then(function (d) {
                var title = (typeof d.properties.title === 'string') ?
                    d.properties.title : d.properties.visualization;
                vm.displayItem = {};
                vm.displayItem.title = title || d.properties.visualization;
                vm.displayItem.type = d.properties.visualization;
                vm.displayItem.id = d.id;
                vm.displayItem.appId = currentApp.id;
                vm.loading = false;
            }, function (e) {
                console.log(e);
                vm.error = "Error retrieving object properties " + obj + '. ' + JSON.stringify(e);
                vm.loading = false;
            });
        };

        /**
         * Load properties of sheet
         * @param {qSheetInfo} sheet qlik sheet info object
         */
        vm.loadSheetProperties = function (sheet) {
            vm.selectedSheet = sheet;
            vm.displayItem = {};
            vm.displayItem.title = sheet.name;
            vm.displayItem.type = 'sheet';
            vm.displayItem.id = sheet.id;
            vm.displayItem.description = sheet.description;
            vm.displayItem.appId = currentApp.id;
            vm.displayItem.img = sheet.img ? vm.baseUrl + sheet.img : '';
        };

        /**
         * Embed the given object in the web page
         * @param {qObject} obj
         */
        vm.embedObject = function (obj) {
            var toEmbed = {
                title: obj.title,
                id: obj.id,
                appId: currentApp.id,
                baseUrl: vm.baseUrl,
                type: obj.type,
                isSheet: obj.type === 'sheet',
                isObject: obj.type !== 'sheet',
                showSelectionBar: vm.showSelectionBar
            };
            vm.embeddedObjects.push(toEmbed);
        };

        /**
         * Embed a selection bar
         */
        vm.addSelectionBar = function () {
            var toEmbed = {
                title: 'selection bar',
                appId: currentApp.id,
                baseUrl: vm.baseUrl,
                type: 'selection bar',
                isSheet: false,
                isSelectionBar: true
            };
            vm.embeddedObjects.push(toEmbed);
        };
    }]);