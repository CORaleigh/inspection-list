(function () {
    'use strict';
    angular.module('inspection')
        .service('inspectionService', ['$http', InspectionService]);

    function InspectionService($http) {
        // Promise-based API
        return {
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
                    url: 'https://ral.maps.arcgis.com/sharing/rest/community/users/' + userId,
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
                    return response.data.features;
                });
                return promise;
            }
        };
    }
})();