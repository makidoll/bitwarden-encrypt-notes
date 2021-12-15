import { decrypt, encrypt, isEncrypted } from "./encrypt-decrypt";
import { UiNative } from "./user-interface";

// const ui = new UiNotie();
const ui = new UiNative();

const getPassword = async (encrypted: boolean) => {
	// remove tabindex to allow user input
	const tabIndexEl = document.querySelector<HTMLElement>('*[tabindex="-1"]');
	if (tabIndexEl != null) tabIndexEl.removeAttribute("tabindex");

	const reset = () => {
		// add tabindex to restore back
		if (tabIndexEl != null) tabIndexEl.setAttribute("tabindex", "-1");
	};

	const password = await ui.inputPassword(encrypted);
	if (password == "") return "";

	const confirmPassword = encrypted
		? password
		: await ui.inputPassword(encrypted, true);

	if (password != confirmPassword) {
		ui.alert({
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
		return ui.alert({
			type: "info",
			text: "Please open or create an item with notes",
		});
	}

	const rawValue = textarea.value.trim();
	if (rawValue == "") {
		return ui.alert({
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
			return ui.alert({
				type: "error",
				text: "Invalid iterations",
			});
		}
		if (typeof jsonValue.cipherText != "string") {
			return ui.alert({
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
		return ui.alert({
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
