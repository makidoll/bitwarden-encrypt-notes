import { decrypt, encrypt, isEncrypted } from "./encrypt-decrypt";

import notie from "notie";

const notieStyles = document.createElement("style");
notieStyles.innerHTML = [
	"  .notie-overlay{z-index:99999999 !important}",
	".notie-container{z-index:999999999999 !important}",
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
	// remove tabindex to allow user input
	const tabIndexEl = document.querySelector<HTMLElement>('*[tabindex="-1"]');
	if (tabIndexEl != null) tabIndexEl.removeAttribute("tabindex");

	const reset = () => {
		// add tabindex to restore back
		if (tabIndexEl != null) tabIndexEl.setAttribute("tabindex", "-1");
	};

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
		reset();
		return "";
	}

	reset();
	return password;
};

interface EncryptedNote {
	cipher: "aes-256-cbc"; // currently the only supported
	iterations: number;
	cipherText: string;
}

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

	const rawValue = textarea.value.trim();
	if (rawValue == "") {
		return notie.alert({
			type: "error",
			text: "Note can't be empty",
		});
	}

	let jsonValue: EncryptedNote = null;
	try {
		jsonValue = JSON.parse(rawValue);
	} catch (error) {}

	if (jsonValue == null) {
		// either old encrypted note or plain text

		if (isEncrypted(rawValue)) {
			// we dont know the iterations, so lets stick to pre-json iterations
			jsonValue = {
				cipher: "aes-256-cbc",
				iterations: 100000,
				cipherText: rawValue,
			};
		} else {
			// raw value stays raw value!
		}
	} else {
		// validate json
		if (typeof jsonValue.iterations != "number") {
			return notie.alert({
				type: "error",
				text: "Invalid iterations",
			});
		}
		if (typeof jsonValue.cipherText != "string") {
			return notie.alert({
				type: "error",
				text: "Invalid cipher text",
			});
		}
	}

	const encrypted = jsonValue != null;

	const password = await getPassword(encrypted);

	if (password == "") return;

	try {
		let newValue: string = "";

		if (encrypted) {
			newValue = await decrypt(
				jsonValue.cipherText,
				password,
				jsonValue.iterations,
			);
			newValue = newValue.trim();
			if (newValue == "") throw new Error("Failed to decrypt");
		} else {
			// TODO: allow users to change this value
			const iterations = 100000;

			const encryptedNote: EncryptedNote = {
				cipher: "aes-256-cbc",
				iterations,
				cipherText: await encrypt(rawValue, password, iterations),
			};

			newValue = JSON.stringify(encryptedNote);
		}

		textarea.value = newValue;
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
