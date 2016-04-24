var pageCtrl = angular.module('myApp', ['ngRoute'], function($routeProvider) {
	$routeProvider.when('/', {
		templateUrl: 'Home.html'
	}).when('/setting', {
		templateUrl: 'setting.html'
	}).when('/aboutus', {
		templateUrl: 'AboutUs.html'
	}).when('/create', {
		templateUrl: 'CreateGathering.html'
	}).when('/ChangePassword', {
		templateUrl: 'ChangePassword.html'
	}).when('/vote', {
		templateUrl: 'vote.html'
	}).when('/secondVote', {
		templateUrl: 'SecondVote.html'
	}).when('/result', {
		templateUrl: 'result.html'
	}).otherwise({
		redirectTo: '/'
	});
});

pageCtrl.controller('pageCtrl',function($scope){
	
})