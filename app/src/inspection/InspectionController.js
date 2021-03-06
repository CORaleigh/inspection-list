(function(){

  angular
       .module('inspection')
       .controller('InspectionController', [
          'inspectionService', '$mdSidenav', '$mdBottomSheet', '$timeout', '$log', '$http', '$interval',
          InspectionController
       ]);

  /**
   * Main Controller for the Angular Material Starter App
   * @param $scope
   * @param $mdSidenav
   * @param avatarsService
   * @constructor
   */
  function InspectionController( inspectionService, $mdSidenav, $mdBottomSheet, $timeout, $log, $http, $interval ) {
    var self = this;



    createMap();

    self.selected     = null;
    self.users        = [ ];

    self.selectInspection = function (work) {
      require([
        "esri/geometry/Point"], function (Point) {
          view.goTo({target: new Point({x: work.geometry.x, y: work.geometry.y, spatialReference: { wkid: 3857 }}), zoom: 16});
        } );     
      

    }

    self.filterAssigned = function (work) {
      return function (work) {
        return work.status < 3;
      }
    }

    self.checkWorkOrderId = function (work, id) {
      var arr = [];
      for (var i = 0; i < work.length; i++) {
        arr.push(work[i].permit);
      }
      return arr.indexOf(id) > -1;
    }

    self.permitSearch = function(permitText){
      return $http.get("https://services.arcgis.com/v400IkDOw1ad7Yad/arcgis/rest/services/assignments_1542a408cfdd45f49da345d802197905/FeatureServer/0/query?outFields=*&returnGeometry=true&outSR=4326&geometryPrecision=5&f=json&orderByFields=workOrderId&where=workOrderId like '"+permitText.toUpperCase()+"%'")
      .then(function(result){
        return result.data.features;
      })
    }
    self.selectedItemChange = function (permit) {
      console.log(permit);
      self.permit = permit;
      inspectionService.getWorkerAccount(permit.attributes.workerId).then(function (workers) {
        if (workers.features.length > 0) {
          var accountId = workers.features[0].attributes.userId;
          inspectionService.getWorkerInfo(accountId).then(function (data) {
            self.inspector = data;
          });      
        }
      });

      inspectionService.getWorkerQueue(permit.attributes.workerId).then(function (queue) { 
        self.queue = queue.features;
        var color = [50,50,50];
        view.graphics.removeAll();
        for (var i = 0; i < queue.features.length;i++) {
          if (queue.features[i].location != self.permit.attributes.location) {
            color = [50,50,50];
            if (i === 0) {
              color = [0,200,83];
            }
          } else {
            color = [255,87,34];
          }

          addPointToMap(view, queue.features[i], color, false, i + 1);
        }
        view.goTo({target:view.graphics});
      });    
    }

      $interval(function () {
        if (self.selectedPermit) {
          inspectionService.getWorkerQueue(self.selectedPermit.attributes.workerId).then(function (queue) { 
            self.queue = queue.features;
          });
        }

      }, 5000);



    // *********************************
    // Internal methods
    // *********************************

    /**
     * Hide or Show the 'left' sideNav area
     */
     var map, view = null;
     function createMap () {
      require([
        "esri/Map",
        "esri/views/MapView",
        "esri/layers/VectorTileLayer",
        "dojo/domReady!"
      ], function(Map, MapView, VectorTileLayer) {
        map = new Map();
        view = new MapView({
          container: "viewDiv",  // Reference to the DOM node that will contain the view
          map: map,         // References the map object created in step 3,
          center: [-78.65, 35.78],
          zoom: 10          
        }); 
        var tileLyr = new VectorTileLayer({
          url: "https://www.arcgis.com/sharing/rest/content/items/bf79e422e9454565ae0cbe9553cf6471/resources/styles/root.json"
        });
        map.add(tileLyr);               
      });      
     }

     function addPointToMap (view, feature, color, wgs, label) {
      require([
        "esri/Graphic",
        "esri/geometry/Point",
        "esri/symbols/SimpleMarkerSymbol",
        "esri/symbols/TextSymbol",
        "esri/geometry/support/webMercatorUtils"], function (Graphic, Point, SimpleMarkerSymbol, TextSymbol, webMercatorUtils) {
          var markerSymbol = new SimpleMarkerSymbol({
            color: color,
            outline: { // autocasts as new SimpleLineSymbol()
              color: [255, 255, 255],
              width: 2
            },
            size: '20px'
          });
          var textSymbol = new TextSymbol({
            color: "white",
            haloColor: "black",
            haloSize: "1px",
            text: label,
            xoffset: 0,
            yoffset: -4,
            font: {  // autocast as esri/symbols/Font
              size: 12,
              family: "sans-serif",
              weight: "bolder"
            }
          });          
          var graphic = new Graphic();
          graphic.symbol = markerSymbol;
          graphic.geometry = new Point(feature.geometry.x, feature.geometry.y, {wkid: wgs ? 4326 : 3857});
          view.graphics.add(graphic);
          if (label) {          
            var textGraphic = new Graphic();
            textGraphic.symbol = textSymbol;
            textGraphic.geometry = new Point(feature.geometry.x, feature.geometry.y, {wkid: wgs ? 4326 : 3857});
            view.graphics.add(textGraphic);
          }      
//           graphic.geometry = webMercatorUtils.geographicToWebMercator(graphic.geometry);

          
        });      
     }


  }

})();
