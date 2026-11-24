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
	// Membaca konfigurasi backend/.env
	_ = godotenv.Load()

	databaseURL := os.Getenv("DATABASE_URL")

	if databaseURL == "" {
		log.Fatal("DATABASE_URL belum diatur")
	}

	// Mengambil nama dan email Sales dari .env
	name := strings.TrimSpace(os.Getenv("SALES_NAME"))
	email := strings.ToLower(
		strings.TrimSpace(os.Getenv("SALES_EMAIL")),
	)

	if name == "" || email == "" || !strings.Contains(email, "@") {
		log.Fatal("SALES_NAME atau SALES_EMAIL tidak valid")
	}

	// Meminta password tanpa menampilkannya
	fmt.Print("Masukkan password Sales: ")

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
		log.Fatal("Password Sales harus 12 sampai 72 byte")
	}

	// Mengenkripsi password menggunakan bcrypt
	passwordHash, err := bcrypt.GenerateFromPassword(
		passwordBytes,
		bcrypt.DefaultCost,
	)

	if err != nil {
		log.Fatal("Gagal membuat password hash: ", err)
	}

	// Menghubungkan program ke Neon PostgreSQL
	ctx, cancel := context.WithTimeout(
		context.Background(),
		15*time.Second,
	)
	defer cancel()

	db, err := pgxpool.New(ctx, databaseURL)

	if err != nil {
		log.Fatal("Gagal membuat koneksi database: ", err)
	}

	defer db.Close()

	// Menyimpan akun dengan role SALES
	var salesID int64

	err = db.QueryRow(
		ctx,
		`INSERT INTO users
			(name, email, password_hash, role, is_active)
		 VALUES ($1, $2, $3, 'sales', TRUE)
		 RETURNING id`,
		name,
		email,
		string(passwordHash),
	).Scan(&salesID)

	if err != nil {
		var pgErr *pgconn.PgError

		if errors.As(err, &pgErr) && pgErr.Code == "23505" {
			log.Fatal("Email Sales sudah terdaftar")
		}

		log.Fatal("Gagal menyimpan akun Sales: ", err)
	}

	fmt.Println("=================================")
	fmt.Println("AKUN SALES BERHASIL DIBUAT")
	fmt.Println("=================================")
	fmt.Println("ID:", salesID)
	fmt.Println("Nama:", name)
	fmt.Println("Email:", email)
	fmt.Println("Role: sales")
	fmt.Println("Status: aktif")
}
