window.FlashcardActions = {
  setWords(words) {
    window.flashcardState.words = words;
    syncToV2();
  },

  updateWord(index, newWord) {
    const oldWord = window.flashcardState.words[index];

    // move image mapping
    if (window.flashcardState.imageMap[oldWord]) {
      window.flashcardState.imageMap[newWord] =
        window.flashcardState.imageMap[oldWord];
      delete window.flashcardState.imageMap[oldWord];
    }

    window.flashcardState.words[index] = newWord;
    syncToV2();
  },

  setImage(word, img) {
    window.flashcardState.imageMap[word] = img;
    syncToV2();
  },

  deleteCard(index) {
    window.flashcardState.words.splice(index, 1);
    syncToV2();
  },

  addCard() {
    const newWord = "Word " + (window.flashcardState.words.length + 1);
    window.flashcardState.words.push(newWord);
    window.flashcardState.imageMap[newWord] = null;
    syncToV2();
  },

  setBorder(index, style) {
    if (!window.flashcardState.borders) {
      window.flashcardState.borders = {};
    }

    window.flashcardState.borders[index] = style;
    syncToV2();
  }
};