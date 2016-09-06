(function(){
  'use strict';

  angular.module('inspection')
         .service('inspectionService', ['$q', '$http', InspectionService]);

  
  function InspectionService($q, $http){
    // Promise-based API
    return {
      loadAllUsers : function() {
        // Simulate async nature of real remote calls
        return $q.when(users);
      },
      getWorkerAccount: function (id) {
        var promise = $http({
          url: 'https://services.arcgis.com/v400IkDOw1ad7Yad/ArcGIS/rest/services/workers_1542a408cfdd45f49da345d802197905/FeatureServer/0/query',
          method: 'GET',
          params: {
            f: 'json',
            objectIds: [id],
            outFields: '*'
          }
        }).then(function (response) {
          return response.data;
        });
        return promise;
      },
      getWorkerInfo: function (userId) {
        var promise = $http({
          url: 'https://ral.maps.arcgis.com/sharing/rest/community/users/'+userId,
          method: 'GET',
          params: {
            f: 'json'
          }
        }).then(function (response) {
          return response.data;
        });
        return promise;
      },
      getWorkerQueue: function (workerId) {
        var promise = $http({
          url: 'https://services.arcgis.com/v400IkDOw1ad7Yad/ArcGIS/rest/services/assignments_1542a408cfdd45f49da345d802197905/FeatureServer/0/query',
          method: 'GET',
          params: {
            f: 'json',
            where: 'workerId = \'' + workerId + '\'',
            outFields: '*',
            orderByFields: 'dueDate,location'
          }
        }).then(function (response) {
          var lastLocation = null, item = null, results = {features:[]};
          for (var i = 0; i < response.data.features.length; i++) {
            console.log(response.data.features[i].attributes.location);
            if (response.data.features[i].attributes.location === lastLocation) {
              item.work.push({oid: response.data.features[i].attributes.OBJECTID, permit: response.data.features[i].attributes.workOrderId, code: response.data.features[i].attributes.code});
            } else {
              if (item) {
                results.features.push(item);
              }
              item = {geometry: response.data.features[i].geometry, status: response.data.features[i].attributes.status, location: response.data.features[i].attributes.location, notes: response.data.features[i].attributes.notes,dueDate: response.data.features[i].attributes.dueDate, work: [{oid: response.data.features[i].attributes.OBJECTID, permit: response.data.features[i].attributes.workOrderId, code: response.data.features[i].attributes.code}]};
            }
            if (i === response.data.features.length - 1) {
              results.features.push(item);
            }            
            lastLocation = response.data.features[i].attributes.location;            
          }
          console.log(results);
          return results;
        });
        return promise;
      }
    }
  }

})();
