package main

import (
	"fmt"
	"log"
	"os"

	"golang.org/x/crypto/bcrypt"
	"golang.org/x/term"
)

func main() {
	fmt.Print("Masukkan password baru Sales: ")

	password, err := term.ReadPassword(
		int(os.Stdin.Fd()),
	)
	fmt.Println()

	if err != nil {
		log.Fatal("Gagal membaca password: ", err)
	}

	if len(password) < 8 || len(password) > 72 {
		log.Fatal("Password harus 8 sampai 72 byte")
	}

	hash, err := bcrypt.GenerateFromPassword(
		password,
		bcrypt.DefaultCost,
	)

	if err != nil {
		log.Fatal("Gagal membuat hash: ", err)
	}

	fmt.Println("\nBcrypt hash:")
	fmt.Println(string(hash))
}
