angular.module('app', ['ngQlikIsolated'])
    .controller('HomeCtrl', ['$q','ngQlikIsolatedService', function ($q, nqi) {

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
         * @property {qObject[]} objects list of objects in the sheet
         */

        /**
         * Qlik object in a sheet
         * @typedef {Object} qObject
         * @property {string} name name (id) of the object
         * @property {string} type type of the object
         */

        var vm = this;

        /** {qlikConfig} */
        var qConfig;

        /** {Object} qlik object */
        var qlik;
        /** {Object} current open qlik app */
        var currentApp;

        /** {string} */
        vm.baseUrl = 'http://localhost:4848';

        /** {qAppInfo[]} */
        vm.apps = [];

        /** {qSheetInfo[]} */
        vm.sheets = [];

        /** {qAppInfo} */
        vm.selectedApp;

        /** {qSheetInfo} */
        vm.selectedSheet;
                    
        /**
         * Create qlik config from Qlik Server URL
         * @param {string} url Qlik server base url
         * @return {qlikConfig} config Qlik config JSON
         */
        function createConfig(url) {
            url += '/'
            var protocol = url.substring(0, url.indexOf('//') + 2);
            url = url.replace(protocol, '');

            var index = url.indexOf(':');
            index = index < 0 ? url.indexOf('/') : index;
            var hostname = url.substring(0, index);
            url = url.replace(hostname, '').replace(':', '');

            var port = url.substring(0, url.indexOf('/'));
            url = url.replace(port, '');

            var prefix = url;

            return config = {
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
                    console.log(lst);
                    var apps = [];
                    lst.forEach(function (l) {
                        apps.push({ name: l.qDocName, id: l.qDocId });
                    });
                    def.resolve(apps);
                }, config);
            } catch (e) {
                def.reject(e);
                console.log(e);
                this.error = "Error retrieving list of apps " + JSON.stringify(e);
            }
            return def.promise;
        }

        /**
         * Get list of sheets in the specified app
         * @param {qAppInfo} appInfo
         * @param {qlikConfig} config
         * @returns {Promise<qSheetInfo[]>}
         */
        function getSheets(appInfo, config) {
            config = config || qConfig;
            var def = $q.defer();
            try {
                currentApp = qlik.openApp(appInfo.id, config);
                currentApp.getAppObjectList('sheet', function (reply) {
                    console.log(reply);
                    var sheets = [];

                    $.each(reply.qAppObjectList.qItems, function (key, value) {
                        var sheet = { name: value.qData.title, objects: [] };
                        $.each(value.qData.cells, function (k, v) {
                            sheet.objects.push({ name: v.name, type: v.type });
                        });
                        sheets.push(sheet);
                    });
                    console.log(sheets);
                    def.resolve(sheets);
                });
            } catch (e) {
                def.reject(e);
            }
            return def.promise;


            //currentApp.getObjectProperties("HdVjz").then(function (model) {
            //    console.log(model);
            //});	
        }



        /**
         * Load list of app from Qlik Sense server
         */
        vm.loadAppList = function (url) {
            qConfig = createConfig(url);
            nqi.getQlik(url).then(function (q) {
                qlik = q;
                window.q = q;
                // load app list
                getApps().then(function (a) {
                    vm.apps = a;
                }, function (e) {
                    console.log(e);
                    this.error = "Error retrieving list of sheets " + JSON.stringify(e);
                });

            }, function (e) {
                console.log(e);
                this.error = "Error loading qlik.js. " + JSON.stringify(e);
            })
        };

        /**
         * Load list of sheets in the selected app
         */
        vm.loadSheets = function (appinfo) {
            vm.selectedApp = appinfo;
            getSheets(appinfo).then(function (sheets) {
                vm.sheets = sheets;
                vm.selectedSheet = vm.sheets[0];
            }, function (e) {
                console.log(e);
                this.error = "Error retrieving list of objects in sheet " + JSON.stringify(e);
            });
        }

    }])