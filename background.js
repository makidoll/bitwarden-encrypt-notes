// declarativeContent will never be supported in firefox
// instead in manifest.json, it uses
// { "page_action": { "show_matches": [""] } }
if (chrome.app) {
	chrome.runtime.onInstalled.addListener(() => {
		chrome.declarativeContent.onPageChanged.removeRules(null, () => {
			chrome.declarativeContent.onPageChanged.addRules([
				{
					conditions: [
						new chrome.declarativeContent.PageStateMatcher({
							pageUrl: {
								hostEquals: "vault.bitwarden.com",
								schemes: ["https"],
							},
						}),
					],
					actions: [new chrome.declarativeContent.ShowPageAction()],
				},
			]);
		});
	});
}

chrome.pageAction.onClicked.addListener(tab => {
	chrome.tabs.sendMessage(tab.id, { action: "click" });
});
