package handlers

import (
	"errors"
	"log"
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgxpool"
	"golang.org/x/crypto/bcrypt"
)

// ==========================================
// AUTH HANDLER
// ==========================================

type AuthHandler struct {
	DB        *pgxpool.Pool
	JWTSecret []byte
}

// ==========================================
// REQUEST STRUCTURES
// ==========================================

type RegisterRequest struct {
	Name     string `json:"name" binding:"required"`
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required,min=8"`
}

type LoginRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

// ==========================================
// JWT CLAIMS
// ==========================================

type Claims struct {
	UserID int64  `json:"user_id"`
	Name   string `json:"name"`
	Email  string `json:"email"`
	Role   string `json:"role"`

	jwt.RegisteredClaims
}

// ==========================================
// GENERATE JWT
// ==========================================

func (h *AuthHandler) generateToken(
	id int64,
	name string,
	email string,
	role string,
) (string, error) {
	now := time.Now()

	claims := Claims{
		UserID: id,
		Name:   name,
		Email:  email,
		Role:   role,

		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(
				now.Add(24 * time.Hour),
			),
			IssuedAt: jwt.NewNumericDate(now),
			Issuer:   "autodrive",
		},
	}

	token := jwt.NewWithClaims(
		jwt.SigningMethodHS256,
		claims,
	)

	return token.SignedString(h.JWTSecret)
}

// ==========================================
// REGISTER
// POST /api/auth/register
// ==========================================

func (h *AuthHandler) Register(c *gin.Context) {
	var req RegisterRequest

	// Validasi input registrasi
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"status":  "error",
			"message": "Data registrasi tidak valid. Password minimal 8 karakter.",
		})
		return
	}

	name := strings.TrimSpace(req.Name)
	email := strings.ToLower(strings.TrimSpace(req.Email))

	if name == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"status":  "error",
			"message": "Nama wajib diisi",
		})
		return
	}

	// Bcrypt memiliki batas password 72 byte
	if len([]byte(req.Password)) > 72 {
		c.JSON(http.StatusBadRequest, gin.H{
			"status":  "error",
			"message": "Password terlalu panjang untuk bcrypt",
		})
		return
	}

	// Hash password
	hashedPassword, err := bcrypt.GenerateFromPassword(
		[]byte(req.Password),
		bcrypt.DefaultCost,
	)

	if err != nil {
		log.Println("Password hashing gagal:", err)

		c.JSON(http.StatusInternalServerError, gin.H{
			"status":  "error",
			"message": "Gagal mengamankan password",
		})
		return
	}

	// Registrasi publik hanya boleh membuat akun buyer
	var userID int64

	err = h.DB.QueryRow(
		c.Request.Context(),
		`INSERT INTO users
			(name, email, password_hash, role, is_active)
		 VALUES ($1, $2, $3, 'buyer', TRUE)
		 RETURNING id`,
		name,
		email,
		string(hashedPassword),
	).Scan(&userID)

	if err != nil {
		var pgErr *pgconn.PgError

		if errors.As(err, &pgErr) && pgErr.Code == "23505" {
			c.JSON(http.StatusConflict, gin.H{
				"status":  "error",
				"message": "Email sudah terdaftar",
			})
			return
		}

		log.Println("Registrasi gagal:", err)

		c.JSON(http.StatusInternalServerError, gin.H{
			"status":  "error",
			"message": "Gagal membuat akun",
		})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"status":  "success",
		"message": "Registrasi berhasil",
		"data": gin.H{
			"id":    userID,
			"name":  name,
			"email": email,
			"role":  "buyer",
		},
	})
}

// ==========================================
// LOGIN
// POST /api/auth/login
// ==========================================

func (h *AuthHandler) Login(c *gin.Context) {
	var req LoginRequest

	// Validasi input login
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"status":  "error",
			"message": "Email atau password tidak valid",
		})
		return
	}

	// Normalisasi email
	email := strings.ToLower(strings.TrimSpace(req.Email))

	var (
		id           int64
		name         string
		passwordHash string
		role         string
		isActive     bool
	)

	// Ambil data pengguna berdasarkan email
	err := h.DB.QueryRow(
		c.Request.Context(),
		`SELECT id, name, password_hash, role, is_active
		 FROM users
		 WHERE email = $1`,
		email,
	).Scan(
		&id,
		&name,
		&passwordHash,
		&role,
		&isActive,
	)

	if errors.Is(err, pgx.ErrNoRows) {
		c.JSON(http.StatusUnauthorized, gin.H{
			"status":  "error",
			"message": "Email atau password salah",
		})
		return
	}

	if err != nil {
		log.Println("Login query gagal:", err)

		c.JSON(http.StatusInternalServerError, gin.H{
			"status":  "error",
			"message": "Gagal memproses login",
		})
		return
	}

	// Verifikasi password
	err = bcrypt.CompareHashAndPassword(
		[]byte(passwordHash),
		[]byte(req.Password),
	)

	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{
			"status":  "error",
			"message": "Email atau password salah",
		})
		return
	}

	// Tolak login apabila akun dinonaktifkan
	if !isActive {
		c.JSON(http.StatusForbidden, gin.H{
			"status":  "error",
			"message": "Akun Anda telah dinonaktifkan. Hubungi administrator.",
		})
		return
	}

	// Buat JWT setelah password dan status akun valid
	token, err := h.generateToken(
		id,
		name,
		email,
		role,
	)

	if err != nil {
		log.Println("JWT gagal dibuat:", err)

		c.JSON(http.StatusInternalServerError, gin.H{
			"status":  "error",
			"message": "Gagal membuat token",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"status":  "success",
		"message": "Login berhasil",
		"token":   token,
		"data": gin.H{
			"id":    id,
			"name":  name,
			"email": email,
			"role":  role,
		},
	})
}

// ==========================================
// CURRENT USER PROFILE
// GET /api/auth/me
// ==========================================

func (h *AuthHandler) Me(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"status":  "success",
		"message": "Data pengguna berhasil diambil",
		"data": gin.H{
			"id":    c.GetInt64("user_id"),
			"name":  c.GetString("name"),
			"email": c.GetString("email"),
			"role":  c.GetString("role"),
		},
	})
}
