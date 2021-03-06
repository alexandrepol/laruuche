/**
 * @ngdoc function
 * @name laruucheApp.controller:ChatroomCtrl
 * @description
 * # ChatroomCtrl
 * Controller of the laruucheApp
 */
angular.module('laruucheApp')
  .controller('ChatroomBisCtrl', ["$rootScope", "$scope", "$routeParams", "Users", "Auth", "Messages", "Chatrooms", "$firebaseObject",'$mdSidenav', '$http',
    function ($rootScope, $scope, $routeParams, Users, Auth, Messages, Chatrooms, $firebaseObject,$mdSidenav, $http) {
      // any time auth state changes, add the user data to scope
      $rootScope.auth = Auth;
      $scope.user = '';
      $scope.chatroomName = '';
      $scope.chatroom = '';
      $scope.getUserName = '';
      $scope.getRoomName = '';
      $scope.ChatroomsList='';
      let chatrooms = Chatrooms.all;
      let chatRef = firebase.database().ref('chatrooms');

      const PUBLIC_KEY = '89689fe58d534335b4fc521ce8c8bb6e';
      const BASE_URL = 'https://api.giphy.com/v1/gifs/random?';
      const RATING = 'r';

      /*Get the room object*/
      $scope.ChatRoomObj = Chatrooms.getRoom($routeParams.id);
      console.log($scope.ChatRoomObj);

      chatrooms.$loaded().then(function () {
        $scope.chatroom = chatrooms.$getRecord($routeParams.id);
        $scope.messages = Messages.getPublicChatMessages($routeParams.id);
        $.each($scope.messages, function (index, value) {
          console.log(index);
        });
        $scope.getUserName = function (uid) {
          return Users.getDisplayName(uid);
        };
        $scope.getPhotoURL = function(uid){
          return Users.getPhotoURL(uid);
        }

      });

      $rootScope.auth.$onAuthStateChanged(function (firebaseUser) {
        $rootScope.firebaseUser = firebaseUser;
        $scope.getRoomName = function (uid) {
          return Chatrooms.getName(uid);
        };
        $scope.getActiveMessage = function (uidd) {
          if($rootScope.firebaseUser.uid==uidd){
            return 'activeUser'
          }
        };
        if (!$rootScope.firebaseUser) {
          $mdDialog.show({
            controller: 'AuthDialogCtrl',
            templateUrl: 'views/authDialog.html',
            parent: angular.element(document.body),
            targetEvent: event,
            clickOutsideToClose: true
          });
        }
        else {
          /*Retrieve User Data*/
          $scope.user = Users.getProfile(firebaseUser.uid);

          $scope.user.$loaded().then(function () {
            //Do all things when user is logged;
            $scope.ChatRoomObj.$loaded().then(function () {
              $scope.chatroomName = $scope.ChatRoomObj.name;

            });

          });

          /*Add user to the chatroom*/
          $scope.ChatroomsList = Users.getRooms(firebaseUser.uid);
        }
      });



      $scope.message = '';
      $scope.sendMessage = function () {
        if ($scope.message.length > 0) {
          let checkString = $scope.message.split(" ");
          if(checkString[0] == '/gif'){
            let gifSearch =  $scope.message.substr(4);
            $scope.message = '';
            $http.get(BASE_URL+'api_key='+PUBLIC_KEY+'&tag='+gifSearch+"&rating="+RATING)
              .then(function (response) {
                if(response.status == 200){
                  let url = response.data.data.fixed_height_downsampled_url;
                  $scope.messages.$add({
                    uid: $scope.user.$id,
                    body: url,
                    timestamp: firebase.database.ServerValue.TIMESTAMP,
                    type:'gif'
                  }).then(function () {
                    $scope.message = '';
                  });

                }

              });


          }
          else{
            $scope.messages.$add({
              uid: $scope.user.$id,
              body: $scope.message,
              timestamp: firebase.database.ServerValue.TIMESTAMP,
              type: 'text'
            }).then(function () {
              $scope.message = '';
            });
          }
        };
      };

      $scope.addRoomToUser = function () {
        let roomArray = [];
        let roomToAdd = $routeParams.id;
        let userRef = firebase.database().ref().child('users').child($rootScope.firebaseUser.uid).child('roomList');
        userRef.once('value').then(function (snapshot) {
          roomArray = snapshot.val();
          if(roomArray != null){
            let exist = roomArray.includes(roomToAdd);
            console.log(roomArray, exist);
            if(exist == false){
              roomArray.push(roomToAdd);
              userRef.set(roomArray);
            }
          }
          else{
            roomArray = [];
            roomArray.push(roomToAdd);
            userRef.set(roomArray);
          }

        });
      };

      $scope.enterChat = function (id) {
        $location.path('/chatroom/' + id);
      };


    }]);
