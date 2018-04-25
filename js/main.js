let restaurants,
	neighborhoods,
	cuisines
var map
var markers = [];






/**
 * Fetch neighborhoods and cuisines as soon as the page is loaded.
 */
document.addEventListener('DOMContentLoaded', (event) => {
	updateRestaurants()
	fetchNeighborhoods();
	fetchCuisines();
});

/**
 * Fetch all neighborhoods and set their HTML.
 */
const fetchNeighborhoods = () => {
	DBHelper.fetchNeighborhoods((error, neighborhoods) => {
		if (error) { // Got an error
			console.error(error);
		} else {
			self.neighborhoods = neighborhoods;
			fillNeighborhoodsHTML();
		}
	});
}

/**
 * Set neighborhoods HTML.
 */
const fillNeighborhoodsHTML = (neighborhoods = self.neighborhoods) => {
	const select = document.getElementById('neighborhoods-select');
	neighborhoods.forEach(neighborhood => {
		const option = document.createElement('option');
		option.innerHTML = neighborhood;
		option.value = neighborhood;
		select.append(option);
	});
}

/**
 * Fetch all cuisines and set their HTML.
 */
const fetchCuisines = () => {
	DBHelper.fetchCuisines((error, cuisines) => {
		if (error) { // Got an error!
			console.error(error);
		} else {
			self.cuisines = cuisines;
			fillCuisinesHTML();
		}
	});
}

/**
 * Set cuisines HTML.
 */
const fillCuisinesHTML = (cuisines = self.cuisines) => {
	const select = document.getElementById('cuisines-select');

	cuisines.forEach(cuisine => {
		const option = document.createElement('option');
		option.innerHTML = cuisine;
		option.value = cuisine;
		select.append(option);
	});
}

/**
 * Initialize Google map, used to be called from index.HTML.
 */
window.initMap = () => {

	let loc = {
		lat: 40.722216,
		lng: -73.987501
	};
	self.map = new google.maps.Map(document.getElementById('map'), {
		zoom: 12,
		center: loc,
		scrollwheel: false
	});


}

/**
 * Update page and map for current restaurants.
 */
const updateRestaurants = () => {
	const cSelect = document.getElementById('cuisines-select');
	const nSelect = document.getElementById('neighborhoods-select');

	const cIndex = cSelect.selectedIndex;
	const nIndex = nSelect.selectedIndex;

	const cuisine = cSelect[cIndex].value;
	const neighborhood = nSelect[nIndex].value;

	DBHelper.fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, (error, restaurants) => {
		if (error) { // Got an error!
			console.error(error);
		} else {
			resetRestaurants(restaurants);
			fillRestaurantsHTML();
		}
	})
}

/**
 * Clear current restaurants, their HTML and remove their map markers.
 */
const resetRestaurants = (restaurants) => {
	// Remove all restaurants
	self.restaurants = [];
	const ul = document.getElementById('restaurants-list');
	ul.innerHTML = '';

	// Remove all map markers
	self.markers.forEach(m => m.setMap(null));
	self.markers = [];
	self.restaurants = restaurants;
}

/**
 * Create all restaurants HTML and add them to the webpage.
 */
const fillRestaurantsHTML = (restaurants = self.restaurants) => {
	const ul = document.getElementById('restaurants-list');
	restaurants.forEach(restaurant => {
		ul.append(createRestaurantHTML(restaurant));
	});

	// ================== TRIGGER LAZY LOAD
	lazyLoadImages(); // lazy load images
	addMarkersToMap();
}

/**
 * Create restaurant HTML.
 */
const createRestaurantHTML = (restaurant) => {

	var currentRestaurantID = restaurant.id
	var currentFav = 'fav' + currentRestaurantID
	var currentURL = DBHelper.DATABASE_URL + '/' + currentRestaurantID

	const li = document.createElement('li');
	li.className = 'container-rest-details';

	const container_img = document.createElement('div');
	container_img.className = 'column';
	li.append(container_img);

	// PICTURE ELEMENT
	const picture = document.createElement('picture');
	container_img.append(picture);

	const picture_sourceThumb = document.createElement('source');
	picture_sourceThumb.media = '(max-width: 10rem)';
	picture_sourceThumb.dataset.srcset = DBHelper.imageUrlForRestaurant(restaurant) + '-128w.jpg'
	picture.append(picture_sourceThumb);


	const picture_sourceSmall = document.createElement('source');
	picture_sourceSmall.media = '(max-width: 30rem)';
	picture_sourceSmall.dataset.srcset = DBHelper.imageUrlForRestaurant(restaurant) + '-400w.jpg'
	picture.append(picture_sourceSmall);

	const picture_sourceBig = document.createElement('source');
	picture_sourceBig.media = '(min-width: 30rem)';
	picture_sourceBig.dataset.srcset = DBHelper.imageUrlForRestaurant(restaurant) + '-500w.jpg'
	picture.append(picture_sourceBig);

	// image: div img
	const image = document.createElement('img');
	image.className = 'lazy restaurant-img';
	image.alt = 'image of ' + restaurant.name + ' restaurant';
	image.src = 'img/image-placeholder.png'; //lazy load image
	image.dataset.src = DBHelper.imageUrlForRestaurant(restaurant) + '.webp';
	picture.append(image);

	const container_details = document.createElement('div');
	container_details.id = 'contRest' + currentRestaurantID
	container_details.className = 'column';
	li.append(container_details);

	const name = document.createElement('h3');
	name.innerHTML = restaurant.name;
	container_details.append(name);

	const neighborhood = document.createElement('p');
	neighborhood.innerHTML = restaurant.neighborhood;
	container_details.append(neighborhood);

	const address = document.createElement('p');
	address.innerHTML = restaurant.address;
	container_details.append(address);

	// FAVORITE FIELD
	const isFavorite = document.createElement('p')
	isFavorite.innerHTML = 'Favorite: ' + restaurant.is_favorite
	isFavorite.id = currentFav
	container_details.append(isFavorite)

	const restaurantID = document.createElement('p')
	restaurantID.innerHTML = 'ID: ' + restaurant.id
	container_details.append(restaurantID)

	const more = document.createElement('a');
	more.innerHTML = 'View Details';
	more.href = DBHelper.urlForRestaurant(restaurant);
	container_details.append(more)

	// FAVORITE BUTTON
	const favoriteMe = document.createElement('button')
	favoriteMe.innerHTML = 'Favorite Me'
	favoriteMe.className = 'favorite-button'
	// name the button id  just in case
	favoriteMe.id = 'favBtn' + restaurant.id
	//assign function to event
	favoriteMe.onclick = makeFavorite
	container_details.append(favoriteMe)

	// UNFAVORITE BUTTON
	const unFavoriteMe = document.createElement('button')
	unFavoriteMe.innerHTML = 'Unfavorite Me'
	unFavoriteMe.className = 'unfavorite-button'
	// name the button id  just in case
	unFavoriteMe.id = 'unfavBtn' + currentRestaurantID
	//assign function to event
	unFavoriteMe.onclick = MakeUNfavorite

	container_details.append(unFavoriteMe)

	function makeFavorite() {
		putFavorite()
		console.log('make favorite restaurant id:', currentRestaurantID);
	}

	function MakeUNfavorite() {
		putUNFavorite()
		console.log('make restaurant UNfavorite');
	}

	// FETCH THE DATA FROM JSON URL
	function postData(url, data) {

		return fetch(url, {
			method: 'PUT', //update field
			body: JSON.stringify(data), // must match 'Content-Type' header
			headers: {
				'content-type': 'application/json'
			}
		}).then(response => {
			response.json
		}).catch((error) => {
			console.log('Could not make favorite restaurant, error: ' + error);

		})
	}

	function putFavorite() {

		postData(currentURL, {
			// id: currentRestaurantID, // is not needed because it is filtered by the url above
			// update db
			is_favorite: true
		}).then(() => {
			// update page element
			document.getElementById(currentFav).innerHTML = 'Favorite updated: True'
			console.log('update fav field with value: ' + restaurant.is_favorite);
		}).then(data => {
			console.log('restaurant id ' + currentRestaurantID + ' is favorite now '); // JSON from `response.json()` call
		}).catch(error => {
			console.log(error);
		})

	}

	function putUNFavorite() {

		// TODO:update page
		postData(DBHelper.DATABASE_URL + '/' + currentRestaurantID, {
			// id: currentRestaurantID, // is not needed because it is filtered by the url above
			is_favorite: false // change field value to favorite
		}).then(() => {
			document.getElementById(currentFav).innerHTML = 'Favorite updated: False'
			console.log('update fav field with value: ' + restaurant.is_favorite);
		}).then(data => {
			console.log('restaurant id ' + currentRestaurantID + ' is UNfavorite now '); // JSON from `response.json()` call
		}).catch(error => {
			console.log(error);
		})

	}

	return li
}


/**
 * Favorite / unfavorite restaurants
 */
// forEach works on arrays not objects
// also split creates array, eg:
// var titles = document.getElementById('titles').value.split(',');
// https://www.sitepoint.com/deeper-dive-javascript-promises/

// the following code cannot be useb, brobably because the restaurant elements have not been created yet
// function TEST() {

// 	var buttonsArray = [].slice.call(document.querySelectorAll('favorite-button'))

// 	buttonsArray.forEach(button => {
// 		button.addEventListener('click', function () {
// 			console.log('make restaurant favorite');

// 		})
// 	});
// }




/**
 * Add markers for current restaurants to the map.
 */
const addMarkersToMap = (restaurants = self.restaurants) => {
	restaurants.forEach(restaurant => {
		// Add marker to the map
		const marker = DBHelper.mapMarkerForRestaurant(restaurant, self.map);
		google.maps.event.addListener(marker, 'click', () => {
			window.location.href = marker.url
		});
		self.markers.push(marker);
	});
}


// function is triggered inside fillRestaurantsHTML, after all content has been loaded
function lazyLoadImages() {
	console.log('starting lazy load');

	// arrays are iterable, so forEach can be used, but not Objects
	var lazyImages = [].slice.call(document.querySelectorAll('img.lazy'));

	if ('IntersectionObserver' in window) {
		console.log('IntersectionObserver activated for lazy images');

		let lazyImageObserver = new IntersectionObserver(function (entries, observer) {
			entries.forEach(function (entry) {
				if (entry.isIntersecting) {
					let lazyImage = entry.target;
					lazyImage.src = lazyImage.dataset.src;
					// lazyImage.srcset = lazyImage.dataset.srcset;
					console.log('lazy image: ' + lazyImage);

					console.log('IntersectionObserver changed src of lazy img');

					lazyImage.classList.remove('lazy');
					lazyImageObserver.unobserve(lazyImage);
				}
			});
		});

		lazyImages.forEach(function (lazyImage) {
			lazyImageObserver.observe(lazyImage);
		});
	} else {
		// Possibly fall back to a more compatible method here
		console.log('lazy load for images did not succeed');
	}
}


// ============LAZY LOAD MAP =======================================================
function loadScript(src, callback) {

	var script = document.createElement('script');
	if (callback) script.onload = callback;
	document.getElementsByTagName('head')[0].appendChild(script);
	script.src = src;
}

// callback=initMap
var mapUrl = 'https://maps.googleapis.com/maps/api/js?key=AIzaSyB3Lyq5LfH6rBtpR4SwP02qEdQA01CQfEc&libraries=places'

function initializeMap() {
	loadScript(mapUrl, function () {

		let loc = {
			lat: 40.722216,
			lng: -73.987501
		};
		map = new google.maps.Map(document.getElementById('map'), {
			zoom: 12,
			center: loc,
			scrollwheel: false
		})

		updateRestaurants()
	})
}

function lazyLoadMap() {
	console.log('starting lazy load');

	var lazyMap = [].slice.call(document.querySelectorAll('div#map'))

	if ('IntersectionObserver' in window) {
		console.log('IntersectionObserver activated for load map');

		// similar functionality http://walterebert.com/playground/wpo/google-maps/
		let lazyMapObserver = new IntersectionObserver(function (entries, observer) {
			entries.forEach((entry) => {

				if (entry.isIntersecting) {
					let lzMap = entry.target;

					// lzMap.classList.remove('mapHidden');
					// lzMap.classList.add('mapShow');

					initializeMap()
					lazyMapObserver.unobserve(lzMap);
					console.log('IntersectionObserver  map unobserved');
				}
			})
		})
		lazyMap.forEach(map => {
			lazyMapObserver.observe(map)
		})

	} else {
		// Possibly fall back to a more compatible method here
		console.log('lazy load map did not succeed');
	}
}

// ================= TEST BUTTONS =====================
document.getElementById('loadMap').addEventListener('click', function () {
	console.log('button load map clicked');
	// updateRestaurants()
	initializeMap()
})


document.getElementById('updateRest').addEventListener('click', function () {
	updateRestaurants()

})


// ============= service worker ===========
if ('serviceWorker' in navigator) {
	window.addEventListener('load', function () {
		navigator.serviceWorker.register('sw-min.js')
			.then(function (registration) {
					// Registration was successful 
					console.log('ServiceWorker registration successful with scope: ', registration.scope);
				},
				function (err) {
					// registration failed
					console.log('ServiceWorker registration failed: ', err);
				});
	});
}

// =============== lazy load ===================
// https://developers.google.com/web/fundamentals/performance/lazy-loading-guidance/images-and-video/
// DOMContentLoaded cannot be used in this case because the content is loaded after the event through js

// if (document.readyState === 'complete') {
// 	console.log('document is already ready, just execute code here');
// 	lazyLoadImages();
// } else {
// 	document.addEventListener('DOMContentLoaded', function () {
// 		console.log('document was not ready, place code here');
// 		lazyLoadImages();
// 	});
// }

// document.getElementById('lazyLoadButton').addEventListener('click', lazyLoadImages)

// let acyncMap = new Promise((resolve, reject) => {
// 	initializeMap()
// 	resolve('lazy load map resolved');

// }).then((mapResolved) => {
// 	console.log(mapResolved);

// 	// updateRestaurants();
// 	var message = 'restaurants updated'
// 	return message

// }).then((message) => {
// 	console.log(message);
// })

// trigger lazy load map