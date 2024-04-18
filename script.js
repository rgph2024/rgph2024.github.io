const questionContainer = document.getElementById('question-container');
const answerContainer = document.getElementById('answer-container');
const questionInput = document.getElementById('question-input');
const answerDiv = document.getElementById('answer');
const submitButton = document.getElementById('submit-button');
const clearButton = document.getElementById('clear-button');
const exploreButton = document.getElementById('explore');
const aboutButton = document.getElementById('about');
const overlay = document.getElementById("overlay");
const closeBtn = document.getElementById('closeBtn');
const aboutContent = document.getElementById('about-content');
const pattern = /[^\u0621-\u064AA-z\d]+/gu;
var archive, keys;


function sha1(input) {
    const shaObj = new jsSHA("SHA-1", "TEXT");
    shaObj.update(input);
    return shaObj.getHash("HEX");
}
function normalizeStr(str) {
    return str.replace("أ", "ا").replace("إ", "ا").replace("آ", "ا").replace("ؤ", "و").replace("", "").replace("ـ", "").replace(pattern, "");
}

questionInput.addEventListener('input', function () {
    submitButton.disabled = !questionInput.value;
});

function handleAnswerSubmission() {
    if (!questionInput.value.trim()) {
        alert('يرجى إدخال سؤال قبل بدء البحث');
        return;
    }
    questionInput.disabled = true;
    submitButton.disabled = true;
    if (typeof archive !== 'undefined') {
        showAnswer();
    }
}

function showAnswer() {
    const question = questionInput.value;
    const answer = question;
    // answerDiv.innerText = answer;
    questionContainer.style.opacity = '.5';
    questionContainer.style.top = '20%';
    answerContainer.style.opacity = '1';
    answerContainer.style.top = '50%';
    answerContainer.style.visibility = 'visible';
    submitButton.disabled = false;

    var results = search(question);

    var lst = Object.keys(results);
    lst.forEach(function (key, i) {
        var val = archive[key];
        var qst = val["Question"];
        var badge = "Approved" in val ? verified : unverified;
        var options = val["Options"];
        var answers = val["Answer"];
        var choices = '';
        options.forEach(function (option, j) {
            choices += `<div class="question-option rtl" isCorrect="${answers.includes(j + 1)}"> <p class="unselectable">${option}</p>${answers.includes(j + 1) ? correct : wrong} </div>`;
        });
        var accuracyStyle = results[key] > .7 ? ` style="color:#fff;background-color: rgba(85, 207, 15, ${results[key]});"` : '';
        var question = `<div class="multisteps_form text-center"> <div class="quiz-card"><div class="accuracy-background"><div class="search-accuracy" ${accuracyStyle}>${(results[key] * 100).toFixed(1)}% تطابق</div>${(results[key] * 100).toFixed(1)}% تطابق</div> ${badge} <h3 class="question_title text-center unselectable rtl">${qst}</h3> </div>${choices}</div>`;
        if (i + 1 < lst.length) {
            question += `<div class="separator"> <div class="gradient-divider"></div> </div>`;
        }


        answerDiv.insertAdjacentHTML('beforeend', question);
    });
}


function handleClear() {
    const question = questionInput.value;
    questionInput.value = question;
    questionInput.disabled = false;
    submitButton.disabled = false;
    questionInput.focus();
    questionContainer.style.opacity = '1';
    questionContainer.style.top = '40%';
    answerContainer.style.opacity = '0';
    answerContainer.style.top = '80%';
    answerContainer.style.visibility = 'hidden';
    answerDiv.innerHTML = '';
}

submitButton.addEventListener('click', handleAnswerSubmission);
questionInput.addEventListener('keypress', function (e) {
    if (e.key === 'Enter' && questionInput.value && !overlay.classList.contains('active')) {
        handleAnswerSubmission();
    }
});

clearButton.addEventListener('click', handleClear);
document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && !overlay.classList.contains('active')) {
        handleClear();
    }
});

exploreButton.addEventListener('click', function () {
    showOverlay(exploreContent);
});

aboutButton.addEventListener('click', function () {
    showOverlay(aboutContent);
});

closeBtn.addEventListener('click', () => {
    hideOverlay();
});


function showOverlay(content) {
    overlay.style.display = 'flex'; // Display the overlay
    overlay.classList.add('active'); // Add the active class to start transition

    // Hide all content initially
    exploreContent.style.display = 'none';
    aboutContent.style.display = 'none';

    // Show the corresponding content
    content.style.display = 'block';
}

function hideOverlay() {
    overlay.classList.remove('active');
    setTimeout(() => {
        overlay.style.display = 'none';
        exploreContent.style.display = 'none'; // Hide the content
        aboutContent.style.display = 'none'; // Hide the content
    }, 500); // Adjust this time to match the CSS transition duration
}


function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}
// Function to calculate Levenshtein distance using two matrix rows
function levenshtein(str1, str2) {
    const m = str1.length;
    const n = str2.length;

    // Initialize two arrays to represent the matrix rows
    let prevRow = new Array(n + 1).fill(0);
    let currRow = new Array(n + 1).fill(0);

    // Initialize the first row with consecutive numbers
    for (let j = 0; j <= n; j++) {
        prevRow[j] = j;
    }

    // Dynamic programming to fill the matrix
    for (let i = 1; i <= m; i++) {
        currRow[0] = i;

        for (let j = 1; j <= n; j++) {
            // Check if characters at the current positions are equal
            if (str1[i - 1] === str2[j - 1]) {
                currRow[j] = prevRow[j - 1]; // No operation required
            } else {
                // Choose the minimum of three possible operations (insert, remove, replace)
                currRow[j] = 1 + Math.min(
                    currRow[j - 1], // Insert
                    prevRow[j],	 // Remove
                    prevRow[j - 1] // Replace
                );
            }
        }

        // Update the previous row with the current row for the next iteration
        prevRow = [...currRow];
    }

    // The result is the value at the bottom-right corner of the matrix
    return currRow[n];
}

function levenshteinRatio(str1, str2) {
    return 1 - (levenshtein(str1, str2) / (str1.length + str2.length));
}

const correct = `<span class="text-success d-flex align-items-center"> <svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 24 24" height="2.5em" width="2.5em" xmlns="http://www.w3.org/2000/svg"> <path d="M12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12C22 17.5228 17.5228 22 12 22ZM12 20C16.4183 20 20 16.4183 20 12C20 7.58172 16.4183 4 12 4C7.58172 4 4 7.58172 4 12C4 16.4183 7.58172 20 12 20ZM11.0026 16L6.75999 11.7574L8.17421 10.3431L11.0026 13.1716L16.6595 7.51472L18.0737 8.92893L11.0026 16Z"> </path> </svg> </span>`;
const verified = `<span class="badge"><svg xmlns="http://www.w3.org/2000/svg" height="2em" width="2em" id="Layer_1" data-name="Layer 1" viewBox="0 0 122.88 116.87"><defs><style>.cls-1{fill:#0f5132;fill-rule:evenodd;}.cls-2{fill:#fff;}</style></defs><title>verified-symbol</title><polygon class="cls-1" points="61.37 8.24 80.43 0 90.88 17.79 111.15 22.32 109.15 42.85 122.88 58.43 109.2 73.87 111.15 94.55 91 99 80.43 116.87 61.51 108.62 42.45 116.87 32 99.08 11.73 94.55 13.73 74.01 0 58.43 13.68 42.99 11.73 22.32 31.88 17.87 42.45 0 61.37 8.24 61.37 8.24"/><path class="cls-2" d="M37.92,65c-6.07-6.53,3.25-16.26,10-10.1,2.38,2.17,5.84,5.34,8.24,7.49L74.66,39.66C81.1,33,91.27,42.78,84.91,49.48L61.67,77.2a7.13,7.13,0,0,1-9.9.44C47.83,73.89,42.05,68.5,37.92,65Z"/></svg><span style="margin-right: 5px; color: #0f5132;">أجوبة موثوقة</span></span>`;
const wrong = `<span class="text-danger d-flex align-items-center"> <svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 24 24" height="2.5em" width="2.5em" xmlns="http://www.w3.org/2000/svg"> <path d="M12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12C22 17.5228 17.5228 22 12 22ZM12 20C16.4183 20 20 16.4183 20 12C20 7.58172 16.4183 4 12 4C7.58172 4 4 7.58172 4 12C4 16.4183 7.58172 20 12 20ZM12 10.5858L14.8284 7.75736L16.2426 9.17157L13.4142 12L16.2426 14.8284L14.8284 16.2426L12 13.4142L9.17157 16.2426L7.75736 14.8284L10.5858 12L7.75736 9.17157L9.17157 7.75736L12 10.5858Z"> </path> </svg> </span>`;
const unverified = '<span class="badge"><svg viewBox="0 0 122.88 116.87" xmlns="http://www.w3.org/2000/svg"  height="2.7em" width="2.7em"><g data-name="Layer 2"><path fill="#842029" d="M93.78,47.52l-7-5.4a3.13,3.13,0,0,1-1-3.68l3.38-8.18A3.13,3.13,0,0,0,86.67,26L77.89,24.8a3.12,3.12,0,0,1-2.69-2.69L74,13.33a3.13,3.13,0,0,0-4.3-2.48l-8.18,3.38a3.13,3.13,0,0,1-3.68-1l-5.4-7a3.13,3.13,0,0,0-5,0l-5.4,7a3.13,3.13,0,0,1-3.68,1l-8.18-3.38A3.13,3.13,0,0,0,26,13.33L24.8,22.11a3.12,3.12,0,0,1-2.69,2.69L13.33,26a3.13,3.13,0,0,0-2.48,4.3l3.38,8.18a3.13,3.13,0,0,1-1,3.68l-7,5.4a3.13,3.13,0,0,0,0,5l7,5.4a3.13,3.13,0,0,1,1,3.68l-3.38,8.18A3.13,3.13,0,0,0,13.33,74l8.78,1.16a3.12,3.12,0,0,1,2.69,2.69L26,86.67a3.13,3.13,0,0,0,4.3,2.48l8.18-3.38a3.13,3.13,0,0,1,3.68,1l5.4,7a3.13,3.13,0,0,0,5,0l5.4-7a3.13,3.13,0,0,1,3.68-1l8.18,3.38A3.13,3.13,0,0,0,74,86.67l1.16-8.78a3.12,3.12,0,0,1,2.69-2.69L86.67,74a3.13,3.13,0,0,0,2.48-4.3l-3.38-8.18a3.13,3.13,0,0,1,1-3.68l7-5.4A3.13,3.13,0,0,0,93.78,47.52ZM50,76.7a3.63,3.63,0,1,1,3.62-3.63A3.63,3.63,0,0,1,50,76.7Zm3.62-14.19a3.62,3.62,0,1,1-7.24,0V26.93a3.62,3.62,0,1,1,7.24,0Z"/></g></svg> <span style="margin-right: 5px; color: #842029;">أجوبة غير موثوقة</span></span>';

if (typeof archive === 'undefined') {
    fetch('dataBase.json')
        .then(response => response.json())
        .then(data => {
            // Do something with the loaded JSON data
            archive = data;
            keys = shuffleArray(Object.keys(archive));
            keys.forEach(key => {
                archive[key]["questionHash"] = sha1(normalizeStr(archive[key]["Question"]));
            });
        })
        .catch(error => console.error('Error loading JSON file:', error));
}

function search(query, resultsNbr = 10) {

    query = normalizeStr(query);
    const hash = sha1(query);

    const filteredEntries = keys.filter((key) => archive[key]["questionHash"] === hash);

    if (filteredEntries.length !== 0) {
        return Object.fromEntries(filteredEntries.map(key => [key, 1]));
    }
    var dct = {};
    keys.map(key => {
        var qst = normalizeStr(archive[key]["Question"]);
        var score = levenshteinRatio(qst, query);
        if (query.includes(qst) || qst.includes(query)) {
            score += (1 - score) * 0.3
        }
        dct[key] = score;
    });

    return Object.fromEntries(Object.entries(dct).sort((a, b) => b[1] - a[1]).slice(0, resultsNbr));
}