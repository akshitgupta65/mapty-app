'use strict';

//////////////////////////////////////////////////////////////////
//

// PARENT CLASS

class Workout {
  date = new Date();
  id = (Date.now() + ' ').slice(-10); // we need id to uniquely identify each object
  //   clicks = 0;

  constructor(coords, distance, duration) {
    this.coords = coords; // [lat, lng]
    this.distance = distance; // in km
    this.duration = duration; // in min
  }

  _setDescription() {
    // prettier-ignore
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    this.description = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${
      months[this.date.getMonth()]
    } ${this.date.getDate()}`;
  }

  //   click() {
  //     this.clicks++;
  //   }
}

// CHILD CLASSES

class Running extends Workout {
  type = 'running';
  constructor(coords, distance, duration, cadence) {
    super(coords, distance, duration);
    this.cadence = cadence;
    this.calcPace();
    this._setDescription(); // defined in parent class
  }

  calcPace() {
    // pace is min per km
    this.pace = this.duration / this.distance;
    return this.pace;
  }
}

class Cycling extends Workout {
  type = 'cycling';
  constructor(coords, distance, duration, elevationGain) {
    super(coords, distance, duration);
    this.elevationGain = elevationGain;
    this.calcSpeed();
    this._setDescription(); // defined in parent class
  }
  calcSpeed() {
    // speed is km/hr
    this.speed = this.distance / (this.duration / 60);
    return this.speed;
  }
}

// const run1 = new Running([39, -12], 5.2, 24, 178);
// const cycle1 = new Cycling([39, -12], 27, 95, 523);

////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////
// APPLICATION ARCHITECTURE

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');

class App {
  //////////// Private Instance properties
  #map;
  #mapZoomLevel = 13;
  #mapEvent;
  #workout = [];

  /////////// Constructor function
  constructor() {
    // get user's position
    this._getPosition();

    // get data from local storage
    this._getLocalStorage();

    // attach event handlers
    form.addEventListener('submit', this._newWorkout.bind(this));
    inputType.addEventListener('change', this._toggleElevationField);
    containerWorkouts.addEventListener('click', this._moveToPopup.bind(this));
  }

  ////////// Protected Methods
  _getPosition() {
    if (navigator.geolocation)
      navigator.geolocation.getCurrentPosition(
        this._loadMap.bind(this), // binding the value of this keyword to make our code work
        function () {
          alert('Could not get your position');
        }
      );
  }

  _loadMap(position) {
    const { latitude } = position.coords;
    const { longitude } = position.coords;
    const coords = [latitude, longitude];

    this.#map = L.map('map').setView(coords, this.#mapZoomLevel);

    L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);

    this.#map.on('click', this._showForm.bind(this));

    this.#workout.forEach(work => {
      this._renderWorkoutMarker(work);
    });
  }

  _showForm(mapE) {
    this.#mapEvent = mapE;
    form.classList.remove('hidden');
    inputDistance.focus();
  }

  _hideForm() {
    // prettier-ignore
    inputDistance.value = inputDuration.value = inputCadence.value =
    inputElevation.value = '';

    //--- in order to hide the form, we cant simply add back the hidden class (as it triggers the annimation set in CSS)
    //--- due to transition effect, the form takes 1 second to hide. And due to this, after 1 second, the workout slides upward.
    //--- to stop this, we immediately need to change the display style of form to none that will remove the form instantly.
    //--- now that its display is turned off, the workout will immediately replace the form and it wont slide.
    form.style.display = 'none';
    form.classList.add('hidden');
    //--- meanwhile, we will set a 1 sec-timer
    //--- that will allow the hidden class to get activated and then the display property of form will be set back to normal
    setTimeout(() => (form.style.display = 'grid'), 1000);
  }

  _toggleElevationField() {
    inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
    inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
  }

  _newWorkout(e) {
    e.preventDefault();

    // Helper functions
    //--- when we use (...inputs) rest parameters, we get an array
    //--- then we can loop over every value of that array and test a condition
    const isFinte = (...input) => input.every(val => Number.isFinite(val));
    const isPositive = (...input) => input.every(val => val > 0);

    // Get data from the form
    const type = inputType.value;
    const distance = +inputDistance.value; // as they come in string, we convert them to number
    const duration = +inputDuration.value;
    const { lat, lng } = this.#mapEvent.latlng;
    let workout;

    // If workout is running, then display cadence and running UI
    if (type === 'running') {
      const cadence = +inputCadence.value;
      // Validate Input Data (using gaurd clause)
      if (
        !isFinte(distance, duration, cadence) ||
        !isPositive(distance, duration, cadence)
      )
        return alert('Please enter a positive number in the input field');

      workout = new Running([lat, lng], distance, duration, cadence);
    }

    // If workout is cycling, then display cycling and cycling UI
    if (type === 'cycling') {
      const elevation = +inputElevation.value;
      // Validate Input Data (using gaurd clause)
      if (
        !isFinte(distance, duration, elevation) ||
        !isPositive(distance, duration)
      )
        return alert('Please enter a positive number in the input field');
      workout = new Cycling([lat, lng], distance, duration, elevation);
    }

    // Add new object to the workout array
    this.#workout.push(workout);
    console.log(workout);

    // Render workout on map as marker
    //--- we dont need to bind this keyword here.
    //--- we are calling it as a method on this keyword, not as a function
    //--- secondly, we are callling it on our own, not with an event listener
    this._renderWorkoutMarker(workout);

    // Render workout on list
    this._renderWorkout(workout);

    // Hide the form and Clear input fields
    this._hideForm();

    // Set local storage to all workouts
    this._setLocalStorage();
  }

  _renderWorkoutMarker(workout) {
    L.marker(workout.coords)
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          maxWidth: 250,
          minWidth: 200,
          autoClose: false,
          closeOnClick: false,
          className: `${workout.type}-popup`, // className will change if the type changes
        })
      )
      .setPopupContent(
        `${workout.type === 'running' ? '🏃' : '🚴'} ${workout.description}`
      )
      .openPopup();
  }

  _renderWorkout(workout) {
    // Step 1 : we create the HTML string that we want to insert in the DOM
    let html = `
    <li class="workout workout--${workout.type}" data-id="${workout.id}">
        <h2 class="workout__title">${workout.description}</h2>
        <div class="workout__details">
          <span class="workout__icon"> ${
            workout.type === 'running' ? '🏃' : '🚴'
          }</span>
          <span class="workout__value">${workout.distance}</span>
          <span class="workout__unit">km</span>
        </div> 
        <div class="workout__details">
          <span class="workout__icon">⏱</span>
          <span class="workout__value">${workout.duration}</span>
          <span class="workout__unit">min</span>
        </div>
    `;
    if (workout.type === 'running')
      html += `
        <div class="workout__details">
          <span class="workout__icon">⚡️</span>
          <span class="workout__value">${workout.pace.toFixed(1)}</span>
          <span class="workout__unit">min/km</span>
       </div>
       <div class="workout__details">
          <span class="workout__icon">👣</span>
          <span class="workout__value">${workout.cadence}</span>
          <span class="workout__unit">spm</span>
       </div>
    </li>
    `;
    if (workout.type === 'cycling')
      html += `
       <div class="workout__details">
          <span class="workout__icon">⚡️</span>
          <span class="workout__value">${workout.speed.toFixed(1)}</span>
          <span class="workout__unit">km/h</span>
       </div>
       <div class="workout__details">
          <span class="workout__icon">🗻</span>
          <span class="workout__value">${workout.elevationGain}</span>
          <span class="workout__unit">m</span>
        </div>
    </li> 
    `;

    // Step 2 : Inserting the html
    //--- We want to insert it as a child element of the ul element with class workouts
    //--- But we can only insert it as either its first child or last child
    //--- we dont want to do both. Then?
    //--- form element is the first child of ul element. That's why we will insert it close to form element as its sibling element.

    form.insertAdjacentHTML('afterend', html); // afterend will add new element as sibling element at the end of the form
  }

  _moveToPopup(e) {
    //--- as we have added the event handler to the parent element (event delegation), we need to find the element that we are looking for
    //--- we create a new variable workout element
    //--- e.target is the element that is actually being clicked
    //--- we will be finding the closest parent with the class workout.
    //--- wherever the click happen within the element, it will ultimately end up within the li element
    const workoutEl = e.target.closest('.workout');

    if (!workoutEl) return; // gaurd clause

    //--- why is the li element imp here?
    //--- because this element has the id attribute
    //--- we will use this id to find the element in the workout array
    //--- we put this here because with this, we can build a bridge between the UI and the data we have in our application
    const workout = this.#workout.find(
      work => work.id === workoutEl.dataset.id
    );
    console.log(workout);

    //--- now that we are able to build the bridge, we need to move the map to the coordinates of the workout
    //--- in leaflet, we already have a method that does this.
    //--- setView(coords, zoomLevel, objectOfOptions)
    this.#map.setView(workout.coords, this.#mapZoomLevel, {
      animate: true,
      pan: {
        duration: 1,
      },
    });

    // using the public interface
    // workout.click();
  }

  _setLocalStorage() {
    localStorage.setItem('workouts', JSON.stringify(this.#workout));
  }

  _getLocalStorage() {
    const data = JSON.parse(localStorage.getItem('workouts')); // returns an array
    // console.log(data);

    if (!data) return; // gaurd statement

    this.#workout = data;

    this.#workout.forEach(work => {
      this._renderWorkout(work);
    });
  }

  // Public Interface
  resetLocalStorage() {
    localStorage.removeItem('workouts');
    location.reload();
  }
}

const app = new App();

////////////////////////////////////////////
////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////
////////////////////////////

// GEOLOCATION API
//--- it is a browser API

// navigator.geolocation.getCurrentPosition(callback1, callback2)
//--- getCurrentPostion() takes 2 callback functions
//--- success callback that is called when browser successfully gets the user coordinates
//--- error callback that is called when browser fails to get the coordinates

////////////////////////////////////////////////////////////////////////

// DISPLAYING MAP (USING 3RD PARTY LIBRARY - LEAFLET)

//--- Leaflet is an open-source JS library for mobile-friendly interactive maps

// Adding Leaflet by including a hosted version that is on a CDN (Content Delivery Network)
//--- we include it on our script by adding the stylesheet and JS of leaflet library in the head of our html
//--- after including it into our site, we must do something with it.
//--- Adding it to our site enables us to use all the functions that our defined in the library to our advantage
//--- Now, we can add a map.

///////////////////////////////////////////////////////////////////////////////

// DISPLAYING A MAP MARKER (WHEREVER WE CLICK)

//--- The first thing to do is to attach an event handler
//--- But we cannot attach is on the map element, we need to attach it to the coordinates of our location
//--- therefore, we need access to the coordinates of the point that was just clicked.

//--- we have to use a method that is available in the leaflet library
//--- here, we need the map that we created above. We will be attching the event handler directly on the map that we created in our code.
//--- That is why we stored it in a variable

////////////////////////////////////////////////////////////////////////////

// RENDERING WORKOUT INPUT FORM

//--- What we want??
//--- 1. when user clicks on the map, a workout form should open
//--- 2. after filling, when user clicks submit, then marker should render
//--- 3. also the workout details must render

/////////////////////////
///////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////
/////////////////////////////

///// NON-REFACTORED CODE

// // global variables
// let map, mapEvent;

// if (navigator.geolocation)
//   // Fetching Current Location
//   navigator.geolocation.getCurrentPosition(
//     //
//     // Success Function
//     //--- this has an argument (known as the position parameter)
//     //--- JS calls this function in case of success and it will pass in an argument.
//     //--- we can use that argument in our code as it consists of all the necessary details regarding our location
//     function (position) {
//       const { latitude } = position.coords;
//       const { longitude } = position.coords;
//       console.log(`https://www.google.com/maps/@${latitude},${longitude},13z`);

//       //--- array of coordinates
//       const coords = [latitude, longitude];

//       // ADDING MAP TO THE SITE

//       //--- 1. Whatever string we pass in the MAP function must be the id name of an element in our html and it is in that element that the map will be displayed
//       //--- 2. 'L' is the main function that leaflet gives us as an entry point. It is basically a namespace for accessing leaflet in our code
//       //--- 3. setView method needs an array of coordinates as its first argument
//       //--- 4. second parameter is the zoom level (more the value, more will the map be able to get zoomed in). 13 is a good number
//       map = L.map('map').setView(coords, 13);
//       //   console.log(map);

//       //--- 1. The map that we see is made up of small tiles
//       //--- 2. we use the tileLayer method. These tiles come from the URL mentioned as the first argument of the function
//       //--- 3. OPENSTREETMAP is a famous website that everyone can use for free
//       //--- 4. We can use this URl to change the appearance of the map
//       L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
//         attribution:
//           '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
//       }).addTo(map);

//       //////////////
//       //   // DISPLAYING THE MAP MARKER

//       //   // Adding event handler directly on the map object
//       //   //--- on method is not coming from the JS itself
//       //   //--- it is coming from the leaflet library
//       //   //--- map object was generated in the leaflet library (because of the L we used above) and that's why it has some special methods and properties
//       //   //--- in JS, we get access to an event; here we get access to a special mapEvent
//       //   map.on('click', function (mapEvent) {
//       //     console.log(mapEvent);

//       //     const { lat, lng } = mapEvent.latlng;

//       //     //--- L.marker([coords]) creates a marker
//       //     //--- addTo() methods adds the marker to the map
//       //     //--- bindPopup('') creates a popup and binds it to the marker with the text that we pass inside the string
//       //     //--- instead of passing the string, we can also create a brand new popup object which will contain a couple of options
//       //     //--- we do that using L.popup() method inside bindPopup method.
//       //     //--- inside we will pass some options
//       //     L.marker([lat, lng])
//       //       .addTo(map)
//       //       .bindPopup(
//       //         L.popup({
//       //           maxWidth: 250,
//       //           minWidth: 200,
//       //           autoClose: false, // popup will not close automatically
//       //           closeOnClick: false, // will not close if we click on map
//       //           className: 'running-popup', // in order to add CSS attributes to the popup
//       //         })
//       //       )
//       //       .setPopupContent('Workout')
//       //       .openPopup();
//       //   });
//       ////////////////////

//       // Rendering the Form
//       map.on('click', function (mapE) {
//         mapEvent = mapE; // we need mapE later on the handler where we submit the form
//         form.classList.remove('hidden');
//         inputDistance.focus(); // better for UX
//       });
//     },

//     // Error Function
//     function () {
//       alert('Could not get your position');
//     }
//   );
// ///////////

// // SUBMITTING THE FORM AND DISPLAYING MARKER

// //--- Submitting the form does not concern geolocation
// //--- that's why it is written independently after the above block

// form.addEventListener('submit', function (e) {
//   //--- as the default begaviour of form is to reload automatically
//   e.preventDefault();

//   // Clear input fields
//   inputDistance.value =
//     inputDuration.value =
//     inputCadence.value =
//     inputElevation.value =
//       '';

//   // Displaying Marker
//   const { lat, lng } = mapEvent.latlng;
//   L.marker([lat, lng])
//     .addTo(map)
//     .bindPopup(
//       L.popup({
//         maxWidth: 250,
//         minWidth: 200,
//         autoClose: false, // popup will not close automatically
//         closeOnClick: false, // will not close if we click on map
//         className: 'running-popup', // in order to add CSS attributes to the popup
//       })
//     )
//     .setPopupContent('Workout')
//     .openPopup();
// });

// // SWITCHING ELEVATION GAIN AND CADENCE IN THE FORM
// //--- there is an event that is triggered everytime we change the value of the select element

// inputType.addEventListener('change', function (e) {
//   //--- firstly, we need both the elements that we want to play with
//   //--- we select the closest parent of the elements and for that we use DOM TRAVERSING
//   //--- the closest method to select the closest parent that has the following class
//   //--- then we can manipulate the classList using toggle method.
//   //--- toggle will keep on switching the hidden class and only one element will have it at a time
//   inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
//   inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
// });

///////////////////////////////////////////////////////////////////////////////////////////////

// LOCAL STORAGE

//--- It is a place in the browser where we can store data that will stay there even after the page is closed
//--- Data is basically linked to the URL on which we are using the application
//--- In short, whenever the page is loaded, it will appear as if all the workouts from previous session are on the same place.

// What do we have to implement??

// 1.Whenever a new workout is added, then all the workouts will be added to the localStorage.
//--- Whenever there is a new workout, we will take the entire workouts array and store it in the local storage
// 2.Whenever the page loads,
//--- 1. we will load the data from local storage,
//--- 2. render the data on the map and in the list
