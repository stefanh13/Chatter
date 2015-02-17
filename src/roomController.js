ChatApp.controller('RoomController', function ($scope, $location, $rootScope, $routeParams, socket) {
	$scope.currentRoom = $routeParams.room;
	$scope.currentUser = $routeParams.user;
	$scope.currentUsers = [];
	$scope.errorMessage = '';
	$scope.messages = [];
	$scope.message = '';
	var objMessage = {
		roomName : "lobby",
		msg : $scope.message
		
	};

	var roomObj = {
		room: $scope.currentRoom,
		pass: undefined
	};
	socket.emit('joinroom', roomObj, function(success, reason){
		if(success){
			console.log("joinroom");
		}
		else{
			$scope.errorMessage = reason;
		}
	});

	$scope.sendMessage = function() {
		console.log($scope.message, "<-------");
		if($scope.message === ''){
			console.log("nothing");
		}
		else{ 
			objMessage.msg = $scope.message;
			//console.log(objMessage, "----");
			//console.log($routeParams.room, "---");
			socket.emit('sendmsg', objMessage);
		}
		$scope.message = "";
	};

	$scope.partRoom = function() {
		socket.emit('partroom', $scope.currentRoom);
		$location.path('/rooms/'+ $scope.currentUser);
	}

	$scope.kickUser = function() {

		var kickObj = {
			user: $scope.kickedUser,
			room: $scope.currentRoom
		};

		socket.emit('kick', kickObj, function(success){

			if(success){

			}
			else{
				$scope.errorMessage = "Invalid username";
			}
		});
	}
	
	socket.on('updatechat', function (roomName, msgHistory){
		$scope.roomName = roomName;
		$scope.msg = msgHistory;
		console.log("updatechat!!!!");
	});
	socket.on('cons', function (roomName, msgHistory){
		console.log("<--------cool");		
	})

	socket.on('updateusers', function (roomName, users, ops) {	
		$scope.currentUsers = users;
	});		
});
