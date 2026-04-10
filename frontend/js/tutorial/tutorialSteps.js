const tutorialSteps = {
  flashcards: [
    {
      element: "[data-tooltip='wordList']",
      text: "Start by entering your words here.",
      padding: 20,
      offsetX: 0,
      offsetY: 50
    },
    {
      element: "[data-tooltip='settings']",
      text: "Adjust how your flashcards look here.",
      padding: 20,
      offsetX: 0,
      offsetY: 0
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
      offsetX: 0,
      offsetY: 0,
      waitForClick: true
    },
    {
      element: "#addCardBtn",
      text: "Add more cards with this button.",
      padding: 10,
      offsetX: 0,
      offsetY: 0,
      waitForVisible: true,
      action: () => {
        document.querySelector("input[value='custom']").checked = true;
        document.querySelector("input[value='custom']").dispatchEvent(new Event("change"));
      },
      waitForClick: true
    }
  ]
};