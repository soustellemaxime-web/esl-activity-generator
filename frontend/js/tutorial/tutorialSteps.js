const tutorialSteps = {
  flashcards: [
    {
      type: "intro",
      text: "Welcome to the Flashcard Creator! Let's take a quick tour.",
      padding: 0,
      offsetX: 0,
      offsetY: 0
    },
    {
      element: "[data-tooltip='wordList']",
      text: "Start by entering your words here. For now let's add 'dog'.",
      padding: 20,
      offsetX: 0,
      offsetY: 0,
      autoInput: "cat\n",
      waitForInput: true,
      expectedInput: "dog",
      hint: "dog"
    },
    {
      element: "[data-tooltip='settings']",
      text: "Here you can choose if you want pictures on your flashcards. Now let's switch to pictures and text mode.",
      padding: 20,
      offsetX: 0,
      offsetY: 0,
      waitForChange: true,
      expectedValue: "image-word"
    },
    {
      element: "#preview",
      text: "This is where your flashcards will appear.",
      padding: 20,
      offsetX: 0,
      offsetY: 0
    },
    {
      element: ".mode-group",
      text: "Choose between auto mode and custom mode here.",
      padding: 10,
      offsetX: 0,
      offsetY: -15
    },
    {
      element: "input[name='mode'][value='custom']",
      text: "In custom mode, you can edit each flashcard individually.",
      padding: 0,
      offsetX: -4,
      offsetY: -4,
      waitForClick: true
    },
    {
      element: "#addCardBtn",
      text: "Add more cards with this button.",
      padding: 10,
      offsetX: 0,
      offsetY: 0,
      waitForVisible: true,
      waitForClick: true
    },
    {
      element: ".flashcard-text",
      text: "Click on the text to edit it directly.",
      padding: 10,
      offsetX: 0,
      offsetY: 0,
      index: 2,
      waitForVisible: true,
    },
    {
      element: ".image-placeholder",
      text: "Click on the image to generate or upload your own picture.",
      padding: 10,
      offsetX: 0,
      offsetY: 0,
      waitForClick: true
    },
    {
      element: "#picker-search",
      text: "Search for an image here. Let's search for something or let it as it is and click \"Next\".",
      padding: 10,
      offsetX: 0,
      offsetY: 0,
      waitForVisible: true
    },
    {
      element: "#picker-search-btn",
      text: "Click this button to see the search results.",
      padding: 10,
      offsetX: 0,
      offsetY: 0,
      waitForClick: true
    },
    {
      element: ".picker-content img",
      text: "Click on an image to select it for your flashcard.",
      padding: 10,
      offsetX: 0,
      offsetY: 0,
      waitForVisible: true,
      waitForClick: true
    },
    {
      element: ".preview-actions",
      text: "You can also save and load your flashcards using these buttons.",
      padding: 10,
      offsetX: 0,
      offsetY: 0
    },
    {
      element: "#downloadBtn",
      text: "Click this button to download your flashcards.",
      padding: 10,
      offsetX: 0,
      offsetY: 0
    },
    {
      type: "outro",
      text: "That's the end of the tour! Explore the features and have fun creating flashcards!"
    }
  ]
};