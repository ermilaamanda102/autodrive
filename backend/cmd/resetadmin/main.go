package main

import (
	"context"
	"fmt"
	"log"
	"os"
	"strings"
	"syscall"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/joho/godotenv"
	"golang.org/x/crypto/bcrypt"
	"golang.org/x/term"
)

func main() {
	_ = godotenv.Load()

	databaseURL := os.Getenv("DATABASE_URL")
	email := strings.ToLower(strings.TrimSpace(os.Getenv("ADMIN_EMAIL")))

	if databaseURL == "" || email == "" {
		log.Fatal("DATABASE_URL atau ADMIN_EMAIL belum diatur")
	}

	fmt.Print("Masukkan password Admin baru: ")

	password, err := term.ReadPassword(int(syscall.Stdin))
	fmt.Println()

	if err != nil {
		log.Fatal("Gagal membaca password: ", err)
	}

	defer func() {
		for i := range password {
			password[i] = 0
		}
	}()

	if len(password) < 12 || len(password) > 72 {
		log.Fatal("Password harus 12 sampai 72 byte")
	}

	fmt.Print("Ulangi password Admin baru: ")

	confirmation, err := term.ReadPassword(int(syscall.Stdin))
	fmt.Println()

	if err != nil {
		log.Fatal("Gagal membaca konfirmasi: ", err)
	}

	if string(password) != string(confirmation) {
		log.Fatal("Konfirmasi password tidak cocok")
	}

	hash, err := bcrypt.GenerateFromPassword(
		password,
		bcrypt.DefaultCost,
	)
	if err != nil {
		log.Fatal(err)
	}

	ctx, cancel := context.WithTimeout(
		context.Background(),
		15*time.Second,
	)
	defer cancel()

	db, err := pgxpool.New(ctx, databaseURL)
	if err != nil {
		log.Fatal(err)
	}
	defer db.Close()

	tag, err := db.Exec(
		ctx,
		`UPDATE users
		 SET password_hash = $1,
		     updated_at = NOW()
		 WHERE LOWER(email) = $2
		   AND role = 'admin'`,
		string(hash),
		email,
	)

	if err != nil {
		log.Fatal("Gagal reset password: ", err)
	}

	if tag.RowsAffected() == 0 {
		log.Fatal("Akun Admin tidak ditemukan")
	}

	fmt.Println("Password Admin berhasil diperbarui!")
}
