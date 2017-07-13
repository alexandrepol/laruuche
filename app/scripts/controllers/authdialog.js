'use strict';

/**
 * @ngdoc function
 * @name laruucheApp.controller:AuthDialogCtrl
 * @description
 * # AuthDialogCtrl
 * Controller of the laruucheApp
 */
angular.module('laruucheApp')
  .controller('AuthDialogCtrl', function ($rootScope, $scope, $mdDialog, Auth, $location, Users, $mdConstant) {
    $scope.step = "Etape 1";
    $scope.isLogged = false;

    var auth = Auth;

    $rootScope.auth = Auth;


    // any time auth state changes, add the user data to scope
    $rootScope.auth.$onAuthStateChanged(function(firebaseUser) {
      $rootScope.firebaseUser = firebaseUser;
      if(!$rootScope.firebaseUser){
        $location.path('/');
      }
      else{
        $scope.step = "Etape 2";
        $scope.isLogged = true;
        /*Retrieve User Data*/
        $scope.user = Users.getProfile(firebaseUser.uid);
        var getTags = Users.getTags(firebaseUser.uid);
        $scope.tags = [];
        getTags.$loaded().then(function () {
          if(getTags){
            $scope.tags = getTags.$value.split(',');
          }
          else{
            $scope.tags = [];
          }
        });
      }
    });


    /*Add user to database*/
    function addUserData(uid, email, displayName, photoURL){
      var userRef = firebase.database().ref();
      var isUser = Users.getProfile(uid);
      var photo = photoURL;
      var fname = displayName.split(' ')[0];
      var lname = displayName.split(' ').slice(1).join(' ');
      var user = {
        email:email,
        displayName:displayName,
        firstName:fname,
        lastName:lname,
        photoURL:photo,
        accessLevel:10
      };
      isUser.$loaded().then(function(isUser) {
        if(isUser.email){
          //user exist
        }
        else{
          userRef.child('users').child(uid).set(user);
        }
      });
    }

    $scope.googleSignIn = function(){
      $scope.error = null;
      var provider = new firebase.auth.GoogleAuthProvider();
      auth.$signInWithPopup(provider).then(function (firebaseUser) {
        $rootScope.firebaseUser = firebaseUser;
        addUserData(firebaseUser.user.uid, firebaseUser.user.email, firebaseUser.user.displayName,  firebaseUser.user.providerData[0].photoURL);

      }).catch(function (error) {
        $scope.error = error;
      });
    };

    $scope.fbSignIn = function(){
      var provider = new firebase.auth.FacebookAuthProvider();
      auth.$signInWithPopup(provider).then(function (firebaseUser) {
        $rootScope.firebaseUser = firebaseUser;
        /*Add user to Database*/
        addUserData(firebaseUser.user.uid, firebaseUser.user.email, firebaseUser.user.displayName, firebaseUser.user.providerData[0].photoURL);

      }).catch(function (error) {
        $scope.error = error;
      });
    };

    $scope.goToPanel = function () {
      if($scope.user){
        $location.path('/panel');
      }
    };

    $scope.close = function(){
      $mdDialog.cancel();
    };

    /*Data for profile*/
    $scope.userTags = [];
    $scope.userTrack = '';
    $scope.tracks = [
      "S",
      "L",
      "ES",
      "STI2D",
      "ST2S",
      "STL",
      "STMG",
      "Autres"
    ];

    /*Tags for expert*/
    this.customKeys = [$mdConstant.KEY_CODE.ENTER,$mdConstant.KEY_CODE.SPACE];

    $scope.updateProfile = function(){
      $scope.user.tags = $scope.tags.join();
      $scope.user.$save().then(function(){
        //If works redirect To
        console.log("Profile updated");
        $location.path('/panel');

      }).catch(function(err){
        console.log(err);
      });
    };


  });
