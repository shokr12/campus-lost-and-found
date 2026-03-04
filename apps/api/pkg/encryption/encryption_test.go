package encryption

import (
	"encoding/base64"
	"testing"
)

func TestEncryptDecrypt(t *testing.T) {
	// A valid 32-byte key base64 encoded
	key := base64.StdEncoding.EncodeToString([]byte("01234567890123456789012345678901"))

	plaintext := "secret@example.com"

	ciphertext, err := Encrypt(plaintext, key)
	if err != nil {
		t.Fatalf("Failed to encrypt: %v", err)
	}

	if ciphertext == plaintext {
		t.Fatalf("Ciphertext should not match plaintext")
	}

	decrypted, err := Decrypt(ciphertext, key)
	if err != nil {
		t.Fatalf("Failed to decrypt: %v", err)
	}

	if decrypted != plaintext {
		t.Fatalf("Expected '%s', got '%s'", plaintext, decrypted)
	}
}

func TestDecryptWithInvalidKey(t *testing.T) {
	key := base64.StdEncoding.EncodeToString([]byte("01234567890123456789012345678901"))
	wrongKey := base64.StdEncoding.EncodeToString([]byte("wrongkey01234567wrongkey01234567"))

	plaintext := "secret"
	ciphertext, _ := Encrypt(plaintext, key)

	_, err := Decrypt(ciphertext, wrongKey)
	if err == nil {
		t.Fatalf("Expected error when decrypting with wrong key")
	}
}
