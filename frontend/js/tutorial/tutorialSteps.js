const tutorialSteps = {
  flashcards: [
    {
      type: "intro",
      text: "Welcome to the Flashcard Creator! Let's take a quick tour.",
      textKey: "flashcards_tour_intro",
      padding: 0,
      offsetX: 0,
      offsetY: 0
    },
    {
      element: "[data-tooltip='wordList']",
      text: "Start by entering your words here. For now let's add 'dog'.",
      textKey: "flashcards_tour_wordlist",
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
      textKey: "flashcards_tour_settings",
      padding: 20,
      offsetX: 0,
      offsetY: 0,
      waitForChange: true,
      expectedValue: "image-word"
    },
    {
      element: "#preview",
      text: "This is where your flashcards will appear.",
      textKey: "flashcards_tour_preview",
      padding: 20,
      offsetX: 0,
      offsetY: 0
    },
    {
      element: ".mode-group",
      text: "Choose between auto mode and custom mode here.",
      textKey: "flashcards_tour_mode_group",
      padding: 10,
      offsetX: 0,
      offsetY: -15
    },
    {
      element: "input[name='mode'][value='custom']",
      text: "In custom mode, you can edit each flashcard individually.",
      textKey: "flashcards_tour_custom_mode",
      padding: 0,
      offsetX: -4,
      offsetY: -4,
      waitForClick: true
    },
    {
      element: "#addCardBtn",
      text: "Add more cards with this button.",
      textKey: "flashcards_tour_add_card",
      padding: 10,
      offsetX: 0,
      offsetY: 0,
      waitForVisible: true,
      waitForClick: true
    },
    {
      element: ".flashcard-text",
      text: "Click on the text to edit it directly.",
      textKey: "flashcards_tour_flashcard_text",
      padding: 10,
      offsetX: 0,
      offsetY: 0,
      index: 1,
      waitForVisible: true,
    },
    {
      element: ".image-placeholder",
      text: "Click on the image to generate or upload your own picture.",
      textKey: "flashcards_tour_image_placeholder",
      padding: 10,
      offsetX: 0,
      offsetY: 0,
      waitForClick: true
    },
    {
      element: "#picker-search",
      text: "Search for an image here. Let's search for something or let it as it is and click \"Next\".",
      textKey: "flashcards_tour_picker_search",
      padding: 10,
      offsetX: 0,
      offsetY: 0,
      waitForVisible: true
    },
    {
      element: "#picker-search-btn",
      text: "Click this button to see the search results.",
      textKey: "flashcards_tour_picker_search_btn",
      padding: 10,
      offsetX: 0,
      offsetY: 0,
      waitForClick: true
    },
    {
      element: ".image-grid img",
      text: "Click on an image to select it for your flashcard.",
      textKey: "flashcards_tour_picker_content_img",
      padding: 10,
      offsetX: 0,
      offsetY: 0,
      waitForVisible: true,
      waitForClick: true
    },
    {
      element: ".preview-actions",
      text: "You can also save and load your flashcards using these buttons.",
      textKey: "flashcards_tour_preview_actions",
      padding: 10,
      offsetX: 0,
      offsetY: 0
    },
    {
      element: "#downloadBtn",
      text: "Click this button to download your flashcards.",
      textKey: "flashcards_tour_download_btn",
      padding: 10,
      offsetX: 0,
      offsetY: 0
    },
    {
      type: "outro",
      text: "That's the end of the tour! Explore the features and have fun creating flashcards!",
      textKey: "flashcards_tour_outro"
    }
  ],
  bingo: [
    {
      type: "intro",
      text: "Welcome to the Bingo Card Creator! Let's take a quick tour.",
      textKey: "bingo_tour_intro",
      padding: 0,
      offsetX: 0,
      offsetY: 0
    },
    {
      element: "#title",
      text: "Start by giving your bingo card a title.",
      textKey: "bingo_tour_title",
      padding: 10,
      offsetX: 0,
      offsetY: 0
    },
    {
      element: "#freeCenter",
      text: "You can choose to have a free center space or not.",
      textKey: "bingo_tour_free_center",
      padding: 10,
      offsetX: 0,
      offsetY: 0
    },
    {
      element: "#displayMode",
      text: "Here you can choose if you want pictures on your bingo cards. Now let's switch to pictures and text mode.",
      textKey: "bingo_tour_display_mode",
      padding: 20,
      offsetX: 0,
      offsetY: 0,
      waitForChange: true,
      expectedValue: "image-word"
    },
    {
      element: "#gridSize",
      text: "Choose the grid size for your bingo card here. We will stay with the default 3x3 for now.",
      textKey: "bingo_tour_grid_size",
      padding: 10,
      offsetX: 0,
      offsetY: 0
    },
    {
      element: "#words",
      text: "Enter the words for your bingo card here. For now let's add some animals. Go next when you're ready.",
      textKey: "bingo_tour_wordlist",
      padding: 20,
      offsetX: 0,
      offsetY: 0,
      autoInput: "cat\ndog\nmouse\npig\ncow\npanda\nlion\ntiger\nfish\n"
    },
    {
      element: () => {
        return [...document.querySelectorAll(".cell-content")]
          .find(el => el.textContent.includes("mouse"));
      },
      text: "If some picture is not what you expected, you can click on it to choose a different one.",
      textKey: "bingo_tour_card_preview",
      padding: 10,
      offsetX: 0,
      offsetY: 0,
    },
    {
      element: () => {
        const cell = [...document.querySelectorAll(".cell-content")]
          .find(el => el.textContent.includes("mouse"));
        return cell.querySelector(".image-container .reload-icon");
      },
      text: "Click this icon to get a new image for this word.",
      textKey: "bingo_tour_card_reload",
      padding: 10,
      offsetX: 0,
      offsetY: 0,
      waitForClick: true
    },
    {
      element: ".image-grid img",
      text: "Click on an image to select it for your bingo card.",
      textKey: "bingo_tour_picker_content_img",
      padding: 10,
      offsetX: 0,
      offsetY: 0,
      waitForVisible: true,
      waitForClick: true,
      index: 1
    },
    {
      element: ".call-sheet",
      text: "This is your call sheet. You can use it to call out the words during the game.",
      textKey: "bingo_tour_call_sheet",
      padding: 10,
      offsetX: 0,
      offsetY: 0
    },
    {
      element: ".preview-actions",
      text: "You can also save and load your bingo cards using these buttons.",
      textKey: "bingo_tour_preview_actions",
      padding: 10,
      offsetX: 0,
      offsetY: 0
    },
    {
      element: "#downloadBtn",
      text: "Click this button to download your bingo cards.",
      textKey: "bingo_tour_download_btn",
      padding: 10,
      offsetX: 0,
      offsetY: 0
    },
    {
      type: "outro",
      text: "That's the end of the tour! Explore the features and have fun creating bingo cards!",
      textKey: "bingo_tour_outro"
    }
  ]
};