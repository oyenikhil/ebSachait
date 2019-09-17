/*global WildRydes _config*/

var WildRydes = window.WildRydes || {};
WildRydes.map = WildRydes.map || {};
var authToken;
(function rideScopeWrapper($) {

    function deleteUnicorn() {
        console.log('deleteUnicorn called');
        $.ajax({
            method: 'DELETE',
            url: _config.api.invokeUrl + '/ride',
            data: JSON.stringify({
                "RideId": "haha"
            }),
            headers: {
                Authorization: authToken
            },
            contentType: 'application/json',
            success: compRequest,
            error: function ajaxError(jqXHR, textStatus, errorThrown) {
                console.error('Error requesting ride: ', textStatus, ', Details: ', errorThrown);
                console.error('Response: ', jqXHR.responseText);
                console.error('An error occured when requesting your unicorn:\n' + jqXHR.responseText);
            }
        });
    }


    // Register click handler for #request button
    $(function onDocReady() {
        $('#signOut').click(function () {
            WildRydes.signOut();
            alert("You have been signed out.");
            window.location = "signin.html";
        });

        //$(WildRydes.map).on('pickupChange', handlePickupChanged);

    });

    function handleRequestClick(event) {
        var pickupLocation = WildRydes.map.selectedPoint;
        event.preventDefault();
        requestUnicorn(pickupLocation);
    }

    function displayUpdate(text) {
        $('#updates').append($('<li>' + text + '</li>'));
    }
}(jQuery));


var app = angular.module('myApp', []);
app.controller('myCtrl', function ($scope, $http) {

// mqtt code starts

$scope.hi = "hi";
    var AWS = require('aws-sdk');
    var AWSIoTData = require('aws-iot-device-sdk');
    var AWSConfiguration = require('./aws-configuration.js');

    console.log('Loaded AWS SDK for JavaScript and AWS IoT SDK for Node.js');

    //
    // Remember our current subscription topic here.
    //
    var currentlySubscribedTopic = 'test';

    //
    // Remember our message history here.
    //
    var messageHistory = '';

    //
    // Create a client id to use when connecting to AWS IoT.
    //
    var clientId = 'mqtt-explorer-' + (Math.floor((Math.random() * 100000) + 1));

    //
    // Initialize our configuration.
    //
    AWS.config.region = AWSConfiguration.region;

    AWS.config.credentials = new AWS.CognitoIdentityCredentials({
        IdentityPoolId: AWSConfiguration.poolId
    });

    //
    // Create the AWS IoT device object.  Note that the credentials must be 
    // initialized with empty strings; when we successfully authenticate to
    // the Cognito Identity Pool, the credentials will be dynamically updated.
    //
    const mqttClient = AWSIoTData.device({
        //
        // Set the AWS region we will operate in.
        //
        region: AWS.config.region,
        //
        ////Set the AWS IoT Host Endpoint
        host: AWSConfiguration.host,
        //
        // Use the clientId created earlier.
        //
        clientId: clientId,
        //
        // Connect via secure WebSocket
        //
        protocol: 'wss',
        //
        // Set the maximum reconnect time to 8 seconds; this is a browser application
        // so we don't want to leave the user waiting too long for reconnection after
        // re-connecting to the network/re-opening their laptop/etc...
        //
        maximumReconnectTimeMs: 8000,
        //
        // Enable console debugging information (optional)
        //
        debug: true,
        //
        // IMPORTANT: the AWS access key ID, secret key, and sesion token must be 
        // initialized with empty strings.
        //
        accessKeyId: '',
        secretKey: '',
        sessionToken: ''
    });

    //
    // Attempt to authenticate to the Cognito Identity Pool.  Note that this
    // example only supports use of a pool which allows unauthenticated 
    // identities.
    //
    var cognitoIdentity = new AWS.CognitoIdentity();
    AWS.config.credentials.get(function(err, data) {
        if (!err) {
            console.log('retrieved identity: ' + AWS.config.credentials.identityId);
            var params = {
                IdentityId: AWS.config.credentials.identityId
            };
            cognitoIdentity.getCredentialsForIdentity(params, function(err, data) {
                if (!err) {
                    //
                    // Update our latest AWS credentials; the MQTT client will use these
                    // during its next reconnect attempt.
                    //
                    mqttClient.updateWebSocketCredentials(data.Credentials.AccessKeyId,
                        data.Credentials.SecretKey,
                        data.Credentials.SessionToken);
                } else {
                    console.log('error retrieving credentials: ' + err);
                    alert('error retrieving credentials: ' + err);
                }
            });
        } else {
            console.log('error retrieving identity:' + err);
            alert('error retrieving identity: ' + err);
        }
    });

    //
    // Connect handler; update div visibility and fetch latest shadow documents.
    // Subscribe to lifecycle events on the first connect event.
    //
    window.mqttClientConnectHandler = function() {
        console.log('connect');
        document.getElementById("connecting-div").style.visibility = 'hidden';
        document.getElementById("explorer-div").style.visibility = 'visible';
        document.getElementById('subscribe-div').innerHTML = '<p><br></p>';
        messageHistory = '';

        //
        // Subscribe to our current topic.
        //
        mqttClient.subscribe(currentlySubscribedTopic);
    };

    //
    // Reconnect handler; update div visibility.
    //
    window.mqttClientReconnectHandler = function() {
        console.log('reconnect');
        document.getElementById("connecting-div").style.visibility = 'visible';
        document.getElementById("explorer-div").style.visibility = 'hidden';
    };

    //
    // Utility function to determine if a value has been defined.
    //
    window.isUndefined = function(value) {
        return typeof value === 'undefined' || typeof value === null;
    };

    //
    // Message handler for lifecycle events; create/destroy divs as clients
    // connect/disconnect.
    //
    window.mqttClientMessageHandler = function(topic, payload) {
        $scope.hi = payload.toString();
        console.log('message: ' + topic + ':' + payload.toString());
        messageHistory = messageHistory + topic + ':' + payload.toString() + '</br>';
        document.getElementById('subscribe-div').innerHTML = payload.toString();
    };

    //
    // Handle the UI for the current topic subscription
    //
    window.updateSubscriptionTopic = function() {
        var subscribeTopic = document.getElementById('subscribe-topic').value;
        document.getElementById('subscribe-div').innerHTML = '';
        mqttClient.unsubscribe(currentlySubscribedTopic);
        currentlySubscribedTopic = subscribeTopic;
        mqttClient.subscribe(currentlySubscribedTopic);
    };

    //
    // Handle the UI to clear the history window
    //
    window.clearHistory = function() {
        if (confirm('Delete message history?') === true) {
            document.getElementById('subscribe-div').innerHTML = '<p><br></p>';
            messageHistory = '';
        }
    };

    //
    // Handle the UI to update the topic we're publishing on
    //
    window.updatePublishTopic = function() {};

    //
    // Handle the UI to update the data we're publishing
    //
    window.updatePublishData = function() {
        var publishText = document.getElementById('publish-data').value;
        var publishTopic = document.getElementById('publish-topic').value;

        mqttClient.publish(publishTopic, publishText);
        document.getElementById('publish-data').value = '';
    };

    //
    // Install connect/reconnect event handlers.
    //
    mqttClient.on('connect', window.mqttClientConnectHandler);
    mqttClient.on('reconnect', window.mqttClientReconnectHandler);
    mqttClient.on('message', window.mqttClientMessageHandler);

    //
    // Initialize divs.
    //
    document.getElementById('connecting-div').style.visibility = 'visible';
    document.getElementById('explorer-div').style.visibility = 'hidden';
    document.getElementById('connecting-div').innerHTML = '<p>attempting to connect to aws iot...</p>';





























/*wildride code starts*/

    $scope.firstName = "John";
    $scope.lastName = "Doe";
    console.log($scope.firstName);

    // $scope.onPageLoad = function() {

    // }


    WildRydes.authToken.then(function setAuthToken(token) {
        if (token) {
            authToken = token;
            $scope.parsedAuthToken = $scope.parseAuthToken(authToken);
            $scope.cognitoUserID = $scope.parsedAuthToken.sub
            console.log('sub', $scope.cognitoUserID);
            $scope.getUnicorn();

        } else {
            window.location.href = '/signin.html';
        }
    }).catch(function handleTokenError(error) {
        alert(error);
        window.location.href = '/signin.html';
    });

    $scope.getUnicorn = function() {
        $http({
            method: "GET",
            url: _config.api.invokeUrl + '/mobilenumber',
            headers: {
                Authorization: authToken
            },
            params: {'sub': $scope.cognitoUserID}
        }).then(function mySuccess(response) {
            if(response.status == 200) {
                $scope.persons = response.data;
                console.log('persons', $scope.persons);
            }
        }, function myError(response) {
            console.log(response);
        });
    }

    $scope.postUnicorn = function () {
        console.log('post method called');
        $http({
            method: "POST",
            url: _config.api.invokeUrl + '/mobilenumber',
            headers: {
                Authorization: authToken
            },
            data: JSON.stringify({
                "mobileNumber": $scope.mobileNumber,
                "name": $scope.name,
                "sub": $scope.cognitoUserID
            }),
            contentType: 'application/json'
        }).then(function mySuccess(response) {
            if(response.status == 201) {
                $scope.getUnicorn();
            }
            console.log(response);
        }, function myError(response) {
            console.log(response);
        });
    }


    $scope.deletePerson = function(person) {
        console.log('delete method called');
        console.log('person', person);
        $http({
            method: "DELETE",
            url: _config.api.invokeUrl + '/mobilenumber',
            headers: {
                Authorization: authToken
            },
            data: JSON.stringify({
                "mobileNumber": person.mobileNumber,
                "sub": person.sub
            }),
            contentType: 'application/json'
        }).then(function mySuccess(response) {
            console.log('hi');
            if(response.status == 200) {
                $scope.getUnicorn();
            }
        }, function myError(response) {
            console.log(response);
        });
    }

    $scope.parseAuthToken = function(token) {
        var base64Url = token.split('.')[1];
        var base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        var jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        return JSON.parse(jsonPayload);
    }

    $scope.logout = function() {
        WildRydes.signOut();
        alert("You have been signed out.");
        window.location = "signin.html";
    }
});
