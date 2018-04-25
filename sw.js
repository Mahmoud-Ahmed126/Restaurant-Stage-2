var dataUrl = 'http://localhost:1337/restaurants'
var CACHE_NAME = 'cache-v4';
var urlsToCache = [
	'/',
	'.',
	'img/1.jpg',
	'img/2.jpg',
	'img/3.jpg',
	'img/4.jpg',
	'img/5.jpg',
	'img/6.jpg',
	'img/7.jpg',
	'img/8.jpg',
	'img/9.jpg',
	'img/1-128w.jpg',
	'img/2-128w.jpg',
	'img/3-128w.jpg',
	'img/4-128w.jpg',
	'img/5-128w.jpg',
	'img/6-128w.jpg',
	'img/7-128w.jpg',
	'img/8-128w.jpg',
	'img/9-128w.jpg',
	'img/1-400w.jpg',
	'img/2-400w.jpg',
	'img/3-400w.jpg',
	'img/4-400w.jpg',
	'img/5-400w.jpg',
	'img/6-400w.jpg',
	'img/7-400w.jpg',
	'img/8-400w.jpg',
	'img/9-400w.jpg',
	'img/1-500w.jpg',
	'img/2-500w.jpg',
	'img/3-500w.jpg',
	'img/4-500w.jpg',
	'img/5-500w.jpg',
	'img/6-500w.jpg',
	'img/7-500w.jpg',
	'img/8-500w.jpg',
	'img/9-500w.jpg',
	'img/1.webp',
	'img/2.webp',
	'img/3.webp',
	'img/4.webp',
	'img/5.webp',
	'img/6.webp',
	'img/7.webp',
	'img/8.webp',
	'img/9.webp',
	'index.html',
	'restaurant.html',
	'css/allStyles.css',
	// 'js/dbhelper.js',
	// 'js/main.js',
	// 'js/restaurant_info.js',
	'js/allMain.min.js',
	'js/allRestaurant.min.js',
	dataUrl
];


self.addEventListener('install', function (event) {
	// Perform install steps
	event.waitUntil(
		caches.open(CACHE_NAME)
			.then(function (cache) {
				console.log('Opened cache');
				return cache.addAll(urlsToCache);
			})
	);
});


self.addEventListener('fetch', function (event) {
	/////////// temp fix for only-if-cached bug
	if (event.request.cache === 'only-if-cached' && event.request.mode !== 'same-origin') {
		return;
	}
	////////// end of only-if-cached fix
	

	event.respondWith(
		caches.match(event.request)
			.then(function (response) {

				if (event.request.url == dataUrl) {
					console.log('fetching data url:' + event.request.url)


					// ==========indexedDB================
					const dbName = 'restaurantDB'
					const dbVersion = 8

					// Create/open database
					var request = indexedDB.open(dbName, dbVersion);

					request.onerror = function (event) {
						console.log('indexedDB error: ' + this.error);
					};

					// ============= ON SUCCESS ================
					request.onsuccess = function (event) {
						console.log('Database initialised succesfully');

						// store the result of opening the database in the db variable.
						var db = event.target.result;

						db.onerror = function (event) {
						// Generic error handler for all errors targeted 
						// at this database's requests!
							console.log('Database error: ' + event.target.errorCode);
						};

						// open a read/write db transaction, ready for adding the data
						var transaction = db.transaction(['restaurants'], 'readwrite');

						// call an object store that's already been added to the database
						var objectStore = transaction.objectStore('restaurants');

						fetch(dataUrl).then(function (response) {
							console.log('data url fetched');
							console.log(response);

							return response.json()
						}).then(function (data) {
							console.log('data: ' + data);

							// transaction again because the previous has been ended
							var transaction = db.transaction(['restaurants'], 'readwrite');
							var objectStore = transaction.objectStore('restaurants');

							data.forEach(function (item) {
								objectStore.put(item);
							})
						})

						// fetch all restaurants objects
						// const addRestaurantsToDB = (restaurants = self.restaurants) => {
						// 	restaurants.forEach(restaurant => {
						// 	// add each restaurant object to db
						// 		var requestAddRestaurant = objectStore.add(restaurant);

						// 		console.log('restaurant object added to db:' + restaurant)

						// 		requestAddRestaurant.onsuccess = function (event) {
						// 		// (to detect whether it has been succesfully
						// 		// added to the database, you'd look at transaction.oncomplete)
						// 			console.log('Request to add restaurant was successful');
						// 		};
						// 	});
						// }
						// addRestaurantsToDB()

						// report on the success of the transaction completing, when everything is done
						transaction.oncomplete = function () {
							console.log('Transaction completed: database modification finished');
						};

						transaction.onerror = function () {
							console.log('Transaction not opened due to error: ' + transaction.error);
						};

					// console.log('REPORT ///////////////////////////////');
					// console.log('objectStore indexNames: ' + objectStore.indexNames);
					// console.log('objectStore keyPath: ' + objectStore.keyPath);
					// console.log('objectStore name: ' + objectStore.name);
					// console.log('objectStore transaction: ' + objectStore.transaction);
					// console.log('objectStore autoIncrement: ' + objectStore.autoIncrement);
					// console.log('///////////////////////////////');

					// var restaurants = []
					// const fetchRestaurantsFromDB = () => {
					// 	var transaction = db.transaction('restaurants');
					// 	var objectStore = transaction.objectStore('restaurants');

					// 	objectStore.openCursor().onsuccess = function (event) {
					// 		var cursor = event.target.result;
					// 		if (cursor) {
					// 			console.log('Name for restaurant key: ' + cursor.key + ' is ' + cursor.value.name);
					// 			restaurants.push(cursor.value)
					// 			cursor.continue();
					// 		} else {
					// 			console.log('No more entries!');
					// 		}
					// 	};

					// }

					// fetchRestaurantsFromDB()

					};


					// ============= ON UPGRADE (DB SCHEMA) ================
					request.onupgradeneeded = function (event) {
						console.log('onupgradeneeded request triggered: ' + event);

						var db = event.target.result;

						db.onerror = function (event) {
							console.log('Error loading database');
						};

						db.onversionchange = function (event) {
							console.log('version changed, user should be informed');

						};


						// Create an objectStore for this database
						var objectStore = db.createObjectStore('restaurants', {
							keyPath: 'name'
						// autoIncrement: true
						});

						console.log('onupgradeneeded event triggered, object store restaurants created');

					};


				// ==========indexedDB END================		
				}


				// return the cache or a new request for cache
				return response || fetch(event.request);
			})
	);
});