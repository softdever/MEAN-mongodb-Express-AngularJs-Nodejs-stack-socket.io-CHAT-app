(function () {
    //'use strict';
    angular
        .module('users')
        .controller('AddContactCtrl', ['userService', 'authenticService', '$scope', '$q', '$timeout', DemoCtrl]);

    function DemoCtrl (userService, authenticService, $scope, $q, $timeout, $http) {

        console.log('Controller Contact');
        var self = this;
        var pendingSearch, cancelSearch = angular.noop;
        var cachedQuery, lastSearch;
        self.allContacts = loadContacts();
        //self.contacts = [self.allContacts[0]];
        self.asyncContacts = [];
        self.filterSelected = true;
        self.querySearch = querySearch;
        self.addContact = addContact;

        /**
         * Search for contacts; use a random delay to simulate a remote call
         **/

        function addContact(){


            var converUser = $scope.data.selectedUser; //contact or group currently active
            var currentUser = authenticService.getCurrentUser(); // user with session active

            console.log(converUser);
            if(self.asyncContacts.length == 1 && !converUser.isgroup){

                var selectedContact = self.asyncContacts[0]; // contact selected in search box

                if (!selectedContact.isgroup) {

                    if (currentUser._id == converUser.gotrequest){

                        converUser.idi = converUser.requestby;
                        converUser.namei = converUser.namereq;

                    } else {
                        converUser.idi = converUser.gotrequest;
                        converUser.namei = converUser.name;

                    }

                    if (currentUser._id == selectedContact.gotrequest){

                        selectedContact.idi = selectedContact.requestby;
                        selectedContact.namei = selectedContact.namereq

                    }else {
                        selectedContact.idi = selectedContact.gotrequest;
                        selectedContact.namei = selectedContact.name;
                    }

                    var newContact = {

                        isgroup : true,
                        //image : selectedContact.image.match(reg)[1], // apply match method of regex getting image name only
                        image : 'https://s3-us-west-1.amazonaws.com/chatcontacts/group.png',
                        name : 'Group',
                        namereq : null,
                        imagereq : null,
                        requestby : null,
                        userid : null,
                        members: [currentUser._id, converUser._id, selectedContact._id],
                        membersname : currentUser.name + ', ' + converUser.namei + ', ' + selectedContact.namei,
                        confirmed : true,
                        ids : [currentUser._id, converUser.idi, selectedContact.idi]

                    };

                    authenticService.createConversation.post(newContact, function (res, headers) {

                        var contact = res.conv;

                        //contact._lowername = contact.name.toLowerCase();
                        contact._lowername = contact.name ;

                        $scope.data.currentUser.conversations.push(contact);
                        authenticService.setCurrentUser($scope.data.currentUser);

                        //apply filter

                        self.asyncContacts = []; // clean search contacts after one is added

                    })
                }
            }
            else if(self.asyncContacts.length == 1 && converUser.isgroup){

                console.log('jellow');

                selectedContact = self.asyncContacts[0];

                if (currentUser._id == selectedContact.gotrequest){

                    selectedContact.idi = selectedContact.requestby;
                    //selectedContact.namei = selectedContact.namereq;

                } else {
                    selectedContact.idi = selectedContact.gotrequest;
                    //selectedContact.namei = selectedContact.name;
                }


                var infoContact = {

                    members : selectedContact._id,
                    membersname : converUser.membersname + ', ' + selectedContact.name ,
                    ids : [selectedContact.idi],
                    conv : converUser._id

                };


                authenticService.addToConv.post(infoContact, function (res, headers) {

                    if(res.success){
                        converUser.membersname = converUser.membersname + ', ' + selectedContact.name;
                        var currentGroupContacts = authenticService.getcurrentforGroupContacts();

                        console.log(currentGroupContacts);

                        var index = currentGroupContacts.map(function(e) { return e._id; }).indexOf(selectedContact._id);

                        currentGroupContacts.splice(index, 1);
                    }
                    // remove contacted added to list group contact

                    self.asyncContacts = [];

                })
            }
        }

        function querySearch (criteria) {

            //var currentContacts = authenticService.getCurrentUser();
            //currentContacts = currentContacts.conversations;
            var currentContacts = authenticService.getcurrentforGroupContacts();

            cachedQuery = criteria;


            //return cachedQuery ? self.allContacts.filter(createFilterFor(cachedQuery)) : [];
            return cachedQuery ? currentContacts.filter(createFilterFor(cachedQuery)) : [];
            //return cachedQuery ? self.allContacts : [];
        }

        /**
         * Create filter function for a query string
         */

        function createFilterFor(query) {

            var lowercaseQuery = angular.lowercase(query);

            return function filterFn(contact) {

                return (contact._lowername.indexOf(lowercaseQuery) != -1);
                //return true;
            };
        }

        function loadContacts(){

            //var contacts = $scope.data.currentUser.conversations;
            var contacts = authenticService.getCurrentUser();

            contacts = contacts.conversations;

            contacts.map(function (c, index){

                if(!c.isgroup){
                    var currentUser = authenticService.getCurrentUser(); // user with session active

                    if(currentUser._id == c.requestby){

                    }else{

                        c.name = c.namereq;
                        c.image = c.imagereq;
                    }

                    c._lowername = c.name.toLowerCase();
                }
                else {
                    c._lowername = c.name;
                }

                return c;
            });

            console.log('load all contacts');
            console.log(contacts);
            authenticService.setcurrentforGroupContactsStatic(contacts);

            return contacts;
        }
    }
})();