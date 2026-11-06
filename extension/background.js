// Un clic sur l'icône ouvre la page de l'outil dans un nouvel onglet.
chrome.action.onClicked.addListener(() => {
  chrome.tabs.create({ url: chrome.runtime.getURL("app.html") });
});
