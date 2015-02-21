var ChatApp = angular.module("ChatApp", ['ngRoute', 'angularMoment', 'toaster']);

ChatApp.config(
	function($routeProvider){
		$routeProvider
		.when("/login", {templateUrl: "views/login.html", controller:"HomeController"})
		.when('/rooms/:user/', { templateUrl: 'Views/rooms.html', controller: 'RoomsController' })
		.when('/room/:user/:room/', { templateUrl: 'Views/room.html', controller: 'RoomController' })
		.otherwise({redirectTo: "/login"});
	}
);
ChatApp.factory('socket', function ($rootScope) {
  var socket = io.connect("http://localhost:8080");
  return {
    on: function (eventName, callback) {
      socket.on(eventName, function () {  
        var args = arguments;
        $rootScope.$apply(function () {
          callback.apply(socket, args);
        });
      });
    },
    emit: function (eventName, data, callback) {
      socket.emit(eventName, data, function () {
        var args = arguments;
        $rootScope.$apply(function () {
          if (callback) {
            callback.apply(socket, args);
          }
        });
      });
    }
  };
});
ChatApp.controller('HomeController', function ($scope, $location, $rootScope, $routeParams, socket, toaster) {

	$scope.username = '';
	$scope.errorMessage = '';

	$scope.login = function($event) {			
		
		if($event !== undefined){
			if($event.keyCode !== 13){
				return;
			}	
		}
		
		if ($scope.username === '') {
			toaster.pop('error', 'Error!', 'Please choose a username before continuing!');

		} else {
			socket.emit('adduser', $scope.username, function (available) {
				if (available) {
					$location.path('/rooms/' + $scope.username);
					$scope.username = '';
				} else {
					toaster.pop('error', 'Error!', 'This username is already taken!');

				}
			});			
		}


	};
});
ChatApp.controller('RoomController', function ($scope, $location, $rootScope, $routeParams, socket, toaster) {
	$scope.currentRoom = $routeParams.room;
	$scope.currentUser = $routeParams.user;
	$scope.currentTopic = '';
	$scope.currentUsers = [];
	$scope.errorMessage = '';
	$scope.successMessage = '';
	$scope.messages = [];
	$scope.message = '';
	$scope.privmsg = '';
	$scope.privateMessage = [];
	$scope.receiver = '';
	$scope.boolReceiver = false;
	$scope.showprivate = false;
	$scope.showMyMsg = false;
	$scope.showTopic = false;
	$scope.showPw = false;
	$scope.isPassSet = false;

	var objMessage = {
		roomName : $scope.currentRoom,
		msg : $scope.message
	};

	var roomObj = {
		room: $scope.currentRoom,
		pass: undefined
	};


	socket.emit('rooms');

	socket.emit('passSetTrueFalse', $scope.currentRoom);

	socket.on('recPassSetTrueFalse', function (bool){
		$scope.isPassSet = bool;
	});

	socket.emit('usersInRoom', $scope.currentRoom);


	$scope.createPassword = function($event) {

		if($event !== undefined){
			if($event.keyCode !== 13){
				return;
			}	
		}

		if($scope.setPW === undefined){
			toaster.pop('error', 'Error!', 'Please choose a password!');
			return;
		}
		else{
			var passwObj = {
				password: $scope.setPW,
				room: $scope.currentRoom
			};
			console.log("passwObj:", passwObj);
			
			socket.emit('setpassword', passwObj, function (success){
				if(!success){
					toaster.pop('error', 'Error!', 'Could not set password!');
				}
				else{
					$scope.isPassSet = true;
					toaster.pop('success', 'Well done!', 'Successfully changed the password');
				}
			});
			socket.emit('rooms');
			$scope.setPW = '';
		}

	};

	$scope.removePass = function(){
		var passwObj = {
			password: undefined,
			room: $scope.currentRoom
		};
		socket.emit('removepassword', passwObj, function (success){
			if(!success){ 
				toaster.pop('error', 'Error!', 'Could not remove password!');
			}
			else{
				$scope.isPassSet = false;
				socket.emit('rooms');
				toaster.pop('success', 'Well done!', 'Successfully removed the password');
			}
		});
		$scope.setPW = '';
	};

	$scope.sendMessage = function($event) {
		console.log($scope.isPassSet, "<--------------------------");
		if($event !== undefined){
			if($event.keyCode !== 13){
				return;
			}	
		}

		if($scope.messageForm.$valid){
		
			if($scope.message !== ''){ 
				
				objMessage.msg = $scope.message;
				socket.emit('sendmsg', objMessage);
				//Only empty input if it's valid.
				$scope.message = "";
			}

		}
		else{
			toaster.pop('error', 'Error!', 'Your message cannot be longer than 200 characters!');
		}
		
	};

	$scope.partRoom = function() {
		socket.emit('partroom', $scope.currentRoom);
		$location.path('/rooms/'+ $scope.currentUser);
	};

	$scope.showPrivateMsg = function(usernick){
		$scope.showprivate = true;
		$scope.receiver = usernick;
	};

	$scope.sendPrivate = function($event){
		
		if($event !== undefined){
			if($event.keyCode !== 13){
				return;
			}	
		}

		var privObj = {
			receiver: $scope.receiver,
			sender: $scope.currentUser,
			message: $scope.privmsg
		};
		
		$scope.showMyMsg = true;
		socket.emit('privatemsg', privObj, function (success){
			if(!success){
				//TODO: ERROR HANDLING
			}
		});
		$scope.privmsg = "";
	};


	$scope.kickUser = function() {

		var kickObj = {
			user: $scope.kickedUser,
			room: $scope.currentRoom
		};

		socket.emit('kick', kickObj, function (success, reason) {

			if(!success){
				toaster.pop('error', 'Error!', reason);
			}
		});
	};

	$scope.banUser = function() {

		var banObj = {
			user: $scope.bannedUser,
			room: $scope.currentRoom
		};

		socket.emit('ban', banObj, function (success, reason) {

			if(!success){
				toaster.pop('error', 'Error!', reason);
			}
		});
	};

	$scope.unBanUser = function() {

		var unBanObj = {
			user: $scope.unBannedUser,
			room: $scope.currentRoom
		};

		socket.emit('unban', unBanObj, function (success) {

			if(success){
				toaster.pop('success', 'YES!', 'Successfully unbanned ' + unBanObj.user);
			}
			else{
				toaster.pop('error', 'Error!', 'Unban unsuccessfull!');
			}
		});
	};

	$scope.opUser = function () {
		var opObj = {
			user: $scope.oppedUser,
			room: $scope.currentRoom
		};
		socket.emit('op', opObj, function (success, reason) {

			if(!success){
				toaster.pop('error', 'Error!', reason);
			}
		});
	};

	$scope.deOpUser = function () {
		var deOpObj = {
			user: $scope.deOppedUser,
			room: $scope.currentRoom
		};
		
		socket.emit('deop', deOpObj, function (success, reason) {
			if(!success){
				toaster.pop('error', 'Error!', reason);
			}	
		});
	};

	$scope.showPass = function () {
		
		$scope.showPw = !$scope.showPw;
	};

	$scope.showTop = function () {
		
		$scope.showTopic = !$scope.showTopic;
	};

	$scope.setTopic = function ($event) {
		
		if($event !== undefined){
			if($event.keyCode !== 13){
				return;
			}	
		}

		if($scope.topicName === undefined){
			toaster.pop('error', 'Error!', 'Topic cannot be empty!');
			return;
		}

		var topicObj = {
			topic: $scope.topicName,
			room: $scope.currentRoom
		};

		socket.emit('settopic', topicObj, function (success) {

			if(!success){
				toaster.pop('error', 'Error!', 'Only admins can set a topic!');
			}

		});

		$scope.topicName = '';
	};

	$scope.disconnUser = function () {

		socket.emit('disco-nect');
		socket.emit('users');
		$location.path('/login');
	};

	socket.on('rec_notification', function (msgObj){
		if($scope.currentUser === msgObj.receiver){
			toaster.pop('info', 'Mail!', "You've got mail from " + msgObj.sender);
		}
	});

	socket.on('updatechat', function (roomName, msgHistory){
		$scope.roomName = roomName;
		$scope.msg = msgHistory;
	});

	socket.on('updateusers', function (roomName, users, ops) {	

		if($scope.currentRoom === roomName){
			$scope.currentUsers = users;
		}

		if($scope.currentUser === ops[$scope.currentUser]){
			$scope.op = true;
		}
		else{
			$scope.op = false;
		}
	});

	socket.on('kicked', function (room, kickedUser, admin){

		if($scope.currentUser === kickedUser){
			$location.path('/rooms/'+ $scope.currentUser);
		}
		else if($scope.currentUser === admin){
			
			toaster.pop('success', 'ROUNDHOUSE!', 'Successfully kicked ' + kickedUser);
		}
	});

	socket.on('banned', function(room, bannedUser, admin){

		if($scope.currentUser === bannedUser){
			$location.path('/rooms/'+ $scope.currentUser);
		}
		else if($scope.currentUser === admin){
			
			toaster.pop('success', 'YES!', 'Successfully banned ' + bannedUser);

		}
	});

	socket.on('opped', function (room, oppedUser, admin) {

		if($scope.currentUser === admin){
			
			toaster.pop('success', 'YES!', 'Successfully opped ' + oppedUser);
		}
		else if($scope.currentUser === oppedUser){
			$scope.op = true;
			toaster.pop('success', 'YES!', 'You were opped by ' + admin + ' CONGRATULATIONS!');
		}
	});

	socket.on('deopped', function (room, deOppedUser, admin) {

		if($scope.currentUser === admin){
			
			toaster.pop('success', 'YES!', 'Successfully deopped ' + deOppedUser);
		}
		else if($scope.currentUser === deOppedUser){
			$scope.op = false;
			toaster.pop('error', 'NO!', 'You were deopped by ' + admin + ', SORRY:(');

		}
	});

	socket.on('servermessage', function(msg, room, user, ops){

		if(user === $scope.currentUser)
		{
			if(msg === "join"){
				if(angular.equals(ops, {})){
					var opObj = {
						user: $scope.currentUser,
						room: $scope.currentRoom
					};
					console.log(opObj);
					socket.emit('op', opObj, function (success, reason) {

						if(!success){
							
							toaster.pop('error', 'Error!', reason);
						}
					});
				}
			}
			
		}
	});

	socket.on('recv_privatemsg', function (sender, msgObj){
		//console.log("RecPrivate---sender->", sender, "--msgObj-->", msgObj);
		$scope.boolReceiver = true;
		$scope.username = sender;
		$scope.privateMessage = msgObj;
	});	

	socket.on('updatetopic', function (room, topic, admin) {

		if($scope.currentRoom === room){
			$scope.currentTopic = topic;
		}
	});
});

ChatApp.controller('RoomsController', function ($scope, $location, $rootScope, $routeParams, socket, toaster) {
	// TODO: Query chat server for active rooms
	$scope.rooms = {};
	$scope.users = [];
	$scope.currentUser = $routeParams.user;
	$scope.showInput = false;
	$scope.errorMessage = '';
	$scope.roomObj = [];


	socket.on('roomlist', function(list){		
		$scope.rooms = Object.keys(list);
		//console.log($scope.rooms);			
	});

	socket.emit('rooms');
	socket.emit('users');

	$scope.showInp = function () {
		$scope.showInput = !$scope.showInput;
	};

	$scope.createRoom = function($event){
		if($event !== undefined){
			if($event.keyCode !== 13){
				return;
			}	
		}

		if($scope.roomName === undefined){
			
			toaster.pop('error', 'Error!', 'Please choose a room name');
		}
		else{
			var obj = {
				room: $scope.roomName,
				pass: undefined
			};
			socket.emit('joinroom', obj  ,function (success, reason) {
				if (success){
					$location.path('/room/' + $scope.currentUser + '/' + obj.room);
				}
				else{
					toaster.pop('error', 'Error!', reason);
				}
			});
		}

		$scope.roomName = '';
	};

	$scope.joinRoom = function(currRoom, roomPassword, $event){
		
		if($event !== undefined){
			if($event.keyCode !== 13){
				return;
			}	
		}

		var obj = {
			room: currRoom,
			pass: roomPassword
		};
		socket.emit('joinroom', obj, function (success, reason) {
			if(success){
				$location.path('/room/' + $scope.currentUser + '/' + obj.room);
			}
			else{
				// toaster.clear();
				toaster.pop('error', 'Error!', reason);
			}
		});

		$scope.roomPassword = '';
	};

	$scope.disconnUser = function () {

		socket.emit('disco-nect');
		socket.emit('users');
		$location.path('/login');
	};

	socket.on('roomlist', function(list){
		$scope.roomObj = list;
		$scope.rooms = Object.keys(list);
				
	});

	socket.on('userlist', function (users) {
		$scope.users = users;
	});

	socket.on('servermessage', function(msg, room, kickedUser){

		if(kickedUser === $scope.currentUser)
		{
			if(msg === "kick"){
				
				toaster.pop('error', 'You have been kicked! Out of ' + room);
			}
			else if(msg === "ban"){
				toaster.pop('error', 'NOOOOOOO!', 'You have been banned! From ' + room);
			}	
		}
	});
});





