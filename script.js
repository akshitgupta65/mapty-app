'use strict';

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

////////////////////////////////////////////////////
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

////////////////////////////////////////////////////////////////////////
// APPLICATION ARCHITECTURE

const form = document.querySelector('.form');
const formBtn = document.querySelector('.form__btn');
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
    formBtn.addEventListener('click', this._newWorkout.bind(this));
    inputType.addEventListener('change', this._toggleElevationField);
    containerWorkouts.addEventListener('click', this._moveToPopup.bind(this));
    containerWorkouts.addEventListener(
      'click',
      this._workoutUtilities.bind(this)
    );
  }

  ////////// Protected Methods

  // fetching position using geolocation
  _getPosition() {
    if (navigator.geolocation)
      navigator.geolocation.getCurrentPosition(
        this._loadMap.bind(this), // binding the value of this keyword to make our code work
        function () {
          alert('Could not get your position');
        }
      );
  }

  // loading map using leaflet library
  _loadMap(position) {
    const { latitude } = position.coords;
    const { longitude } = position.coords;
    const coords = [latitude, longitude];

    // assigning map
    this.#map = L.map('map').setView(coords, this.#mapZoomLevel);

    // fetching tiles
    L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);

    // event listener on map
    this.#map.on('click', this._showForm.bind(this));

    // render workout marker (local storage)
    this.#workout.forEach(work => {
      this._renderWorkoutMarker(work);
    });
  }

  // display form
  _showForm(mapE) {
    this.#mapEvent = mapE;
    form.classList.remove('hidden');
    inputDistance.focus();
  }

  // hide form
  _hideForm() {
    // prettier-ignore
    inputDistance.value = inputDuration.value = inputCadence.value =
    inputElevation.value = '';

    form.style.display = 'none';
    form.classList.add('hidden');
    setTimeout(() => (form.style.display = 'grid'), 1000);
  }

  // toggle between running and cycling
  _toggleElevationField() {
    inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
    inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
  }

  // Creating new workout
  _newWorkout(e) {
    e.preventDefault();
    // Helper functions
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
      // new running object
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
      // new cycling object
      workout = new Cycling([lat, lng], distance, duration, elevation);
    }

    // Add new object to the workout array
    this.#workout.push(workout);
    console.log(workout);

    // Render workout on map as marker
    this._renderWorkoutMarker(workout);

    // Render workout on list
    this._renderWorkout(workout);

    // Hide the form and Clear input fields
    this._hideForm();

    // Set local storage to all workouts
    this._setLocalStorage();
  }

  // workout marker function
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

  // workout list function
  _renderWorkout(workout) {
    let html = `
    <li class="workout workout--${workout.type}" data-id="${workout.id}">
        <h2 class="workout__title">${workout.description}
          <div class="workout__utilities">
             <a class ="workout__edit"> Edit </a>
             <span>  | </span>
             <a class ="workout__del"> Delete </a>
          </div>
        </h2>
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

    form.insertAdjacentHTML('afterend', html); // afterend will add new element as sibling element at the end of the form
  }

  // moving map towards the workout
  _moveToPopup(e) {
    const workoutEl = e.target.closest('.workout');

    if (!workoutEl) return; // gaurd clause
    // finding the workout usning id
    const workout = this.#workout.find(
      work => work.id === workoutEl.dataset.id
    );
    // implementing the movement
    this.#map.setView(workout.coords, this.#mapZoomLevel, {
      animate: true,
      pan: {
        duration: 1,
      },
    });

    // workout.click();
  }

  _workoutUtilities(e) {
    e.preventDefault();
    if (e.target.classList.contains('workout__del')) {
      this._deleteWorkout(e);
    }
    if (e.target.classList.contains('workout__edit')) {
      this._editWorkout(e);
    }
  }

  _editWorkout(e) {
    e.preventDefault();
    // variables
    const workoutEl = e.target.closest('.workout');
    const targetWork = this.#workout.find(
      work => work.id === workoutEl.dataset.id
    );
    console.log(targetWork);
    // displaying form and common data
    this._showForm();
    inputDistance.value = targetWork.distance;
    inputDuration.value = targetWork.duration;
    // displaying running form
    if (targetWork.type === 'running') {
      inputType.value = 'running';
      inputElevation.closest('.form__row').classList.add('form__row--hidden');
      inputCadence.closest('.form__row').classList.remove('form__row--hidden');
      inputCadence.value = targetWork.cadence;
    }
    // displaying cycling from
    if (targetWork.type === 'cycling') {
      inputType.value = 'cycling';
      inputElevation
        .closest('.form__row')
        .classList.remove('form__row--hidden');
      inputCadence.closest('.form__row').classList.add('form__row--hidden');
      inputElevation.value = targetWork.elevationGain;
    }
    // this._deleteWorkout(e);
  }

  _deleteWorkout(e) {
    e.preventDefault();
    // variables
    const targetEl = e.target.closest('.workout');
    const targetIndex = this.#workout.findIndex(
      work => work.id === targetEl.dataset.id
    );
    // removing from the list
    targetEl.style.display = 'none';
    // removing from workout array
    this.#workout.splice(targetIndex);
    // remvoing from local storage
    this._playWithLocoalStorage();
  }

  ///////// Local Storage

  _playWithLocoalStorage() {
    this.resetLocalStorage();
    this._setLocalStorage();
    this._getLocalStorage();
  }
  _setLocalStorage() {
    localStorage.setItem('workouts', JSON.stringify(this.#workout));
  }

  _getLocalStorage() {
    const data = JSON.parse(localStorage.getItem('workouts')); // returns an array
    if (!data) return; // gaurd statement

    data.map(obj => {
      if (obj.type === 'running') obj.__proto__ = Running.prototype;
      if (obj.type === 'cycling') obj.__proto__ = Cycling.prototype;
    });

    this.#workout = data;
    console.log(this.#workout);
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

//////////////////////////////////////////
