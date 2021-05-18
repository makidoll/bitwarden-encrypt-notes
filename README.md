# Bitwarden: Encrypt Notes

**!! THIS IS NOT AN OFFICIAL BITWARDEN PRODUCT !!**

I created this for myself. Feel free to look through the code and use it.

I will not publish this on the Chrome extension store.

# Build

```
yarn
yarn build
```

Load unpacked in Chrome.

# Encryption information

-   Using **PBKDF2** with **an 8 byte random salt** and password to create a key and IV.
-   Using **AES-256-CBC** to create the ciphertext.
-   Then aligned like below and **base64** to save in a secure note.

After decoding, the data will look like this where each character is a byte:

```
Salted__12345678...........................
|       |       |
prefix  salt    ciphertext
```

# Decrypt manually with OpenSSL on Linux

```bash
echo "cipher text" | base64 -d | openssl enc -d -aes-256-cbc -pbkdf2 -iter 100000
```

And if you're curious how to encrypt:

```bash
echo -n "plain text" | openssl enc -e -a -aes-256-cbc -pbkdf2 -iter 100000
```
