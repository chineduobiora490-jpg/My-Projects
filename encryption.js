const crypto = require("crypto");

// Generate a user's X25519 key pair
function generateKeys() {
    return crypto.generateKeyPairSync("x25519", {
        publicKeyEncoding: {
            type: "spki",
            format: "pem"
        },
        privateKeyEncoding: {
            type: "pkcs8",
            format: "pem"
        }
    });
}

// Derive an encryption key from a shared secret
function deriveKey(sharedSecret, salt) {
    return Buffer.from(
        crypto.hkdfSync(
            "sha256",
            sharedSecret,
            salt,
            Buffer.from("Walkerline-Message-Encryption"),
            32
        )
    );
}

// Encrypt a message for its recipient
function encryptMessage(message, recipientPublicKey) {
    const ephemeralKeys = crypto.generateKeyPairSync("x25519");

    const sharedSecret = crypto.diffieHellman({
        privateKey: ephemeralKeys.privateKey,
        publicKey: crypto.createPublicKey(recipientPublicKey)
    });

    const salt = crypto.randomBytes(32);
    const key = deriveKey(sharedSecret, salt);
    const iv = crypto.randomBytes(12);

    const cipher = crypto.createCipheriv(
        "aes-256-gcm",
        key,
        iv
    );

    const ciphertext = Buffer.concat([
        cipher.update(message, "utf8"),
        cipher.final()
    ]);

    const authTag = cipher.getAuthTag();

    return {
        ephemeralPublicKey: ephemeralKeys.publicKey.export({
            type: "spki",
            format: "pem"
        }),
        salt: salt.toString("base64"),
        iv: iv.toString("base64"),
        authTag: authTag.toString("base64"),
        ciphertext: ciphertext.toString("base64")
    };
}

// Decrypt a message using the recipient's private key
function decryptMessage(envelope, recipientPrivateKey) {
    const sharedSecret = crypto.diffieHellman({
        privateKey: crypto.createPrivateKey(recipientPrivateKey),
        publicKey: crypto.createPublicKey(envelope.ephemeralPublicKey)
    });

    const salt = Buffer.from(envelope.salt, "base64");
    const key = deriveKey(sharedSecret, salt);

    const iv = Buffer.from(envelope.iv, "base64");

    const decipher = crypto.createDecipheriv(
        "aes-256-gcm",
        key,
        iv
    );

    decipher.setAuthTag(
        Buffer.from(envelope.authTag, "base64")
    );

    const plaintext = Buffer.concat([
        decipher.update(Buffer.from(envelope.ciphertext, "base64")),
        decipher.final()
    ]);

    return plaintext.toString("utf8");
}

module.exports = {
    generateKeys,
    encryptMessage,
    decryptMessage
};