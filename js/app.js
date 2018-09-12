
"use strict";

  // Storing all map markers in Global as need to clear them
    // when Favorite place is changed on map
  //-------------------------------------------
    // Google Maps Related variables and Stuff
    //-------------------------------------------

   var markers= [];
   var infoWindows = [];
   var marker_id = 0;
   var vm;

    var mouseoverListeners = [];
    var map, bounds;
    var activeInfoWindow;
    let max_items = 10;

    // This flag when set to true allows use of Four Square API for places
    // otherwise it is Google Place
    // Four Square has sandbox daily limit of 50 places. so
    // limit gets reached after only 5 attempts with 10 places each

    let use_FS = true;

    // Use FS API is project requirement. in addtion to Google maps for display
    // setting this flag to false will voilate that
    let use_FSAddress = true;

    // Four Square APIs. FS has Places API just like Google
    // It looks better database. It can replace Google Places
    // API to build the InfoWindow for each marker.
    // Still using Goecode from Google Maps for initial
    // conversion of name/text to place with Lat/Long
    // Is Client Secret ok to expose here on JS for FS? Shall it
    // be more server side implemenation than JS?

    var FS_ClientID = "RMPKQ2YN20KWXREUOUNR5JXXYW21PN0MEJYLOILWXAIHTL1L";
    var FS_Clientsecret = "KQKR1XRKOTFAPE5ZNWJLWSM3YJ50ZGDNZ40ONCSZKMW2WQLG";

    //Model


    //my View Model
  var myViewModel = function() {

     
      var self = this;
      self.googlesearch =  ko.observable("Manhattan");

      self.filterText = ko.observable("");
      //self.markerslist = ko.observableArray(iplaces);
      self.markerslist = ko.observableArray([]);

//self.filteredlist = ko.observableArray([]);

      self.markerToAdd = ko.observable("");
      self.addMarker = function() {
        if (this.markerToAdd() !== "") {
            this.markerslist.push(this.markerToAdd());
            this.markerslist().id = this.markerslist().length-1;
            this.markerToAdd(""); // Clears the text box, because it's bound to the "markerToAdd" observable
          }
        }; 
  
    self.filteredlist = ko.computed(function(){
          var ilist = [];
          //console.log(self.markerslist());
          //console.log(self.markerslist()[0].name);
          self.markerslist().forEach(function(imarkerlist){
            if (imarkerlist.name.toLowerCase().includes(self.filterText().toLowerCase())) {
                ilist.push(imarkerlist);
                ilist.id = imarkerlist.id;
              } else {
              }
          });
          //return self.markerslist();
          return ilist;
      }).extend({ deferred: true });

// Filteredlist is deferred update so as allow all change get done before this computed var 
// get updated. Without this, when I do removeall or single update, it is ko computed. It casues error also
// when new lists is being prepared by google search

      self.filterText.subscribe(function() {
          //console.log("filter subscribe");
          //console.log(self.filterText());
          //console.log(self.markerslist());
          for (var i =0; i < self.markerslist().length; i++)
            {
              if (self.markerslist()[i].name.toLowerCase().includes(self.filterText().toLowerCase())) {
                  markers[i].setMap(map);
                } else {
                  markers[i].setMap(null);
                }
            }
          });

      //self.markerslist.push(iplaces);
      //self.filteredlist.push(iplaces);
      //console.log(iplaces);
      //console.log(filteredlist);

      self.displayMarker = function(item) {
        /*get current item index*/
        //console.log(item);
        //console.log(item.id);
        
        //var context = ko.contextFor(event.target);
        //var index = context.$index();
        //var markerindex = vm.filteredlist()[index].id;
        //console.log(index);
        //console.log(markerindex);
        
        mapDisplayMarker(markers[item.id], infoWindows[item.id]);
      };


      self.searchPlace = function() {
        searchGoogleplace(self.googlesearch);
      };

};
// end vm new way

vm = new myViewModel();
ko.applyBindings(vm);
// End View Model here

// myViewModel.myFavplace("Golden Gate");
 // Create variable vm for model.
 // 2 Important things:
 // -- creating variable allows the ability to access VM functions like vm.functioname
 // -- also need to declare vm as function for allows the access
 // -- basic observable model did not work for doing this job. That is ok for simple linking the
 //    the html with the variable and automatic updating etc.


/*
// This was initialized included in Markers Load but
// ko did not compute as markers are async
*/
 

function initializeMarkerLists(iplace){
     vm.markerToAdd({
            name: iplace.name,
            id: iplace.id,
            cat: iplace.cat,
            lat: iplace.lat,
            lng: iplace.lng,
            placeid: iplace.placeid,
            address: iplace.address,
            url: iplace.url,
          });
    vm.addMarker();
}

//  FS - Input = Lat long and o/p is address from FS API.
// orginal plan was done with dynamic api. Left that functionality
// added the address option from FS API
// Google maps must be initiliazed before this
function Initialize() {
if (use_FSAddress === true){
  // call FS Venue Search API. get the LL from user given here
  // and get venue address from FS and update myplaces. Overwrite user myplaces address
  FS_VenueAddress();

} else {
  // use defauult user address and create markers
   for (var i = 0; i < myplaces.length && i < max_items; i++ ) {
          initializeMarkerLists(myplaces[i]);
          createMarker(myplaces[i]);
      }
  
}
}
//console.log("List check");
//console.log(vm.markerslist());
//vm.markerslist.valueHasMutated();
//console.log(vm.filteredlist());    

function initMap() {
      // Constructor creates a new map - only center and zoom are required.
        var myLatlng = new google.maps.LatLng(myplaces[0].lat, myplaces[0].lng);
        map = new google.maps.Map(document.getElementById('map'), { 
          center: myLatlng,
          zoom: 14
        }
        );
        // clear the markers bounds to empty
      bounds = new google.maps.LatLngBounds();

        activeInfoWindow = new google.maps.InfoWindow();
        Initialize();
      }


  function  initialMarkersLoad(){
        // This will use Foursquare or Google API depending upon
        // Flag setting
        // Use to get place details.

      //clearMarkers();
      infoWindows = [];
      markers = [];
      //filteredlist = [];
      //vm.markerslist.removeAll();

      for (var i = 0; i < myplaces.length && i < max_items; i++ ) {
            createMarker(myplaces[i]);
        }
      }


// This is called when user want to search places
// in new area rather than fixed ilist provided

   function searchGoogleplace(iplace) {
      var service;
      var request = {
      //query: myViewModel.myFavplace(),
      // Some search fields can be deleted to optimize response. Left here
      // for reference for now
      query: iplace(),
      fields: ['photos', 'formatted_address', 'name', 'rating', 'opening_hours', 'geometry'],
      };

      service = new google.maps.places.PlacesService(map);
      service.findPlaceFromQuery(request, googlesearchcallback);
     }

    function googlesearchcallback(results, status) {
      var geocoder;
      var mysearch = {
        name: "unknown",
        lat: 0.0,
        lng: 0.0
      };

      if (status == google.maps.places.PlacesServiceStatus.OK) {

          clearMarkers();
          myplaces = [];

          //console.log(results[0].formatted_address);
          geocoder = new google.maps.Geocoder();

          geocoder.geocode( { 'address': results[0].formatted_address}, function(georesults, geostatus) {
            if (geostatus == 'OK') {
              mysearch.name = georesults[0].address_components[0].long_name;
              //mysearch.id = georesults[0].place_id;
              //mysearch.cat = georesults[0].types[0];
              mysearch.lat = georesults[0].geometry.location.lat();
              mysearch.lng = georesults[0].geometry.location.lng();

              map.setCenter(georesults[0].geometry.location);
              //console.log(georesults[0]);

              //createMarker(georesults[0].geometry.location);
               //createMarker(georesults[0]);

               // Empty the observed Array of marker list in View Model.
               // Here VM is programtically updated vs from html view as
               // seen in most ko examples. Usually functions are called with VM from View
               //vm.markerslist.removeAll();

                // Based on Flag Setting of use_FS
                // Google Places or FourSquare places
                // Search will be used. For Udacity project
                // use FourSquare
                if (use_FS === true){
                  api_FSplaces(mysearch);
                } else {
                  api_Googleplaces(mysearch);
                }

              } else {
                alert('Google Maps Geocode was not successful for the following reason: ' + geostatus);
                    }

            });
          }
          else {
            alert("No such place found by Google Guru. Chances are such a place does not exist. Please search new place. : " + status);
          }
        return;
      }

  function api_Googleplaces(iplace){
    service = new google.maps.places.PlacesService(map);

    var myLatlng = new google.maps.LatLng(iplace.lat,iplace.lng);
              request = {
                          //location: mylocation.location,
                          location: myLatlng,
                          radius: 5000
                        };
                service.nearbySearch(request, googleplacescallback);
  }

   function googleplacescallback(results, status) {

    var venue_name, venue_cat, venue_id, venue_lat, venue_lng, venue_url;

      if (status == google.maps.places.PlacesServiceStatus.OK) {

          clearMarkers();
          myplaces = [];
          currentplace = "";

          //ko.ignoreDependencies(vm.filteredlist, vm);

          vm.markerslist.removeAll();
      
          // Remove the filter if any
          vm.filterText('');
          
          bounds = new google.maps.LatLngBounds();


          for (var i = 0; i < results.length && i < max_items; i++) {
            //var iplaceitem = new PlaceItem();
            //iplaceitem.name = results[i].name;

            //Placeitems.addPlace(iplaceitem);

            venue_name = results[i].name;
            venue_id = results[i].place_id;
            venue_cat = results[i].types[0];
            venue_lat = results[i].geometry.location.lat();
            venue_lng = results[i].geometry.location.lng();
            venue_url = "";

            currentplace  = {
                name: venue_name,
                id: i,
                placeid: venue_id,
                cat: venue_cat,
                lat: venue_lat,
                lng: venue_lng,
                address: "",
                url: venue_url,
                source: "Google"
              };

            myplaces.push(currentplace);
            initializeMarkerLists(myplaces[i]);
            createMarker(myplaces[i]);
      }
           
        } else {
                  alert('Sorry! No cool places around the area you selected: ' + status);
                    }

      }

    // ===============================================================================
    // Four Square Place of Interest Search
    // ===============================================================================

    function api_FSplaces(iplace){

      var venue_add, venue_name, venue_cat, venue_id, venue_lat, venue_lng, venue_url, fs_url;
      var currentplace;
          
      venue_url= "";
      fs_url = 'https://api.foursquare.com/v2/venues/explore?client_id=' + 
       FS_ClientID + '&client_secret=' +FS_Clientsecret + '&v=20180831&ll=' + 
         iplace.lat + ',' + iplace.lng +'&radius=5000&limit=' + max_items;

      //alert(fs_url);
      //console.log("test fsurl");
      //console.log(fs_url);

      jQuery.getJSON(fs_url,function(data) {
        // Code for handling API response
          //console.log(data);

          clearMarkers();
          myplaces = [];
          vm.markerslist.removeAll();
            // Remove the filter if any
          vm.filterText('');

           // clear the markers bounds to empty
          bounds = new google.maps.LatLngBounds();

          //vm.filteredlist.removeAll();

      for (var i = 0; i < data.response.groups[0].items.length; i ++) {

          venue_name = data.response.groups[0].items[i].venue.name;
          venue_id = data.response.groups[0].items[i].venue.id;
          venue_cat = data.response.groups[0].items[i].venue.categories[0].name;
          venue_lat = data.response.groups[0].items[i].venue.location.lat;
          venue_lng = data.response.groups[0].items[i].venue.location.lng;
          venue_add = data.response.groups[0].items[i].venue.location.formattedAddress;

          currentplace = {
            name: venue_name,
            id: i,
            placeid: venue_id,
            cat: venue_cat,
            lat: venue_lat,
            lng: venue_lng,
            url: "",
            address: venue_add,
            source: "FourSquare"
          };
          
          myplaces.push(currentplace);
          initializeMarkerLists(myplaces[i]);
          createMarker(myplaces[i]);
        }

       }).fail(function(e){
        alert("Problem getting info from FourSquare API server. Try again latter" + e);
       });
   }

  /// This function not used current and AJAX callbacks not working
  // FS limits photos etc. NOt in scope. removed   

/*
function FS_url(){

    fs_url2 =  fs_url = 'https://api.foursquare.com/v2/venues/'+venue_id + '/photos?' + 
            'client_id=' + FS_ClientID + '&client_secret=' +FS_Clientsecret + '&v=20180831' +
            '&limit=1' ;
       

        venue_url = jQuery.getJSON(fs_url2).done(function test({ return get_FS_url3() });


          function(data) {
          venue_url = data.response.photos.items[0].prefix + 'width' + data.response.photos.items[0].width +
           data.response.photos.items[0].suffix;

          currentplace.url = venue_url;

          Update_FSplaces(currentplace);

          console.log(data);
          console.log(currentplace);          
}
*/

/* --------------------------------------------------------------------------------- */
/* --------------------------------------------------------------------------------- */

// This get address for all intialized loaded places for use
function FS_VenueAddress(){
     for (var i = 0; i < myplaces.length && i < max_items; i++ ) {
  
          api_FSvenueSearch(myplaces[i]);
}
}

function update_FSaddress(iplace, address){
    
    iplace.placeid = address.placeid;
    iplace.address = address.address;
    iplace.source = address.source;
    iplace.id = marker_id;
    initializeMarkerLists(iplace);
    createMarker(iplace);
    marker_id +=1;
  }

  function api_FSvenueSearch(iplace){

      var iplace_index, venue_address, venue_id, fs_url;
     
      fs_url = 'https://api.foursquare.com/v2/venues/search?client_id=' + FS_ClientID + '&client_secret=' +FS_Clientsecret + '&v=20180831&ll=' + iplace.lat + ',' +
       iplace.lng + '&intent=checkin' + '&radius=100&limit=' + 1;
       
      
       iplace_index = iplace.id;

         jQuery.getJSON(fs_url).done(function(data) {

           // Code for handling API response
           // Call Function so as get the data accessible
           // the JSON / AJAX loop

          var tempaddress = "";
       
          venue_id = data.response.venues[0].id;
          venue_address = data.response.venues[0].location.formattedAddress[0] + "," +
          data.response.venues[0].location.formattedAddress[1] + "," +
          data.response.venues[0].location.formattedAddress[2] ;
           tempaddress = {
            address: venue_address,
            source: "FourSquare",
            placeid: venue_id,
          };
          //myplaces[i] = venue_id;
          //console.log(myplaces[i]);
        update_FSaddress(iplace, tempaddress, iplace_index);
        
      }).fail(function(e) {
        // Code for handling errors
        alert("Problem getting info from FourSquare API server. Try again latter" + e);
        //return null;
        });
  }


function clearMarkers(){

    
    for (var i = 0; i < markers.length; i++) {
      if (markers[i] && markers[i].setMap) {
          markers[i].setMap(null);
        }
      }
      markers = [];
      infoWindows = [];
    }

function createMarker(iplace) {

      var myLatlng = new google.maps.LatLng(iplace.lat,iplace.lng);

      var marker = new google.maps.Marker({
                    map: map,
                    position: myLatlng,
                    title: iplace.name
                });

      markers.push(marker);
      
      bounds.extend(myLatlng);
      //map.setCenter({lat: markers[0].lat, lng: markers[0].lng});
        map.fitBounds(bounds);

      var contentString = "<div class = 'infoWindow'>";
      contentString += "<div><h6>" + iplace.name + "</h6></div>";

      contentString += "<div> Category: " + iplace.cat + "</div>";
      
      //iplace.url= "javascript:void(0)";
      if (iplace.url !== "") {
      contentString += "<div><a href=" + iplace.url  + " target='_blank' >" + iplace.name + "</a></div>";
      }
      contentString += "<hr>";
      contentString += "<div>";
      contentString += "<div>"+ "Address: " + iplace.address + "</div>";
      contentString += "</div>";
      contentString += "<hr>";
      
      contentString += "<div>"+ "Source: " + iplace.source + "</div>";

      contentString += "</div>";
      
      var infowindow = new google.maps.InfoWindow({
          content: contentString
        });

      infoWindows.push(infowindow);
     
      marker.addListener('click', function() {
                      mapDisplayMarker(this, infowindow);

                  //          infowindow.open(map, marker);
                  });
      
      /* disable Mouseover listener as it does not meet required
      spec. It is only mouse click
      marker.addListener('mouseover', function(){
                      mapDisplayMarker(this, infowindow);
                  });
      */
      /*
      marker.addListener('mouseout', function(){
                      mouseoutMarker(this, infowindow);
                  });
      */
    }



 function mapDisplayMarker(mymarker, myinfowindow){

  /*
  if (activeInfoWindow !== undefined) {
    activeInfoWindow.close();
  }
  */
   activeInfoWindow.close();

  if (mymarker !== null){

    // This was to center the map on clicked marker. Diabled as irritating
    // to eye
    /*
    var ilatlng = mymarker.getPosition(); // returns LatLng object
    map.setCenter(ilatlng);
    */
    mymarker.setAnimation(google.maps.Animation.BOUNCE);
    setTimeout((function() {
            mymarker.setAnimation(null);
          }), 2000);
        }
    myinfowindow.open(map, mymarker);

    /* attempting to add click and mouseover behavior
    google.maps.event.addListener(myinfoWindow,'closeclick',function(){
         mymarker.addListener('mouseout', function(){
                      mouseoutMarker(this, myinfowindow);};
      });
    */


   // Previoulsy removed mouseour listener when marker clicked

 //removes the marke
    activeInfoWindow = myinfowindow;

  }

// get map into view when u have 2 windows on small screens
var elmnt = document.getElementById("map");
  elmnt.scrollIntoView();


 function mouseoutMarker(mymarker, myinfowindow){

    if (mymarker !== null){
    myinfowindow.close();
      }
  }

 function centerMap(iplace){
  var myLatlng;
  myLatlng = new google.maps.LatLng(iplace.lat,iplace.lng);
  map.center(myLatlng);
}


function getFocus() {           
  document.getElementById("map").focus();
}

 function googleMapsError() {

  alert("Error Connecting to Google Maps. Please try later. Check connectivity and reload page.");
}



/*
 $(document).ready(function() {
    alert( "ready!" );
    searchPlace();
});
*/
