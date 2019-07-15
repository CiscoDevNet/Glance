(function () {
    'use strict';

    var app = angular.module('GlanceApp', ['chart.js']);

    app.config(function (ChartJsProvider) {
        // Configure all charts
        ChartJsProvider.setOptions({
            colors: ['#97BBCD', '#DCDCDC', '#F7464A', '#46BFBD', '#FDB45C', '#949FB1', '#4D5360']
        });
    });

    app.controller('LineCtrl', ['$scope','$http','$location', function ($scope,$http,$location) {
        $http.get($location.protocol() + '://'+ $location.host() +':'+  $location.port()+'/api/v1/useractivity/statistics/all').then(function successCallback(data) {
            console.log("data:"+data.toString())
            $scope.labels = data.data.visitingHours;//['9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '13:00 PM', '14:00 PM', '15:00 PM'];
            $scope.series = data.data.visitingDays;//['2016-07-11','2016-07-12'];
            $scope.data =  data.data.visitingDayHourCounts;//[[65, 59, 80, 81, 56, 55, 2000],[67, 65, 123, 456, 267, 155, 1456]];
            $scope.onClick = function (points, evt) {
                console.log(points, evt);
            };
            $scope.onHover = function (points) {
                if (points.length > 0) {
                    console.log('Point', points[0].value);
                } else {
                    console.log('No point');
                }
            };
            $scope.datasetOverride = [{ yAxisID: 'y-axis-1' }, { yAxisID: 'y-axis-2' }];
            $scope.options = {
                scaleGridLineWidth : 1,
                pointDot : false,
                scales: {
                    yAxes: [
                        {
                            id: 'y-axis-1',
                            type: 'linear',
                            display: true,
                            position: 'left'
                        },
                        {
                            id: 'y-axis-2',
                            type: 'linear',
                            display: true,
                            position: 'right'
                        }
                    ]
                }
            };

            //$scope.heading = data.posts; // response data
        },function errorCallback(response) {
            $scope.labels = [];
            $scope.series = [];
            $scope.data = [
                //[65, 59, 80, 81, 56, 55, 2000],[67, 65, 123, 456, 267, 155, 1456]
            ];
            $scope.onClick = function (points, evt) {
                console.log(points, evt);
            };
            $scope.onHover = function (points) {
                if (points.length > 0) {
                    console.log('Point', points[0].value);
                } else {
                    console.log('No point');
                }
            };
            $scope.datasetOverride = [{ yAxisID: 'y-axis-1' }, { yAxisID: 'y-axis-2' }];

            $scope.options = {
                scales: {
                    yAxes: [
                        {
                            id: 'y-axis-1',
                            type: 'linear',
                            display: true,
                            position: 'left'
                        },
                        {
                            id: 'y-axis-2',
                            type: 'linear',
                            display: true,
                            position: 'right'
                        }
                    ]
                }
            };
        });


    }]);
})();