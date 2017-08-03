/**
 * @fileOverview qlik-isolated.js : Angular wrapper for qlik-isolated.js
 * @author Hari Vikas Janarthanan | hrivks@gmail.com | https://github/hrivks
 * @version {{VERSION}}
 * @license MIT
 */

(function (angular) {
    'use strict';
    angular.module('ngQlikIsolated', [])
        .service('ngQlikIsolatedService', ['$q', '$window', function ($q, $window) {
            var qlikServerBaseUrl;
            var qlikServerPrefix = '';

            /** 
             * qlikIsolated object reference
             * @type {Object}
             */
            this.qlikIsolated = (function () {
                if (!$window.qlikIsolated) {
                    throw 'ng-qlik-isolated: qlikIsolated is unavailable. '
                    + 'Please load qlik-isolated.js. Visit https://github.com/hrivks/qlik-isolated';
                }
                return $window.qlikIsolated;
            })();

            /**
             * Get or set the Qlik Server base url
             * @param {string} url base url of the qlik sense server
             * @param {string} [prefix] url prefix of the qlik server 
             * @return {{url:string, prefix: string}} base url and prefix of the qlik senser server
             */
            this.baseUrl = function (url, prefix) {
                if (url)
                    qlikServerBaseUrl = url;
                if (prefix)
                    qlikServerPrefix = prefix;
                return {
                    url: qlikServerBaseUrl,
                    prefix: prefix
                };
            }

            /**
             * Get Qlik object
             * @param {string} [baseUrl] base url of the qlik server
             * @param {string} [prefix] url prefix of the qlik server
             * @returns {Promise} resolved when qlik is successfuly loaded
             */
            this.getQlik = function (baseUrl, prefix) {
                var url = baseUrl || qlikServerBaseUrl;
                var prefx = prefix || qlikServerPrefix;
                if (!url)
                    throw 'nq-qlik-isolated: Base URL of the qlik server is required.'
                    + ' To globally set base url, use ngQlikIsolatedService.baseUrl(<url>) method';
                var def = $q.defer();
                this.qlikIsolated.getQlik(url, prefix).then(function (q) {
                    def.resolve(q);
                }, function (e) {
                    def.reject(e);
                });
                return def.promise;
            };
        }])
        .directive('qlikIsolatedObject', ['ngQlikIsolatedService', function (ngQlikIsolatedService) {
            return {
                restrict: 'AE',
                scope: {
                    baseUrl: '@',
                    appId: '@',
                    obj: '@',
                    sheet: '@'
                },
                link: function (scope, element, attr) {
                    var url = scope.baseUrl || ngQlikIsolatedService.baseUrl().url;
                    if (!url)
                        throw 'nq-qlik-isolated: Base URL of the qlik server is required'
                        + 'To globally set baseUrl, use ngQlikIsolatedService.baseUrl(<url>)';

                    var selBar = typeof attr['showSelectionBar'] === 'string'
                        && attr['showSelectionBar'] != 'false';
                    var clrSel = typeof attr['clearSelection'] === 'string'
                        && attr['clearSelection'] != 'false';
                    var disIntr = typeof attr['disableInteraction'] === 'string'
                        && attr['disableInteraction'] != 'false';
                    var disSel = typeof attr['disableSelection'] === 'string'
                        && attr['disableSelection'] != 'false';
                    var disAni = typeof attr['disableAnimation'] === 'string'
                        && attr['disableAnimation'] != 'false';
                    var selections = attr['selections'] && attr['selections'].split(';');

                    ngQlikIsolatedService
                        .qlikIsolated
                        .getObjectIsolated($(element), scope.appId, scope.obj, scope.sheet, url,
                        selBar, clrSel, disIntr, disSel, disAni, selections);
                }
            }
        }])
        .directive('qlikIsolatedSelectionBar', ['ngQlikIsolatedService',
            function (ngQlikIsolatedService) {
                return {
                    restrict: 'AE',
                    scope: {
                        baseUrl: '@',
                        appId: '@'
                    },
                    link: function (scope, element, attr) {
                        var url = scope.baseUrl || ngQlikIsolatedService.baseUrl().url;
                        if (!url)
                            throw 'nq-qlik-isolated: Base URL of the qlik server is required'
                            + 'To globally set base url, use ngQlikIsolatedService.baseUrl(<url>)';

                        var clrSel = typeof attr['clearSelection'] === 'string'
                            && attr['clearSelection'] != 'false';
                        var disIntr = typeof attr['disableInteraction'] === 'string'
                            && attr['disableInteraction'] != 'false';
                        var disSel = typeof attr['disableSelection'] === 'string'
                            && attr['disableSelection'] != 'false';
                        var disAni = typeof attr['disableAnimation'] === 'string'
                            && attr['disableAnimation'] != 'false';
                        var selections = attr['selections'] && attr['selections'].split(';');
						
                        ngQlikIsolatedService
                            .qlikIsolated
                            .getSelectionBarIsolated($(element), scope.appId, url, clrSel, disIntr,
                            disSel, disAni, selections);
                    }
                }
            }]);
}(angular));