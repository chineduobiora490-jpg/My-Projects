const {
    generateKeys,
    encryptMessage,
    decryptMessage
} = require("./encryption");

// Simulate two Walkerline users
const phoneA = generateKeys();
const phoneB = generateKeys();

// Phone A writes a message
const originalMessage = "Hello from Walkerline!";

// Phone A encrypts it using Phone B's public key
const encrypted = encryptMessage(
    originalMessage,
    phoneB.publicKey
);

// Phone B decrypts it using its private key
const decrypted = decryptMessage(
    encrypted,
    phoneB.privateKey
);

console.log("Original message:", originalMessage);
console.log("Encrypted message:", encrypted.ciphertext);
console.log("Decrypted message:", decrypted);

console.log(
    "Encryption successful:",
    originalMessage === decrypted
);