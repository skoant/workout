(function () {

    document.addEventListener("DOMContentLoaded", function () {
        renderSchedule(data);
    });

    var timer = null;
    var totalWorkoutSeconds = 0;
    var exerciseSeconds = 0;
    var currentTimedEvent = null;
    var queue = [];

    function renderSchedule(scheduleJson) {
        var schedule = document.getElementById("schedule");

        for (var weekIdx = 0; weekIdx < scheduleJson.weeks.length; ++weekIdx) {
            var weekLabel = createElementWithClassName("h1", "week-label")
            weekLabel.innerHTML = "Week " + (weekIdx + 1);
            schedule.appendChild(weekLabel);

            var weekDiv = createElementWithClassName("div", "workout-week")
            var days = scheduleJson.weeks[weekIdx].days;

            for (var dayIdx = 0; dayIdx < days.length; ++dayIdx) {
                var day = days[dayIdx];
                var dayHeader = createDayHeader(day, dayIdx, weekIdx)
                weekDiv.appendChild(dayHeader);

                var dayDiv = createDaySchedule(day, dayIdx, weekIdx)
                weekDiv.appendChild(dayDiv);
            }

            schedule.appendChild(weekDiv);
        }
    }

    function createDayHeader(day, dayIndex, weekIndex) {
        var dayHeader = createElementWithClassName("div", "row")

        var labelCol = createElementWithClassName("div", "col-xs-2");
        var dayLabel = createElementWithClassName("h2", "day-label")
        dayLabel.innerHTML = "Day " + (dayIndex + 1) + " - " + day.muscleGroup
        labelCol.appendChild(dayLabel);
        dayHeader.appendChild(labelCol);

        var playCol = createElementWithClassName("div", "col-xs-2");
        var playButton = createElementWithClassName("button", "play-class")
        playButton.addEventListener('click', function (event) {
            togglePlayButton(event, '.pause-class');
            startWorkout(day, dayIndex, weekIndex);
        });
        playCol.appendChild(playButton);

        var pauseButton = createElementWithClassName("button", "pause-class")
        pauseButton.style.display = 'none';
        pauseButton.addEventListener('click', function (event) {
            togglePlayButton(event, '.play-class');
            pauseWorkout(day);
        });
        playCol.appendChild(pauseButton);
        dayHeader.appendChild(playCol);

        var timerCol = createElementWithClassName("div", "col-xs-2");
        var timerVal = createElementWithClassName("label", "timer-value");
        timerVal.setAttribute("id", "timerValue")
        timerCol.appendChild(timerVal);
        dayHeader.appendChild(timerCol);
        return dayHeader;
    }

    function togglePlayButton(event, className) {
        event.currentTarget.style.display = 'none'
        event.currentTarget.parentElement.querySelector(className).style.display = ''
    }

    function startWorkout(day, dayIndex, weekIndex) {
        if (currentTimedEvent != null) {
            console.log("Resuming...")
            startTimedEvent(currentTimedEvent);
        }
        else {
            buildExerciseTimeline(day, dayIndex, weekIndex)
            var timedEvent = queue.shift();
            startTimedEvent(timedEvent);
        }
    }

    function buildExerciseTimeline(day, dayIndex, weekIndex) {
        for (var i = 0; i < day.exercises.length; i++) {
            var exercise = day.exercises[i];

            var timedEvent = {
                exerciseName: exercise.Exercise,
                exerciseLengthSec: getExerciseTime(exercise.Reps),
                exerciseId: "day_d" + dayIndex + "_w" + weekIndex + "_e" + i,
                isRest: false,
                exerciseHandler: handleTimedEvent
            }

            for (var s = 0; s < parseInt(exercise.Sets[0]); s++) {
                queue.push(timedEvent);
                var restEvent = deepClone(timedEvent);
                restEvent.exerciseName = "Rest";
                restEvent.exerciseLengthSec = getExerciseTime(exercise.Rest);
                restEvent.isRest = true;
                queue.push(restEvent);
            }
        }
    }

    function handleTimedEvent(exerciseName, exerciseTime, exerciseId, isRest) {
        console.log('Starting ' + exerciseName + ' time: ' + exerciseTime + ' Row ID: ' + exerciseId);

        if (!timer) {
            var exerciseRow = document.getElementById(exerciseId);
            exerciseRow.className += " current-exercise";

            if (isRest)
                exerciseRow.className += " rest";

            timer = setInterval(function () {
                if (exerciseSeconds < exerciseTime - 1) {
                    totalWorkoutSeconds++;
                    exerciseSeconds++;
                    //var totalWorkoutTimeValue = pad(parseInt(exerciseSeconds / 60)) + ":" + pad(exerciseSeconds % 60);
                    var exerciseTimeValue = pad(parseInt(exerciseSeconds / 60)) + ":" + pad(exerciseSeconds % 60);
                    document.getElementById("timerValue").innerHTML = pad(exerciseTimeValue);
                }
                else {
                    document.getElementById("interval-audio").play();
                    var row = document.getElementById(exerciseId);
                    row.className = row.className.replace(/ current-exercise/g, '').replace(/ rest/g, '');
                    clearInterval(timer);
                    timer = null;
                    exerciseSeconds = 0;
                    var timedEvent = queue.shift();
                    startTimedEvent(timedEvent);
                }
            }, 1000)
        }
    }

    function startTimedEvent(timedEvent) {
        currentTimedEvent = timedEvent;
        timedEvent.exerciseHandler(timedEvent.exerciseName, timedEvent.exerciseLengthSec, timedEvent.exerciseId, timedEvent.isRest);
    }

    function getExerciseTime(repsOrTimespan) {
        var result = 0;
        if (repsOrTimespan.search(/sec/i) > -1) {
            var numStr = repsOrTimespan.match(/\d+/)[0];
            result = parseInt(numStr);
        }
        else if (repsOrTimespan.search(/min/i) > -1) {
            var numStr = repsOrTimespan.match(/\d+/)[0];
            result = parseInt(numStr) * 60;
        }
        else
            throw "Cannot get exercise time from reps";

        return result;
    }

    function pauseWorkout(day) {
        console.log("Pausing...")
        if (timer) {
            clearInterval(timer);
            timer = null;
        }
    }

    function pad(val) {
        var valString = val + "";
        if (valString.length < 2) {
            return "0" + valString;
        } else {
            return valString;
        }
    }

    function createDaySchedule(dayJson, dayIndex, weekIndex) {
        var exercises = dayJson.exercises;
        var dailyDiv = createElementWithClassName("div", "workout-day")

        for (var i = 0; i < exercises.length; i++) {
            var rowDiv = createElementWithClassName("div", "row");
            rowDiv.setAttribute("id", "day_d" + dayIndex + "_w" + weekIndex + "_e" + i);

            var exerciseName = createElementWithClassName("div", "col-xs-2 exercise-name");
            exerciseName.innerHTML = exercises[i].Exercise;
            rowDiv.appendChild(exerciseName);

            var reps = createElementWithClassName("div", "col-xs-2 reps-number");
            reps.innerHTML = exercises[i].Reps;
            rowDiv.appendChild(reps);

            var sets = createElementWithClassName("div", "col-xs-2 sets-number");
            sets.innerHTML = exercises[i].Sets;
            rowDiv.appendChild(sets);

            var restTime = createElementWithClassName("div", "col-xs-2 rest-time");
            restTime.innerHTML = exercises[i].Rest;
            rowDiv.appendChild(restTime);

            var youtubeSearch = createElementWithClassName("div", "col-xs-2 youtube-search");
            var whatToFind = exercises[i].Exercise;
            youtubeSearch.innerHTML = "<a href=\"http://m.youtube.com/results?q=how to do " + whatToFind + "\" target=\"_blank\">youtube</a>"
            rowDiv.appendChild(youtubeSearch);

            dailyDiv.appendChild(rowDiv);
        }
        ;

        return dailyDiv;
    }

    function createElementWithClassName(elementType, className) {
        var div = document.createElement(elementType);
        div.className = className;
        return div;
    }

    function deepClone(obj) {
        var depth = -1;
        var arr = [];
        return clone(obj, arr, depth);
    }

    function clone(obj, arr, depth) {
        if (typeof obj !== "object") {
            return obj;
        }

        var length = Object.keys(obj).length; // native method to get the number of properties in 'obj'

        var result = Object.create(Object.getPrototypeOf(obj)); // inherit the prototype of the original object
        if (result instanceof Array) {
            result.length = length;
        }

        depth++; // depth is increased because we entered an object here

        arr[depth] = []; // this is the x-axis, each index here is the depth
        arr[depth][length] = []; // this is the y-axis, each index is the length of the object (aka number of props)
        // start the depth at current and go down, cyclic structures won't form on depths more than the current one
        for (var x = depth; x >= 0; x--) {
            // loop only if the array at this depth and length already have elements
            if (arr[x][length]) {
                for (var index = 0; index < arr[x][length].length; index++) {
                    if (obj === arr[x][length][index]) {
                        return obj;
                    }
                }
            }
        }

        arr[depth][length].push(obj); // store the object in the array at the current depth and length
        for (var prop in obj) {
            if (obj.hasOwnProperty(prop)) result[prop] = clone(obj[prop], arr, depth);
        }

        return result;
    }
})();
