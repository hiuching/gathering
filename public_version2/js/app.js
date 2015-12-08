var pageCtrl = angular.module('myApp', ['ngRoute'], function($routeProvider) {
	$routeProvider.when('/', {
		templateUrl: 'home.html'
	}).when('/setting', {
		templateUrl: 'setting.html'
	}).when('/aboutus', {
		templateUrl: 'AboutUs.html'
	}).when('/create', {
		templateUrl: 'CreateGathering.html'
	}).when('/ChangePassword', {
		templateUrl: 'ChangePassword.html'
	}).otherwise({
		redirectTo: '/'
	});
});

pageCtrl.controller('pageCtrl',function($scope){
	
})