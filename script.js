// Al Bhed Quiz Application JavaScript

// Practice sentences, copied exactly from app.py.
const SENTENCE_PRACTICE_SENTENCES = [
    "Hello friend",
    "Tidus plays blitzball",
    "Lulu knows black magic",
    "Yuna prays for the dead",
    "Auron carries his sword",
    "The dragon flies at dawn",
    "The pilgrimage never ends",
    "Wakka throws the blitzball",
    "Rikku laughs at the machine",
    "The fayth dreams in silence",
    "The road to Zanarkand is long",
    "The summoner walks to the temple",
];

class AlBhedQuiz {
    constructor() {
        this.letters = [];
        this.sentences = [];
        this.currentIndex = 0;
        this.score = 0;
        this.letterPerfectRounds = 0;
        this.letterHintedRounds = 0;
        this.letterHintsUsed = 0;
        this.letterHintMessages = [];
        this.letterSubmissionInProgress = false;
        this.mode = 'letter';
        this.quizRunId = 0;
        this.perfectRounds = 0;
        this.hintedRounds = 0;
        this.hintsUsed = 0;
        this.revealedHintIndices = new Set();
        this.sentenceSubmissionInProgress = false;
        this.feedbackModalElement =
            document.getElementById('answerFeedbackModal');
        this.feedbackModal = new
            bootstrap.Modal(this.feedbackModalElement, {
            backdrop: 'static',
            keyboard: false
        });
        this.advanceAfterFeedback = false;
        this.initializeEventListeners();
        this.populateMapping();
    }

    initializeEventListeners() {
        // Start quiz button
        document.getElementById('start-quiz-btn').addEventListener('click', () => {
            this.startQuiz();
        });

        document.getElementById('start-sentence-quiz-btn').addEventListener('click', () => {
            this.startSentenceQuiz();
        });

        // Welcome screen mapping button
        document.getElementById('welcome-mapping-btn').addEventListener('click', () => {
            const modal = new
                bootstrap.Modal(document.getElementById('mappingModal'));
            modal.show();
        });

        // Submit answer button
        document.getElementById('submit-answer-btn').addEventListener('click', () => {
            this.submitAnswer();
        });

        document.getElementById('letter-home-btn').addEventListener('click', () => {
            this.backToHome();
        });

        document.getElementById('sentence-home-btn').addEventListener('click', () => {
            this.backToHome();
        });

        document.getElementById('feedback-next-btn').addEventListener('click', () => {
            this.advanceAfterFeedback = true;
            document.getElementById('feedback-next-btn').disabled = true;
            this.feedbackModal.hide();
        });

        this.feedbackModalElement.addEventListener('hidden.bs.modal', () => {
            if (!this.advanceAfterFeedback) {
                return;
            }
            this.advanceAfterFeedback = false;
            document.getElementById('feedback-next-btn').disabled = false;
            if (this.mode === 'sentence') {
                this.advanceSentenceQuestion();
            } else {
                this.advanceLetterQuestion();
            }
        });

        this.feedbackModalElement.addEventListener('shown.bs.modal', () => {
            document.getElementById('feedback-next-btn').disabled = false;
        });

        // Restart quiz button
        document.getElementById('restart-quiz-btn').addEventListener('click', () => {
            this.restartQuiz();
        });

        // View mapping button
        document.getElementById('view-mapping-btn').addEventListener('click', () => {
            const modal = new
                bootstrap.Modal(document.getElementById('mappingModal'));
            modal.show();
        });

        document.getElementById('sentence-view-mapping-btn').addEventListener('click', () => {
            const modal = new
                bootstrap.Modal(document.getElementById('mappingModal'));
            modal.show();
        });

        document.getElementById('hint-btn').addEventListener('click', () => {
            this.revealHint();
        });

        document.getElementById('letter-hint-btn').addEventListener('click', () => {
            this.revealLetterHint();
        });

        document.getElementById('sentence-submit-btn').addEventListener('click', () => {
            this.submitSentenceAnswer();
        });

        document.getElementById('restart-sentence-quiz-btn').addEventListener('click', () => {
            this.startSentenceQuiz();
        });

        // Enter key submission
        document.getElementById('answer-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.submitAnswer();
            }
        });

        // Auto-focus and uppercase input
        document.getElementById('answer-input').addEventListener('input', (e) => {
            e.target.value = e.target.value.toUpperCase();
        });

        document.getElementById('sentence-answer-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.submitSentenceAnswer();
            }
        });
    }

    async startQuiz() {
        const quizRunId = ++this.quizRunId;
        try {
            const letters = Object.keys(this.mapping);
            for (let index = letters.length - 1; index > 0; index--) {
                const randomIndex = Math.floor(Math.random() * (index + 1));
                [letters[index], letters[randomIndex]] = [letters[randomIndex], letters[index]];
            }
            const data = { letters };
            if (quizRunId !== this.quizRunId) {
                return;
            }
            this.mode = 'letter';
            this.letters = data.letters;
            this.currentIndex = 0;
            this.score = 0;
            this.letterPerfectRounds = 0;
            this.letterHintedRounds = 0;
            this.showQuizScreen();
            this.updateCurrentQuestion();
        } catch (error) {
            if (quizRunId !== this.quizRunId) {
                return;
            }
            console.error('Error starting quiz:', error);
            this.showError('Failed to start quiz. Please try again.');
        }
    }

    async startSentenceQuiz() {
        const quizRunId = ++this.quizRunId;
        try {
            const sentences = SENTENCE_PRACTICE_SENTENCES.slice();
            for (let index = sentences.length - 1; index > 0; index--) {
                const randomIndex = Math.floor(Math.random() * (index + 1));
                [sentences[index], sentences[randomIndex]] = [sentences[randomIndex], sentences[index]];
            }
            const data = { sentences };
            if (quizRunId !== this.quizRunId) {
                return;
            }
            this.mode = 'sentence';
            this.sentences = data.sentences;
            this.currentIndex = 0;
            this.perfectRounds = 0;
            this.hintedRounds = 0;
            this.showQuizScreen();
            this.updateCurrentSentence();
        } catch (error) {
            if (quizRunId !== this.quizRunId) {
                return;
            }
            console.error('Error starting sentence quiz:', error);
            this.showError('Failed to start sentence quiz. Please try again.');
        }
    }

    updateCurrentQuestion() {
        // Check if quiz is complete
        if (this.currentIndex >= this.letters.length) {
            this.showResults({
                final_score: this.score,
                total_questions: this.letters.length
            });
            return;
        }

        const currentLetter = this.letters[this.currentIndex];
        this.letterHintsUsed = 0;
        this.letterHintMessages = [];
        this.letterSubmissionInProgress = false;

        // Update question display
        document.getElementById('current-letter').textContent = currentLetter;

        // Update progress
        const progressPercent = ((this.currentIndex + 1) / this.letters.length) * 100;
        document.getElementById('progress-bar').style.width = progressPercent + '%';
        document.getElementById('progress-text').textContent = `${this.currentIndex + 1}/${this.letters.length}`;

        // Update score
        document.getElementById('current-score').textContent = this.score;
        document.getElementById('score-label').textContent = 'Score';
        document.getElementById('answer-input').value = '';
        document.getElementById('answer-input').disabled = false;
        document.getElementById('submit-answer-btn').disabled = false;
        this.renderLetterHints();

        // Focus on input
        document.getElementById('answer-input').focus();
    }

    revealLetterHint() {
        if (this.letterHintsUsed >= 3 || this.letterSubmissionInProgress ||
            this.currentIndex >= this.letters.length) {
            return;
        }
        const englishLetter = this.letters[this.currentIndex];
        const correctAnswer = this.mapping[englishLetter];
        const groups = [
            ['A', 'B', 'C', 'D', 'E'],
            ['F', 'G', 'H', 'I', 'J'],
            ['K', 'L', 'M', 'N', 'O'],
            ['P', 'Q', 'R', 'S', 'T'],
            ['U', 'V', 'W', 'X', 'Y', 'Z'],
        ];
        const answerGroup = groups.find((group) => group.includes(correctAnswer));
        let hint;
        if (this.letterHintsUsed === 0) {
            const half = correctAnswer <= 'M' ? 'first half (A–M)' : 'second half (N–Z)';
            hint = `The correct Al Bhed letter is in the ${half}.`;
        } else if (this.letterHintsUsed === 1) {
            hint = `The correct letter is in group ${answerGroup[0]}–${answerGroup[answerGroup.length - 1]}.`;
        } else {
            const alternatives = answerGroup.filter((letter) => letter !== correctAnswer);
            const candidates = [correctAnswer];
            for (let index = 0; index < 2; index++) {
                const randomIndex = Math.floor(Math.random() * alternatives.length);
                candidates.push(alternatives.splice(randomIndex, 1)[0]);
            }
            for (let index = candidates.length - 1; index > 0; index--) {
                const randomIndex = Math.floor(Math.random() * (index + 1));
                [candidates[index], candidates[randomIndex]] = [candidates[randomIndex], candidates[index]];
            }
            hint = `One of these letters is correct: ${candidates.join(', ')}.`;
        }
        this.letterHintsUsed++;
        this.letterHintMessages.push(hint);
        this.renderLetterHints();
    }

    renderLetterHints() {
        const counter = document.getElementById('letter-hint-counter');
        const display = document.getElementById('letter-hint-display');
        const hintButton = document.getElementById('letter-hint-btn');
        counter.textContent = `Hints left: ${3 - this.letterHintsUsed}`;
        display.replaceChildren();
        this.letterHintMessages.forEach((message, index) => {
            const hint = document.createElement('div');
            hint.className = 'letter-hint-item small text-warning';
            hint.textContent = `Hint ${index + 1}: ${message}`;
            display.appendChild(hint);
        });
        hintButton.disabled = this.letterHintsUsed >= 3 || this.letterSubmissionInProgress;
    }

    getSentenceTranslation(sentence) {
        return sentence.toUpperCase().split('').map((character) => {
            return this.mapping[character] || character;
        }).join('');
    }

    updateCurrentSentence() {
        if (this.currentIndex >= this.sentences.length) {
            this.showResults();
            return;
        }

        this.hintsUsed = 0;
        this.revealedHintIndices = new Set();
        this.sentenceSubmissionInProgress = false;

        document.getElementById('current-sentence').textContent = this.sentences[this.currentIndex];

        // Update progress
        const progressPercent = ((this.currentIndex + 1) / this.sentences.length) * 100;
        document.getElementById('progress-bar').style.width = progressPercent + '%';
        document.getElementById('progress-text').textContent = `Sentence ${this.currentIndex + 1} of ${this.sentences.length}`;
        document.getElementById('score-label').textContent = 'Perfect rounds';
        document.getElementById('current-score').textContent = this.perfectRounds;
        document.getElementById('sentence-answer-input').value = '';
        document.getElementById('sentence-answer-input').disabled = false;
        document.getElementById('sentence-submit-btn').disabled = false;
        document.getElementById('hint-btn').disabled = false;
        this.renderHint();

        // Focus on input
        document.getElementById('sentence-answer-input').focus();
    }

    renderHint() {
        const translation = this.getSentenceTranslation(this.sentences[this.currentIndex]);
        const hint = Array.from(translation, (character, index) => {
            if (character === ' ') {
                return ' ';
            }
            return this.revealedHintIndices.has(index) ? character : '_';
        }).join('');
        document.getElementById('hint-display').textContent = hint;
        document.getElementById('hint-counter').textContent = `Hints left: ${3 - this.hintsUsed}`;
        document.getElementById('hint-btn').disabled = this.hintsUsed >= 3;
    }

    revealHint() {
        if (this.hintsUsed >= 3 || this.currentIndex >= this.sentences.length ||
            this.sentenceSubmissionInProgress) {
            return;
        }
        const translation = this.getSentenceTranslation(this.sentences[this.currentIndex]);
        const nextIndex = Array.from(translation).findIndex((character, index) => {
            return character !== ' ' && !this.revealedHintIndices.has(index);
        });
        if (nextIndex !== -1) {
            this.revealedHintIndices.add(nextIndex);
            this.hintsUsed++;
            this.renderHint();
        }
    }

    async submitSentenceAnswer() {
        const answerInput = document.getElementById('sentence-answer-input');
        const answer = answerInput.value.trim();
        if (!answer || this.sentenceSubmissionInProgress ||
            this.currentIndex >= this.sentences.length) {
            answerInput.focus();
            return;
        }

        this.sentenceSubmissionInProgress = true;
        document.getElementById('sentence-submit-btn').disabled = true;
        document.getElementById('hint-btn').disabled = true;
        answerInput.disabled = true;
        const quizRunId = this.quizRunId;

        try {
            const sentence = this.sentences[this.currentIndex];
            const expected_translation = this.getSentenceTranslation(sentence);
            const normalized_answer = answer.trim().toUpperCase();
            const letter_correctness = Array.from(expected_translation).map((character, index) => {
                return index < normalized_answer.length && normalized_answer[index] === character;
            });
            const data = {
                correct: normalized_answer === expected_translation,
                expected_translation: expected_translation,
                letter_correctness: letter_correctness,
                extra_characters: normalized_answer.slice(expected_translation.length)
            };
            if (quizRunId !== this.quizRunId) {
                return;
            }
            if (this.hintsUsed > 0) {
                this.hintedRounds++;
            } else if (data.correct) {
                this.perfectRounds++;
            }
            document.getElementById('current-score').textContent = this.perfectRounds;
            this.showSentenceFeedback(data);
            this.currentIndex++;
        } catch (error) {
            if (quizRunId !== this.quizRunId) {
                return;
            }
            console.error('Error submitting sentence answer:', error);
            this.sentenceSubmissionInProgress = false;
            document.getElementById('sentence-submit-btn').disabled = false;
            document.getElementById('hint-btn').disabled = this.hintsUsed >= 3;
            answerInput.disabled = false;
            this.showError('Failed to submit sentence answer. Please try again.');
        }
    }

    showSentenceFeedback(data) {
        const message = document.getElementById('sentence-feedback-message');
        const feedbackStatus = document.getElementById('feedback-status');
        const letterFeedback = document.getElementById('letter-feedback-content');
        const sentenceFeedback = document.getElementById('sentence-feedback-content');
        const expectedTranslation = document.getElementById('expected-translation');
        const extraCharacters = document.getElementById('extra-characters-feedback');

        document.getElementById('feedback-question').textContent = this.sentences[this.currentIndex];
        feedbackStatus.className = `alert mb-0 ${data.correct ? 'alert-success' : 'alert-danger'}`;
        letterFeedback.classList.add('d-none');
        sentenceFeedback.classList.remove('d-none');
        message.textContent = data.correct ? (this.hintsUsed > 0 ? 'Correct! Completed with hints.' : 'Correct! Perfect round.') : (this.hintsUsed > 0 ? 'Not quite — completed with hints.' : 'Not quite.');
        expectedTranslation.replaceChildren();
        Array.from(data.expected_translation).forEach((character, index) => {
            const letter = document.createElement('span');
            letter.className = data.letter_correctness[index] ? 'text-success' : 'text-danger';
            letter.textContent = character;
            expectedTranslation.appendChild(letter);
        });
        extraCharacters.textContent = data.extra_characters ? ` Extra characters: ${data.extra_characters}` : '';
        document.getElementById('feedback-next-btn').disabled = true;
        this.feedbackModal.show();
    }

    async submitAnswer() {
        const answerInput = document.getElementById('answer-input');
        const answer = answerInput.value.trim();

        if (!answer) {
            answerInput.focus();
            return;
        }
        if (this.currentIndex >= this.letters.length) {
            return;
        }
        if (this.letterSubmissionInProgress) {
            return;
        }
        const currentLetter = this.letters[this.currentIndex];
        this.letterSubmissionInProgress = true;
        document.getElementById('letter-hint-btn').disabled = true;
        document.getElementById('submit-answer-btn').disabled = true;
        answerInput.disabled = true;
        const quizRunId = this.quizRunId;

        try {
            const correct_answer = this.mapping[currentLetter];
            const data = {
                correct: answer.trim().toUpperCase() === correct_answer,
                correct_answer: correct_answer,
                english_letter: currentLetter
            };
            if (quizRunId !== this.quizRunId) {
                return;
            }
            // Update score if correct
            if (data.correct) {
                this.score++;
                if (this.letterHintsUsed === 0) {
                    this.letterPerfectRounds++;
                }
            }
            if (this.letterHintsUsed > 0) {
                this.letterHintedRounds++;
            }
            document.getElementById('current-score').textContent = this.score;
            this.showFeedback(data);
            // Keep this question visible until the player chooses Next.
            this.currentIndex++;
            answerInput.value = '';
        } catch (error) {
            if (quizRunId !== this.quizRunId) {
                return;
            }
            console.error('Error submitting answer:', error);
            this.letterSubmissionInProgress = false;
            document.getElementById('submit-answer-btn').disabled = false;
            answerInput.disabled = false;
            this.renderLetterHints();
            this.showError('Failed to submit answer. Please try again.');
        }
    }

    showFeedback(data) {
        const feedbackMessage = document.getElementById('feedback-message');
        const feedbackStatus = document.getElementById('feedback-status');
        const letterFeedback = document.getElementById('letter-feedback-content');
        const sentenceFeedback = document.getElementById('sentence-feedback-content');

        document.getElementById('feedback-question').textContent = `English letter: ${data.english_letter}`;
        feedbackStatus.className = `alert mb-0 ${data.correct ? 'alert-success' : 'alert-danger'}`;
        letterFeedback.classList.remove('d-none');
        sentenceFeedback.classList.add('d-none');
        if (data.correct) {
            feedbackMessage.textContent = `Correct! ${data.english_letter} → ${data.correct_answer}`;
        } else {
            feedbackMessage.textContent = `Oops! The correct answer was '${data.correct_answer}'.`;
        }
        document.getElementById('feedback-next-btn').disabled = true;
        this.feedbackModal.show();
    }

    hideFeedback() {
        this.advanceAfterFeedback = false;
        if (this.feedbackModalElement.classList.contains('show')) {
            this.feedbackModal.hide();
        }
    }

    advanceLetterQuestion() {
        this.updateCurrentQuestion();
    }

    advanceSentenceQuestion() {
        this.updateCurrentSentence();
    }

    backToHome() {
        this.quizRunId++;
        this.letters = [];
        this.sentences = [];
        this.currentIndex = 0;
        this.score = 0;
        this.letterPerfectRounds = 0;
        this.letterHintedRounds = 0;
        this.letterHintsUsed = 0;
        this.letterHintMessages = [];
        this.letterSubmissionInProgress = false;
        this.perfectRounds = 0;
        this.hintedRounds = 0;
        this.hintsUsed = 0;
        this.revealedHintIndices = new Set();
        this.sentenceSubmissionInProgress = false;
        document.getElementById('answer-input').value = '';
        document.getElementById('answer-input').disabled = false;
        document.getElementById('submit-answer-btn').disabled = false;
        document.getElementById('sentence-answer-input').value = '';
        document.getElementById('sentence-answer-input').disabled = false;
        document.getElementById('sentence-submit-btn').disabled = false;
        document.getElementById('hint-btn').disabled = false;
        this.hideQuizScreen();
        this.hideResultsScreen();
        this.hideFeedback();
        document.getElementById('welcome-screen').classList.remove('d-none');
    }

    showResults(data) {
        this.hideQuizScreen();
        if (this.mode === 'sentence') {
            document.getElementById('letter-results').classList.add('d-none');
            document.getElementById('letter-result-actions').classList.add('d-none');
            document.getElementById('sentence-results').classList.remove('d-none');
            document.getElementById('sentence-result-actions').classList.remove('d-none');
            document.getElementById('sentence-perfect-rounds').textContent = this.perfectRounds;
            document.getElementById('sentence-hinted-rounds').textContent = this.hintedRounds;
            document.getElementById('sentence-total-rounds').textContent = this.sentences.length;
            document.getElementById('results-screen').classList.remove('d-none');
            return;
        }
        document.getElementById('sentence-results').classList.add('d-none');
        document.getElementById('sentence-result-actions').classList.add('d-none');
        document.getElementById('letter-results').classList.remove('d-none');
        document.getElementById('letter-result-actions').classList.remove('d-none');
        // Update results
        document.getElementById('final-score').textContent = data.final_score;
        document.getElementById('total-questions').textContent = data.total_questions;
        document.getElementById('letter-perfect-rounds').textContent = this.letterPerfectRounds;
        document.getElementById('letter-hinted-rounds').textContent = this.letterHintedRounds;
        document.getElementById('letter-total-rounds').textContent = data.total_questions;

        // Show performance message
        const percentage = Math.round((data.final_score / data.total_questions) * 100);
        const performanceMessage = document.getElementById('performance-message');
        const resultsIcon = document.getElementById('results-icon');

        if (percentage === 100) {
            performanceMessage.innerHTML = `
                <div class="text-success">
                    <i class="fas fa-star me-1"></i>
                    Perfect score! You're an Al Bhed master!
                </div>
            `;
            resultsIcon.innerHTML = '<i class="fas fa-crown fa-4x text-warning"></i>';
        } else if (percentage >= 80) {
            performanceMessage.innerHTML = `
                <div class="text-info">
                    <i class="fas fa-thumbs-up me-1"></i>
                    Excellent work! ${percentage}% correct!
                </div>
            `;
        } else if (percentage >= 60) {
            performanceMessage.innerHTML = `
                <div class="text-warning">
                    <i class="fas fa-medal me-1"></i>
                    Good job! ${percentage}% correct!
                </div>
            `;
        } else {
            performanceMessage.innerHTML = `
                <div class="text-muted">
                    <i class="fas fa-book me-1"></i>
                    Keep practicing! ${percentage}% correct!
                </div>
            `;
            resultsIcon.innerHTML = '<i class="fas fa-book fa-4x text-info"></i>';
        }

        document.getElementById('results-screen').classList.remove('d-none');
    }

    async restartQuiz() {
        // Reset local state
        this.letters = [];
        this.currentIndex = 0;
        this.score = 0;
        this.mode = 'letter';

        // Reset UI
        this.hideResultsScreen();
        this.hideFeedback();
        document.getElementById('welcome-screen').classList.remove('d-none');
    }

    showQuizScreen() {
        document.getElementById('welcome-screen').classList.add('d-none');
        document.getElementById('quiz-screen').classList.remove('d-none');
        document.getElementById('letter-question').classList.toggle('d-none', this.mode !== 'letter');
        document.getElementById('sentence-question').classList.toggle('d-none', this.mode !== 'sentence');
        this.hideFeedback();
    }

    hideQuizScreen() {
        document.getElementById('quiz-screen').classList.add('d-none');
    }

    hideResultsScreen() {
        document.getElementById('results-screen').classList.add('d-none');
    }

    showError(message) {
        const alertDiv = document.createElement('div');
        alertDiv.className = 'alert alert-danger alert-dismissible fade show mt-3';
        alertDiv.innerHTML = `
            <i class="fas fa-exclamation-triangle me-2"></i>
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        document.querySelector('.container').appendChild(alertDiv);
    }

    populateMapping() {
        // Al Bhed mapping for the modal table
        this.mapping = {
            'A': 'Y', 'B': 'P', 'C': 'L', 'D': 'T', 'E': 'A', 'F': 'V', 'G': 'K',
            'H': 'R', 'I': 'E', 'J': 'Z', 'K': 'G', 'L': 'M', 'M': 'S', 'N': 'H',
            'O': 'U', 'P': 'B', 'Q': 'X', 'R': 'N', 'S': 'C', 'T': 'D', 'U': 'I',
            'V': 'J', 'W': 'F', 'X': 'Q', 'Y': 'O', 'Z': 'W'
        };
        const tableBody = document.getElementById('mapping-table-body');
        const letters = Object.keys(this.mapping);

        // Create rows with 2 mappings per row
        for (let i = 0; i < letters.length; i += 2) {
            const letter1 = letters[i];
            const letter2 = letters[i + 1];
            const row = document.createElement('tr');
            row.innerHTML = `
                <td class="fw-bold text-info">${letter1}</td>
                <td>${this.mapping[letter1]}</td>
                <td class="fw-bold text-info">${letter2 || ''}</td>
                <td>${letter2 ? this.mapping[letter2] : ''}</td>
            `;
            tableBody.appendChild(row);
        }
    }
}

// Initialize the quiz when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new AlBhedQuiz();
});
