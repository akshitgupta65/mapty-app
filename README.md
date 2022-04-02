# Mapty App is the perfect repository for your workouts

**How does it work?**

Mapty App allows you to keep a record of your running and cycling workouts on a map. It uses [Leaflet](https://leafletjs.com/), the JS Library for interactive maps, to fetch map squares. Alongside, it uses geolocation API to fetch current location.

_Adding a workout_

- We can add a workout by simply clicking anywhere on the map. As soon as we click on the map, we get a marker on that location.
- On the left side, a form gets opened that ask us our workout data. As soon as we submit the data, a workout is created alongside today's date.
- _Running workout_ : To log a running workout, workout type should be running. It asks distance, duration and cadence.
- _Cycling workout_ : To log a cycling workout, workout type should be cycling. It asks distance, duration and elevation gain.
- After a workout is added, it gets stored in our local storage so that the data stays in future as well.

_Deleting a workout_

- We can delete any workout by simply clicking on delete button. As soon as we click delete, it gets removed from the UI as well as from local storage

_Editing a workout_\*

- In case you make a mistake while loggin a workout, on way to fix it is to delete and add the workout again.
- Instead, we can edit existing workouts using edit button.

_Navigating to a workout_

- From our list of workouts on the left, every workout is clickable. As we click on any workout, we automatically navigate to the particular workout on the map.

**Key Features**

- automatically logs workout date (improves UX)
- geolocation API (to fetch our current location)
- one\-click solutions to adding, editing and deleting workouts

**Things learnt**

- _Private properties and methods inside Classes_ : Private properties with hash(\#) as prefix are extensively used. As private methods were not fully functional at the time, underscore(\_) is used to indicate protected methods, implying that protected methods have been only used within the Class.
- _Project architecture_ : used the **ES6 classes**. It is divided into 2 types of classes: Business logic(workout classes) and Application logic (where the whole app is being controlled)

**Imp Skills**

- AJAX calls
- APIs (geolocation)
- DOM Manipulation
- localStorage
- refactoring Code
- 3rd party library (Leaflet)

> \* : Feature requires bug fixes.

> Note 1 : This project is a part of 'The Complete JavaScript Course 2022: From Zero To Expert!' on Udemy by 'Jonas Schmedtmann'. All rights reserved by [Jonas Schmedtmann](https://github.com/jonasschmedtmann).
>
> Note 2 : Lists are written in alphabetical order.
> location
