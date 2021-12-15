import notie from "notie";

export class UiNotie {
	constructor() {
		const notieStyles = document.createElement("style");
		notieStyles.innerHTML = [
			"  .notie-overlay{z-index:99999999 !important}",
			".notie-container{z-index:999999999999 !important}",
		].join(" ");
		document.body.appendChild(notieStyles);
	}

	inputPassword(encrypted: boolean, reenter = false) {
		return new Promise<string>(resolve => {
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
	}

	alert(options: { type: "info" | "error"; text: string }) {
		notie.alert(options);
	}
}

export class UiNative implements UiNotie {
	constructor() {}

	inputPassword(encrypted: boolean, reenter = false) {
		return new Promise<string>(resolve => {
			resolve(
				window
					.prompt(
						(reenter ? "Re-e" : "E") +
							"nter your notes password to " +
							(encrypted ? "decrypt" : "encrypt"),
					)
					.trim(),
			);
		});
	}

	alert(options: { type: "info" | "error"; text: string }) {
		window.alert(options.text);
	}
}
