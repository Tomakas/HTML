// js/app.js

import { getTopics } from '../data/data.js';
import { Topic, Level, Word } from './models.js';

let currentTopic = null;
let currentLevel = null;
let remainingWords = [];
let wordsToTest = [];
let currentWord = null;
let userInput = '';
let letterOptions = [];
let score = 0;
let totalWordsInLevel = 0;

// Pro Learning Mode
let learningCurrentIndex = 0;
let learningWords = [];

document.addEventListener('DOMContentLoaded', () => {
  const path = window.location.pathname;
  if (path.endsWith('/topic.html')) {
    loadTopics();
  } else if (path.endsWith('/learning.html')) {
    // loadWords(); // Odstraníme listování slov
  } else if (path.endsWith('/testing.html')) {
    initTesting();
  } else if (path.endsWith('/levels.html')) { // Oprava na 'levels.html'
    loadLevels();
  }
});

export function loadTopics() {
  const topics = getTopics();
  const topicList = document.getElementById('topic-list');
  const urlParams = new URLSearchParams(window.location.search);
  const mode = urlParams.get('mode');

  // Mapa témat na názvy obrázků
  const imageMap = {
    'Animals': 'animal.png',
    'Family': 'family.png',
    'Food': 'food.png',
    'Hobbies': 'hobby.png',
    'Home': 'home.png',
    'People': 'human.png', // 'People' mapuje na 'human.png'
    'Nature': 'nature.png',
    'Numbers': 'numbers.png',
    'Time': 'time.png',
    'Travel': 'travel.png'
  };

  topicList.innerHTML = '';
  topics.forEach(topic => {
    const listItem = document.createElement('li');
    listItem.classList.add('topic-item'); // Přidáme třídu pro CSS

    // Získání názvu obrázku z mapy
    const imageName = imageMap[topic.name] || 'default.png'; // Použije 'default.png' pokud není nalezen

    // Vytvoření obsahu seznamu s obrázkem a názvem
    listItem.innerHTML = `
      <img src="img/${imageName}" alt="${topic.name}" class="topic-image">
      <span class="topic-name">${topic.name}</span>
    `;

    // Přidání klikací události na celý seznamový prvek
    listItem.addEventListener('click', () => {
      window.location.href = `/levels.html?mode=${mode}&topic=${encodeURIComponent(topic.name)}`;
    });

    topicList.appendChild(listItem);
  });
}

export function loadLevels() {
  const urlParams = new URLSearchParams(window.location.search);
  const topicName = urlParams.get('topic');
  const mode = urlParams.get('mode');
  const topics = getTopics();
  const topic = topics.find(t => t.name === topicName);
  currentTopic = topic;

  const levelList = document.getElementById('level-list');
  levelList.innerHTML = '';
  topic.levels.forEach(level => {
    const listItem = document.createElement('li');
    listItem.textContent = `Úroveň ${level.levelNumber}`;
    listItem.addEventListener('click', () => {
      if (mode === 'learning') {
        window.location.href = `/learning.html?mode=${mode}&topic=${encodeURIComponent(topic.name)}&level=${level.levelNumber}`;
      } else if (mode === 'testing') {
        window.location.href = `/testing.html?mode=${mode}&topic=${encodeURIComponent(topic.name)}&level=${level.levelNumber}`;
      }
    });
    levelList.appendChild(listItem);
  });
}

export function loadWords() {
  // Stará funkce, nyní se nepoužívá
}

export function initTesting() {
  const urlParams = new URLSearchParams(window.location.search);
  const topicName = urlParams.get('topic');
  const levelNumber = parseInt(urlParams.get('level'));
  const topics = getTopics();
  const topic = topics.find(t => t.name === topicName);
  currentTopic = topic;
  const level = topic.levels.find(l => l.levelNumber === levelNumber);
  currentLevel = level;
  remainingWords = [...level.words];
  wordsToTest = [];
  totalWordsInLevel = level.words.length;
  score = 0;
  updateScoreDisplay();
  updateProgressBar();
  loadNewWord();
}

export function initLearning() {
  const urlParams = new URLSearchParams(window.location.search);
  const topicName = urlParams.get('topic');
  const levelNumber = parseInt(urlParams.get('level'));
  const mode = urlParams.get('mode');
  const topics = getTopics();
  const topic = topics.find(t => t.name === topicName);
  currentTopic = topic;
  const level = topic.levels.find(l => l.levelNumber === levelNumber);
  currentLevel = level;
  learningWords = level.words;
  learningCurrentIndex = 0;
  totalWordsInLevel = learningWords.length;
  updateLearningDisplay();
  updateLearningProgressBar();
  updateLearningButtons();
}

function updateLearningDisplay() {
  const learningWordElement = document.getElementById('learning-word');
  if (learningWordElement && learningWords[learningCurrentIndex]) {
    const word = learningWords[learningCurrentIndex];
    learningWordElement.innerHTML = `
      <span class="english-word">${word.english}</span> - 
      <span class="czech-word">${word.czech}</span> (<span class="phonetic">${word.phonetic}</span>)
    `;
  }
}

function onLearningBack() {
  if (learningCurrentIndex > 0) {
    learningCurrentIndex--;
    updateLearningDisplay();
    updateLearningProgressBar();
    updateLearningButtons();
  }
}

function onLearningNext() {
  if (learningCurrentIndex < learningWords.length - 1) {
    learningCurrentIndex++;
    updateLearningDisplay();
    updateLearningProgressBar();
    updateLearningButtons();
  }
}

function updateLearningButtons() {
  const backButton = document.getElementById('learning-back-button');
  const nextButton = document.getElementById('learning-next-button');

  if (learningCurrentIndex === 0) {
    backButton.disabled = true;
  } else {
    backButton.disabled = false;
  }

  if (learningCurrentIndex === learningWords.length - 1) {
    nextButton.disabled = true;
  } else {
    nextButton.disabled = false;
  }
}

function updateLearningProgressBar() {
  const progressBar = document.getElementById('learning-progress-bar');
  const percentage = totalWordsInLevel > 0 ? ((learningCurrentIndex + 1) / totalWordsInLevel) * 100 : 0;
  progressBar.style.width = `${percentage}%`;
}

// --- Existující funkce pro Testování ---

function loadNewWord() {
  if (remainingWords.length === 0) {
    if (wordsToTest.length === 0) {
        showFinalScoreDialog();
        return;
    } else {
        remainingWords.push(...wordsToTest);
        wordsToTest = [];
    }
  }
  currentWord = remainingWords.splice(Math.floor(Math.random() * remainingWords.length), 1)[0];
  userInput = '';
  generateLetterOptions();
  updateDisplay();
}

function generateLetterOptions() {
  const uniqueLetters = new Set();

  currentWord.english.toUpperCase().split('').forEach(letter => uniqueLetters.add(letter));

  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  while (uniqueLetters.size < 12) {
    uniqueLetters.add(alphabet[Math.floor(Math.random() * alphabet.length)]);
  }

  letterOptions = Array.from(uniqueLetters).sort(() => 0.5 - Math.random());

  const letterGrid = document.getElementById('letter-grid');
  letterGrid.innerHTML = '';
  letterOptions.forEach(letter => {
    const button = document.createElement('button');
    button.classList.add('letter-button');
    button.textContent = letter;
    button.addEventListener('click', () => onLetterTapped(letter));
    letterGrid.appendChild(button);
  });
}

function updateDisplay() {
  document.getElementById('testing-word').textContent = currentWord.czech;
  document.getElementById('testing-input').value = userInput;
}

function onLetterTapped(letter) {
  userInput += letter.toLowerCase();
  updateDisplay();
}

window.onDeleteTapped = () => {
  userInput = '';
  updateDisplay();
}

window.onConfirmTapped = () => {
  const isCorrect = userInput === currentWord.english.toLowerCase();
  handleAnswer(isCorrect);
}

window.onDontKnowTapped = () => {
  handleAnswer(false);
}

function handleAnswer(isCorrect) {
    if (isCorrect) {
        score++;
        updateScoreDisplay();
        showDialog('Správně!', '', true);
        setTimeout(() => {
            if (remainingWords.length === 0 && wordsToTest.length === 0) {
                showFinalScoreDialog();
            } else {
                updateProgressBar();
                loadNewWord();
            }
        }, 1000);
    } else {
        score -= 2;
        if (score < 0) {
            score = 0;
        }
        updateScoreDisplay();
        if (!wordsToTest.some(word => word.english === currentWord.english)) {
            wordsToTest.push(currentWord);
        }
        showDialog('Špatně!', `Správná odpověď byla "${currentWord.english}".`, false);
        setTimeout(() => {
            if (remainingWords.length === 0 && wordsToTest.length === 0) {
                showFinalScoreDialog();
            } else {
                updateProgressBar();
                loadNewWord();
            }
        }, 4000);
    }
}

function updateScoreDisplay() {
  document.getElementById('testing-score').textContent = `Skóre: ${score}`;
}

function showDialog(title, content, isSuccess) {
  const alertContainer = document.getElementById('alert-container');
  alertContainer.innerHTML = '';
  const alertDiv = document.createElement('div');
  alertDiv.classList.add('alert');

  if (isSuccess) {
    alertDiv.classList.add('alert-success');
    alertDiv.innerHTML = `
      <div class="alert-title">${title}</div>
    `;
  } else {
    alertDiv.classList.add('alert-danger');
    alertDiv.innerHTML = `
      <div class="alert-title">${title}</div>
      <div class="alert-content">${content}</div>
    `;
  }

  alertContainer.appendChild(alertDiv);

  setTimeout(() => {
      alertContainer.removeChild(alertDiv);
      if (remainingWords.length === 0 && wordsToTest.length === 0) {
          showFinalScoreDialog();
      }
  }, isSuccess ? 1000 : 4000);
}

function showFinalScoreDialog() {
  const alertContainer = document.getElementById('alert-container');
  const alertDiv = document.createElement('div');
  alertDiv.classList.add('alert', 'alert-info', 'final-score-dialog');
  alertDiv.innerHTML = `
    <div class="alert-title">Konec testu!</div>
    <div class="alert-content">Vaše finální skóre je ${score}.</div>
    <button class="alert-button" onclick="goTo('/')">OK</button>
  `;
  alertContainer.appendChild(alertDiv);
}

function updateProgressBar() {
  const progressBar = document.getElementById('progress-bar');
  const answeredWords = totalWordsInLevel - (remainingWords.length + wordsToTest.length);
  const percentage = totalWordsInLevel > 0 ? (answeredWords / totalWordsInLevel) * 100 : 0; // Ošetření dělení nulou
  progressBar.style.width = `${percentage}%`;
}

// Připojení Learning Mode funkcí k window objektu
window.onLearningBack = onLearningBack;
window.onLearningNext = onLearningNext;
