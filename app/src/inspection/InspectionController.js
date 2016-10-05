(function () {
    'use strict';
    angular
        .module('inspection')
        .controller('InspectionController', [
            'inspectionService', '$mdSidenav', '$timeout', '$http', '$interval', InspectionController
        ]);
    /**
     * Main Controller for the Angular Material Starter App
     * @param $scope
     * @param $mdSidenav
     * @param avatarsService
     * @constructor
     */
    function InspectionController(inspectionService, $mdSidenav, $timeout, $http, $interval) {
        var self = this;

        self.selected = null;
        self.users = [];
        self.toggleList = function () {
            $mdSidenav('left').toggle();
        };
        self.selectInspection = function (work) {
            require([
                "esri/geometry/Point"
            ], function (Point) {
                self.view.goTo({
                    target: new Point({
                        x: work.geometry.x,
                        y: work.geometry.y,
                        spatialReference: {
                            wkid: 3857
                        }
                    }),
                    zoom: 16
                });
            });
        };
        self.filterAssigned = function () {
            return function (work) {
                return work.attributes.status < 3;
            };
        };
        self.checkWorkOrderId = function (work, id) {
            // var arr = [];
            // for (var i = 0; i < work.length; i++) {
            //   arr.push(work[i].permit);
            // }
            // return arr.indexOf(id) > -1;
            return work.attributes.permits.indexOf(id) > -1;
        };
        var intervalSet = false;
        self.permitSearch = function (permitText) {
            return $http.get("https://services.arcgis.com/v400IkDOw1ad7Yad/arcgis/rest/services/assignments_1542a408cfdd45f49da345d802197905/FeatureServer/0/query?outFields=*&returnGeometry=true&outSR=4326&geometryPrecision=5&f=json&where=permits like '%25" + permitText.toUpperCase() + "%25' or location like '" + permitText.toUpperCase() + "%'")
                .then(function (result) {
                    var display = [];
                    var permits = null;
                    var i = 0,
                        j = 0;
                    for (i = 0; i < result.data.features.length; i += 1) {
                        if (result.data.features[i].attributes.location.toUpperCase().indexOf(permitText.toUpperCase()) > -1) {
                            result.data.features[i].display = result.data.features[i].attributes.location;
                            display.push(result.data.features[i]);
                        } else {
                            permits = result.data.features[i].attributes.permits;
                            permits = permits.split(',');
                            for (j = 0; j < permits.length; j += 1) {
                                if (permits[j].indexOf(permitText) > -1) {
                                    result.data.features[i].display = permits[j];
                                    display.push(result.data.features[i]);
                                }
                            }
                        }
                    }
                    return display;
                });
        };
        self.selectedItemChange = function (permit) {
            if (permit) {
                self.permit = permit;
                inspectionService.getWorkerAccount(permit.attributes.workerId).then(function (workers) {
                    if (workers.features.length > 0) {
                        var accountId = workers.features[0].attributes.userId;
                        inspectionService.getWorkerInfo(accountId).then(function (data) {
                            self.inspector = data;
                        });
                    }
                });
                intervalSet = false;
                inspectionService.getWorkerQueue(permit.attributes.workerId).then(self.workerQueueReceived);
            }
        };
        self.workerQueueReceived = function (queue) {
            self.queue = queue;
            var color = [50, 50, 50],
                label = 0,
                i = 0;
            self.view.graphics.removeAll();
            for (i = 0; i < queue.length; i += 1) {
                if (queue[i].attributes.location !== self.permit.attributes.location) {
                    color = [50, 50, 50];
                    if (queue[i].attributes.status === 2) {
                        color = [0, 200, 83];
                    }
                } else {
                    color = [255, 87, 34];
                }
                if (queue[i].attributes.status === 1 || queue[i].attributes.status === 2) {
                    label += 1;
                    self.addPointToMap(self.view, queue[i], color, false, label);
                }
            }
            if (!intervalSet) {
                self.view.goTo({
                    target: self.view.graphics
                });
            }
            $timeout(function () {
                //$anchorScroll.yOffset = 400;
                document.getElementById('selected').scrollIntoView(false);

            }, 1000);
        };
        $interval(function () {
            if (self.selectedPermit) {
                intervalSet = true;
                inspectionService.getWorkerQueue(self.selectedPermit.attributes.workerId).then(self.workerQueueReceived);
            }
        }, 5000);
        // *********************************
        // Internal methods
        // *********************************
        /**
         * Hide or Show the 'left' sideNav area
         */
        self.map = null;
        self.view = null;

        self.createMap = function () {
            require([
                "esri/Map",
                "esri/views/MapView",
                "esri/layers/VectorTileLayer",
                "dojo/domReady!"
            ], function (Map, MapView, VectorTileLayer) {
                self.map = new Map();
                self.view = new MapView({
                    container: "viewDiv", // Reference to the DOM node that will contain the view
                    map: self.map, // References the map object created in step 3,
                    center: [-78.65, 35.78],
                    zoom: 10
                });
                var tileLyr = new VectorTileLayer({
                    url: "https://www.arcgis.com/sharing/rest/content/items/bf79e422e9454565ae0cbe9553cf6471/resources/styles/root.json"
                });
                self.map.add(tileLyr);
            });
        };

        self.addPointToMap = function (view, feature, color, wgs, label) {
            require([
                "esri/Graphic",
                "esri/geometry/Point",
                "esri/symbols/SimpleMarkerSymbol",
                "esri/symbols/TextSymbol"
            ], function (Graphic, Point, SimpleMarkerSymbol, TextSymbol) {
                var wkid;
                if (wgs) {
                    wkid = 4326;
                } else {
                    wkid = 3857;
                }
                var markerSymbol = new SimpleMarkerSymbol({
                    color: color,
                    outline: { // autocasts as new SimpleLineSymbol()
                        color: [255, 255, 255],
                        width: 2
                    },
                    size: '24px'
                });
                var textSymbol = new TextSymbol({
                    color: "white",
                    haloColor: "black",
                    haloSize: "1px",
                    text: label,
                    xoffset: 0,
                    yoffset: -4,
                    font: { // autocast as esri/symbols/Font
                        size: 12,
                        family: "sans-serif",
                        weight: "bolder"
                    }
                });
                var graphic = new Graphic();
                graphic.symbol = markerSymbol;
                graphic.geometry = new Point(feature.geometry.x, feature.geometry.y, {
                    wkid: wkid
                });
                view.graphics.add(graphic);
                if (label) {
                    var textGraphic = new Graphic();
                    textGraphic.symbol = textSymbol;
                    textGraphic.geometry = new Point(feature.geometry.x, feature.geometry.y, {
                        wkid: wkid
                    });
                    view.graphics.add(textGraphic);
                }
                //           graphic.geometry = webMercatorUtils.geographicToWebMercator(graphic.geometry);
            });
        };
        self.createMap();
    }
})();