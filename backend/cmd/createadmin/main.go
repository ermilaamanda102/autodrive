package main

import (
	"context"
	"errors"
	"fmt"
	"log"
	"os"
	"strings"
	"syscall"
	"time"

	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/joho/godotenv"
	"golang.org/x/crypto/bcrypt"
	"golang.org/x/term"
)

func main() {
	_ = godotenv.Load()

	databaseURL := os.Getenv("DATABASE_URL")
	if databaseURL == "" {
		log.Fatal("DATABASE_URL belum diatur")
	}

	name := strings.TrimSpace(os.Getenv("ADMIN_NAME"))
	email := strings.ToLower(strings.TrimSpace(os.Getenv("ADMIN_EMAIL")))

	if name == "" || email == "" || !strings.Contains(email, "@") {
		log.Fatal("ADMIN_NAME atau ADMIN_EMAIL tidak valid")
	}

	fmt.Print("Masukkan password admin: ")
	passwordBytes, err := term.ReadPassword(int(syscall.Stdin))
	fmt.Println()

	if err != nil {
		log.Fatal("Gagal membaca password: ", err)
	}

	defer func() {
		for i := range passwordBytes {
			passwordBytes[i] = 0
		}
	}()

	if len(passwordBytes) < 12 || len(passwordBytes) > 72 {
		log.Fatal("Password admin harus 12 sampai 72 byte")
	}

	hash, err := bcrypt.GenerateFromPassword(
		passwordBytes,
		bcrypt.DefaultCost,
	)
	if err != nil {
		log.Fatal("Gagal membuat hash password: ", err)
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

	var id int64

	err = db.QueryRow(
		ctx,
		`INSERT INTO users
			(name, email, password_hash, role, is_active)
		 VALUES ($1, $2, $3, 'admin', TRUE)
		 RETURNING id`,
		name,
		email,
		string(hash),
	).Scan(&id)

	if err != nil {
		var pgErr *pgconn.PgError

		if errors.As(err, &pgErr) && pgErr.Code == "23505" {
			log.Fatal("Email sudah terdaftar. Gunakan email lain.")
		}

		log.Fatal("Gagal membuat admin: ", err)
	}

	fmt.Printf("Akun admin berhasil dibuat. ID: %d\n", id)
}
