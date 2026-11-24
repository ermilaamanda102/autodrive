package main

import (
	"context"
	"errors"
	"log"
	"net/http"
	"os"
	"strconv"
	"time"

	"autodrive/backend/handlers"
	"autodrive/backend/middleware"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/joho/godotenv"
)

type Car struct {
	ID           int64  `json:"id"`
	Brand        string `json:"brand"`
	Model        string `json:"model"`
	Year         int    `json:"year"`
	Price        int64  `json:"price"`
	Transmission string `json:"transmission"`
	FuelType     string `json:"fuel_type"`
	Seats        int    `json:"seats"`
	Description  string `json:"description"`
	Status       string `json:"status"`
	ImageURL     string `json:"image_url"`
}

func main() {
	if err := godotenv.Load(); err != nil {
		log.Println("File .env tidak ditemukan, menggunakan environment sistem")
	}
	databaseURL := os.Getenv("DATABASE_URL")
	if databaseURL == "" {
		log.Fatal("DATABASE_URL belum diatur")
	}
	jwtSecret := os.Getenv("JWT_SECRET")
	if len(jwtSecret) < 32 {
		log.Fatal("JWT_SECRET wajib diisi minimal 32 karakter")
	}

	ctx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
	defer cancel()
	db, err := pgxpool.New(ctx, databaseURL)
	if err != nil {
		log.Fatal("Gagal membuat koneksi database: ", err)
	}
	defer db.Close()
	if err := db.Ping(ctx); err != nil {
		log.Fatal("Database tidak dapat diakses: ", err)
	}
	log.Println("Berhasil terhubung ke PostgreSQL Neon!")

	authHandler := &handlers.AuthHandler{DB: db, JWTSecret: []byte(jwtSecret)}
	carHandler := &handlers.CarHandler{DB: db}
	recommendationHandler := &handlers.RecommendationHandler{DB: db}
	inquiryHandler := &handlers.InquiryHandler{DB: db}

	router := gin.Default()
	if err := router.SetTrustedProxies(nil); err != nil {
		log.Fatal("Gagal mengatur trusted proxies: ", err)
	}
	router.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:3000", "http://127.0.0.1:3000"},
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
		AllowCredentials: true,
	}))

	router.GET("/api/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "success", "message": "AutoDrive API berjalan", "database": "connected"})
	})

	router.POST("/api/auth/register", authHandler.Register)
	router.POST("/api/auth/login", authHandler.Login)
	router.GET("/api/auth/me", middleware.AuthMiddleware(db, []byte(jwtSecret)), authHandler.Me)

	router.GET("/api/admin/test", middleware.AuthMiddleware(db, []byte(jwtSecret)), middleware.RequireRole("admin"), func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "success", "message": "Akses admin berhasil"})
	})

	adminCars := router.Group("/api/admin/cars")
	adminCars.Use(middleware.AuthMiddleware(db, []byte(jwtSecret)), middleware.RequireRole("admin"))
	adminCars.GET("", carHandler.List)
	adminCars.POST("", carHandler.Create)
	adminCars.PUT("/:id", carHandler.Update)
	adminCars.DELETE("/:id", carHandler.Delete)

	router.POST("/api/recommendations", recommendationHandler.Calculate)

	buyerInquiries := router.Group("/api/inquiries")
	buyerInquiries.Use(middleware.AuthMiddleware(db, []byte(jwtSecret)), middleware.RequireRole("buyer"))
	buyerInquiries.POST("", inquiryHandler.Create)
	buyerInquiries.GET("/my", inquiryHandler.MyInquiries)

	salesInquiries := router.Group("/api/sales/inquiries")
	salesInquiries.Use(middleware.AuthMiddleware(db, []byte(jwtSecret)), middleware.RequireRole("sales"))
	salesInquiries.GET("", inquiryHandler.ListForSales)
	salesInquiries.GET("/:id", inquiryHandler.GetForSales)
	salesInquiries.GET("/:id/internal", inquiryHandler.GetInternalDetail)
	salesInquiries.GET("/:id/history", inquiryHandler.GetHistory)
	salesInquiries.PATCH("/:id", inquiryHandler.UpdateStatus)

	router.GET("/api/cars", func(c *gin.Context) {
		rows, err := db.Query(c.Request.Context(), `SELECT id, brand, model, year, price, transmission, fuel_type, seats, COALESCE(description, ''), status, COALESCE(image_url, '') FROM cars WHERE status = 'available' ORDER BY id ASC`)
		if err != nil {
			log.Println("Query mobil gagal: ", err)
			c.JSON(http.StatusInternalServerError, gin.H{"status": "error", "message": "Gagal mengambil data mobil"})
			return
		}
		defer rows.Close()
		cars := make([]Car, 0)
		for rows.Next() {
			var car Car
			if err := rows.Scan(&car.ID, &car.Brand, &car.Model, &car.Year, &car.Price, &car.Transmission, &car.FuelType, &car.Seats, &car.Description, &car.Status, &car.ImageURL); err != nil {
				log.Println("Scan mobil gagal: ", err)
				c.JSON(http.StatusInternalServerError, gin.H{"status": "error", "message": "Gagal membaca data mobil"})
				return
			}
			cars = append(cars, car)
		}
		if err := rows.Err(); err != nil {
			log.Println("Rows error: ", err)
			c.JSON(http.StatusInternalServerError, gin.H{"status": "error", "message": "Terjadi kesalahan saat membaca data"})
			return
		}
		c.JSON(http.StatusOK, gin.H{"status": "success", "message": "Data mobil berhasil diambil", "total": len(cars), "data": cars})
	})

	router.GET("/api/cars/:id", func(c *gin.Context) {
		id, err := strconv.ParseInt(c.Param("id"), 10, 64)
		if err != nil || id <= 0 {
			c.JSON(http.StatusBadRequest, gin.H{"status": "error", "message": "ID mobil tidak valid"})
			return
		}
		var car Car
		err = db.QueryRow(c.Request.Context(), `SELECT id, brand, model, year, price, transmission, fuel_type, seats, COALESCE(description, ''), status, COALESCE(image_url, '') FROM cars WHERE id = $1 AND status = 'available'`, id).Scan(&car.ID, &car.Brand, &car.Model, &car.Year, &car.Price, &car.Transmission, &car.FuelType, &car.Seats, &car.Description, &car.Status, &car.ImageURL)
		if errors.Is(err, pgx.ErrNoRows) {
			c.JSON(http.StatusNotFound, gin.H{"status": "error", "message": "Mobil tidak ditemukan"})
			return
		}
		if err != nil {
			log.Println("Detail mobil gagal: ", err)
			c.JSON(http.StatusInternalServerError, gin.H{"status": "error", "message": "Gagal mengambil detail mobil"})
			return
		}
		c.JSON(http.StatusOK, gin.H{"status": "success", "message": "Detail mobil berhasil diambil", "data": car})
	})

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	log.Println("AutoDrive API berjalan di port: ", port)
	if err := router.Run(":" + port); err != nil {
		log.Fatal("Gagal menjalankan server: ", err)
	}
}
