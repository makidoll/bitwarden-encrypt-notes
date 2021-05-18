import CryptoJS from "crypto-js";

const iterations = 100000;
// const iterations = 10000;

const SALT_OFFSET = 8;
const SALT_LENGTH = 8;

const CIPHERTEXT_OFFSET = 16;

const KEYIV_LENGTH = 48;

const KEY_OFFSET = 0;
const KEY_LENGTH = 32;

const IV_OFFSET = 32;
const IV_LENGTH = 16;

function sliceWords(
	wordArray: CryptoJS.lib.WordArray,
	offsetInBytes: number,
	lengthInBytes?: number,
) {
	return CryptoJS.lib.WordArray.create(
		wordArray.words.slice(
			offsetInBytes / 4,
			...(lengthInBytes == null
				? []
				: [(offsetInBytes + lengthInBytes) / 4]),
		),
	);
}

// thank you mti2935 for making it stupid clear how openssl puts it together
// https://crypto.stackexchange.com/a/79855

export function isEncrypted(message: string) {
	const prefix = CryptoJS.enc.Utf8.parse("Salted__")
		.toString(CryptoJS.enc.Base64)
		.slice(0, -2);
	return message.startsWith(prefix);
}

export async function encrypt(messageString: string, password: string) {
	// create salt and generate key and iv with password
	const salt = CryptoJS.lib.WordArray.random(SALT_LENGTH);
	const keyIv = CryptoJS.PBKDF2(password, salt, {
		iterations,
		hasher: CryptoJS.algo.SHA256,
		keySize: KEYIV_LENGTH / 4, // words
	});
	const key = sliceWords(keyIv, KEY_OFFSET, KEY_LENGTH);
	const iv = sliceWords(keyIv, IV_OFFSET, IV_LENGTH);

	// decrypt
	const encrypted = CryptoJS.AES.encrypt(messageString, key, {
		iv,
		mode: CryptoJS.mode.CBC,
	});

	const encryptedString = CryptoJS.lib.WordArray.create([
		...CryptoJS.enc.Utf8.parse("Salted__").words,
		...salt.words,
		...encrypted.ciphertext.words,
	]).toString(CryptoJS.enc.Base64);

	// console.log("salt:", salt.toString());
	// console.log("key:", key.toString());
	// console.log("iv:", iv.toString());
	// console.log("encrypted:", encryptedString);

	return encryptedString;
}

export async function decrypt(messageString: string, password: string) {
	// get salt and ciphertext from message
	const message = CryptoJS.enc.Base64.parse(messageString);
	const salt = sliceWords(message, SALT_OFFSET, SALT_LENGTH);
	const ciphertext = sliceWords(message, CIPHERTEXT_OFFSET);

	// get key and iv from password and salt
	const keyIv = CryptoJS.PBKDF2(password, salt, {
		iterations,
		hasher: CryptoJS.algo.SHA256,
		keySize: KEYIV_LENGTH / 4, // words
	});
	const key = sliceWords(keyIv, KEY_OFFSET, KEY_LENGTH);
	const iv = sliceWords(keyIv, IV_OFFSET, IV_LENGTH);

	// decrypt
	const decrypted = CryptoJS.AES.decrypt({ ciphertext } as any, key, {
		iv,
		mode: CryptoJS.mode.CBC,
	});

	// console.log("salt:", salt.toString());
	// console.log("key:", key.toString());
	// console.log("iv:", iv.toString());
	// console.log("decrypted:", decrypted.toString(CryptoJS.enc.Utf8));

	return decrypted.toString(CryptoJS.enc.Utf8);
}
