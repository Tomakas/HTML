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

document.addEventListener('DOMContentLoaded', () => {
  const path = window.location.pathname;
  const urlParams = new URLSearchParams(window.location.search);
  const topicName = urlParams.get('topic');
  const levelNumber = parseInt(urlParams.get('level'));
  if (path.endsWith('/topic.html')) {
    loadTopics();
  } else if (path.endsWith('/learning.html')) {
    loadWords(topicName, levelNumber);
  } else if (path.endsWith('/testing.html')) {
    initTesting(topicName, levelNumber);
  } else if (path.endsWith('/levels.html')){
    loadLevels(topicName);
  }
});

export function loadTopics() {
  const topics = getTopics();
  const topicList = document.getElementById('topic-list');
  const urlParams = new URLSearchParams(window.location.search);
  const mode = urlParams.get('mode');

  topicList.innerHTML = '';
  topics.forEach(topic => {
    const listItem = document.createElement('li');
    listItem.textContent = topic.name;
    listItem.addEventListener('click', () => {
        window.location.href = `/level.html?mode=${mode}&topic=${topic.name}`;
    });
    topicList.appendChild(listItem);
  });
}

export function loadLevels(topicName) {
  // Není potřeba znova parsovat url parametry
  // const urlParams = new URLSearchParams(window.location.search);
  // const topicName = urlParams.get('topic');
  const mode = urlParams.get('mode'); // mode se používá v loadLevels, tak ho parsujeme zde
  const topics = getTopics();
  const topic = topics.find(t => t.name === topicName);
  currentTopic = topic;

  const levelList = document.getElementById('level-list');
  levelList.innerHTML = '';
  if (topic) {
    topic.levels.forEach(level => {
      const listItem = document.createElement('li');
      listItem.textContent = `Úroveň ${level.levelNumber}`;
      listItem.addEventListener('click', () => {
          if (mode === 'learning') {
              window.location.href = `/learning.html?mode=${mode}&topic=${topic.name}&level=${level.levelNumber}`;
          } else if (mode === 'testing') {
              window.location.href = `/testing.html?mode=${mode}&topic=${topic.name}&level=${level.levelNumber}`;
          }
      });
      levelList.appendChild(listItem);
    });
  } else {
    console.error(`Téma "${topicName}" nebylo nalezeno.`);
  }
}

export function loadWords() {
  const urlParams = new URLSearchParams(window.location.search);
  const topicName = urlParams.get('topic');
  const levelNumber = parseInt(urlParams.get('level'));
  const topics = getTopics();
  const topic = topics.find(t => t.name === topicName);
  currentTopic = topic;
  const level = topic.levels.find(l => l.levelNumber === levelNumber);
  currentLevel = level;

  const wordList = document.getElementById('word-list');
  wordList.innerHTML = '';

  level.words.forEach(word => {
    const listItem = document.createElement('li');
    listItem.innerHTML = `
      <span class="english">${word.english}</span> - 
      <span class="czech">${word.czech}</span> (<span class="phonetic">${word.phonetic}</span>)
    `;
    wordList.appendChild(listItem);
  });
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