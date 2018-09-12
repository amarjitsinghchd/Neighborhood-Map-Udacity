#Neighborhood Map Project 

## Amarjit Singh 
 Second Submission Sep 11, 2018
 Updated per reviewer comments
 Initial Submmission Sep 7, 2018
 Udacity Full Stack Nano Degree Project 
 References: Udacity, Stackoverflow, FourSquare website,
 Google Maps API, javascript AJax calls
 file editor: sublime text
 browsers safari and Chrome
 

## Introduction 

This project is part of Full Stack Web Developement Course. This project focuses on using
Google Maps API for map and markers display and thirdparty API (Foursquare) for getting additional information.


The application does following things:

	a) Application html (Myneighborhood.html) open up Map with my favorite places of interest 
	b) The application uses fixed list of favorite places on startup and calls Four Square API to get address.
	c) It creates Maps and List of places on the main page. the list is collapsible navbar.
	c) User can filter the favorite places to focus on particular place/places of interest.
	d) Clicking on marker opens up Info Window on Map to  show you details of the favorite place
	e) User can click on the marker on google map or on the list to highlight the place of interest.
	f) Application also has option of autogenerating places of interest using Google and then FS to get the
		places of interest. Enter the new fav place and click enter to get new dynamic list.



## Application Inner Working

The application has preloaded 10 places of interest in San Francisco Area. Additionally on opening up html file,
the application calls FourSquare API to get the address information. It then creates markers and Info Windows on Google Maps. There is collapsible navbar on left that shows list of all places. there is filter that does string filter per user entered text to create a filtered list. the filter and filtered list are linked by knockout observable array and variable. The list is in turn mapped to markers on Google Match. Each Google Marker has ID that is tracked for linking the list to the markers. That is ko subscribed to filtered list for any changes.

There are 2 internal flags in the app.js file both set to true by default.

'''
use_FS = true;
use_FSAddress = true;
'''

use_FS 

true: when set to true follow this path: 
Use the Google Search API to find the place, use Google Geocode API to get the lat-long for places of interest typed by user, then use Four Square API to get 10 places of interest using FS API. It then creates list and markers. This flag is used for case when user wants to explore new area rather than using user defined fixed list of 10 places. Also, there is a flag for max_items to change the number of items to number other than 10.

false: when set to false, it uses google all the way for search, geocode and then 10 places of interest

'
use_FSAddress - Used only for preloaded neighbhood places of interest

true: When set to true, it takes the 10 preloaded places, send to FS API and get address and place id info from FS API. This info is used to create a InfoWindow for the markers.

false: When set to false, the 10 places will be loaded on map without calling any FS API. The static information stored in the appinit.js file will be used to load the map, markers and infowindows on Google Maps. No API other than Google Maps API. 
'

## Dependecies

a) jquery
b) Bootstrap - css and js
c) knockout.js

## Application Installation

a) download all files.
[Git Hub Download Link](https://github.com/amarjitsinghchd/Neighborhood-Map-Udacity.git)

b) Make sure all files follow the same directory structure
b) Open the MyNeighborhoodMap.html file. Enjoy the app.

## Application Organization

a) myneighborhoodmap.html file - Main program to launch app
b) app.js - main js program
c) appinit.js - preloaded places of interest
d) all dependencies - Bootstrap, ko, jquery
e) css - style.css for custom styling - mainly limiting the infowindow size and making sure body and html are 100% height - otherwise Google Maps do not display on browser.

