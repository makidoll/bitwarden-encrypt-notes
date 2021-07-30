import { decrypt, encrypt, isEncrypted } from "./encrypt-decrypt";

import notie from "notie";

const notieStyles = document.createElement("style");
notieStyles.innerHTML = [
	"  .notie-overlay{z-index:99999999}",
	".notie-container{z-index:999999999999}",
].join(" ");
document.body.appendChild(notieStyles);

const inputPassword = (encrypted: boolean, reenter = false) =>
	new Promise<string>(resolve => {
		notie.input(
			{
				text: (reenter ? "Re-e" : "E") + "nter your notes password",
				submitText: encrypted ? "Decrypt" : "Encrypt",
				placeholder: "Your password",
				type: "password",
			},
			(text: string) => {
				resolve(text.trim());
			},
			() => {
				resolve("");
			},
		);
	});

const getPassword = async (encrypted: boolean) => {
	const password = await inputPassword(encrypted);
	if (password == "") return "";

	const confirmPassword = encrypted
		? password
		: await inputPassword(encrypted, true);

	if (password != confirmPassword) {
		notie.alert({
			type: "error",
			text: "Passwords don't match",
		});
		return "";
	}

	return password;
};

async function toggleNotesEncryption() {
	const textarea = document.querySelector<HTMLTextAreaElement>(
		"textarea[name=Notes]",
	);
	if (textarea == null) {
		return notie.alert({
			type: "info",
			text: "Please open or create an item with notes",
		});
	}

	let value = textarea.value;

	const tabIndexEl = document.querySelector<HTMLElement>('*[tabindex="-1"]');
	if (tabIndexEl != null) tabIndexEl.removeAttribute("tabindex");

	const encrypted = isEncrypted(textarea.value);
	const password = await getPassword(encrypted);

	if (tabIndexEl != null) tabIndexEl.setAttribute("tabindex", "-1");

	if (password == "") return;

	try {
		if (encrypted) {
			value = await decrypt(value, password);
		} else {
			value = await encrypt(value, password);
		}

		value = value.trim();
		if (value == "")
			throw new Error("Failed to " + (encrypted ? "decrypt" : "encrypt"));

		textarea.value = value;
		textarea.dispatchEvent(new Event("input", { bubbles: true }));
	} catch (error) {
		return notie.alert({
			type: "error",
			text: error,
		});
	}
}

// const icon = name => '<i aria-hidden="true" class="fa fa-' + name + '"></i>';
// const button = document.createElement("button");
// button.innerHTML = icon("key") + " Toggle</br>notes encryption";
// button.className = "btn btn-outline-secondary";
// button.type = "button";
// button.style.margin = "auto";
// button.style.position = "fixed";
// button.style.bottom = "8px";
// button.style.left = "8px";
// button.style.zIndex = "999999999999";
// document.body.appendChild(button);

// button.addEventListener("click", () => {
// 	toggleNotesEncryption();
// });

chrome.runtime.onMessage.addListener((msg, sender) => {
	if (sender.id != chrome.runtime.id) return;
	if (msg.action != "click") return;
	toggleNotesEncryption();
});
