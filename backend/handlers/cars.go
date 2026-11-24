package handlers

import (
	"net/http"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"
)

type CarHandler struct {
	DB *pgxpool.Pool
}

type CarInput struct {
	Brand        string `json:"brand" binding:"required"`
	Model        string `json:"model" binding:"required"`
	Year         int    `json:"year" binding:"required"`
	Price        int64  `json:"price" binding:"required"`
	Transmission string `json:"transmission" binding:"required"`
	FuelType     string `json:"fuel_type" binding:"required"`
	Seats        int    `json:"seats" binding:"required"`
	Description  string `json:"description"`
	Status       string `json:"status" binding:"required"`
	ImageURL     string `json:"image_url"`
}

type CarRecord struct {
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

func validateCar(input *CarInput) string {
	input.Brand = strings.TrimSpace(input.Brand)
	input.Model = strings.TrimSpace(input.Model)
	input.Transmission = strings.TrimSpace(input.Transmission)
	input.FuelType = strings.TrimSpace(input.FuelType)
	input.Description = strings.TrimSpace(input.Description)
	input.Status = strings.TrimSpace(input.Status)
	input.ImageURL = strings.TrimSpace(input.ImageURL)

	if input.Brand == "" || input.Model == "" {
		return "Merek dan model wajib diisi"
	}
	if input.Year < 1900 || input.Year > 2100 {
		return "Tahun mobil tidak valid"
	}
	if input.Price <= 0 {
		return "Harga harus lebih dari nol"
	}
	if input.Seats < 1 || input.Seats > 100 {
		return "Jumlah kursi tidak valid"
	}
	if input.Transmission == "" || input.FuelType == "" {
		return "Transmisi dan bahan bakar wajib diisi"
	}
	if input.Status == "" {
		return "Status wajib diisi"
	}

	return ""
}

func (h *CarHandler) List(c *gin.Context) {
	rows, err := h.DB.Query(
		c.Request.Context(),
		`SELECT
			id, brand, model, year, price,
			transmission, fuel_type, seats,
			COALESCE(description, ''),
			status, COALESCE(image_url, '')
		 FROM cars
		 ORDER BY id DESC`,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"message": "Gagal mengambil data mobil",
		})
		return
	}
	defer rows.Close()

	cars := make([]CarRecord, 0)

	for rows.Next() {
		var car CarRecord

		err := rows.Scan(
			&car.ID,
			&car.Brand,
			&car.Model,
			&car.Year,
			&car.Price,
			&car.Transmission,
			&car.FuelType,
			&car.Seats,
			&car.Description,
			&car.Status,
			&car.ImageURL,
		)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"message": "Gagal membaca data mobil",
			})
			return
		}

		cars = append(cars, car)
	}

	if err := rows.Err(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"message": "Gagal membaca daftar mobil",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"status": "success",
		"data":   cars,
	})
}

func (h *CarHandler) Create(c *gin.Context) {
	var input CarInput

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"message": "Format data mobil tidak valid",
		})
		return
	}

	if message := validateCar(&input); message != "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"message": message,
		})
		return
	}

	var id int64

	err := h.DB.QueryRow(
		c.Request.Context(),
		`INSERT INTO cars (
			brand, model, year, price,
			transmission, fuel_type, seats,
			description, status, image_url
		) VALUES (
			$1, $2, $3, $4, $5,
			$6, $7, $8, $9, $10
		) RETURNING id`,
		input.Brand,
		input.Model,
		input.Year,
		input.Price,
		input.Transmission,
		input.FuelType,
		input.Seats,
		input.Description,
		input.Status,
		input.ImageURL,
	).Scan(&id)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"message": "Gagal menyimpan mobil",
		})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"status":  "success",
		"message": "Mobil berhasil ditambahkan",
		"data": gin.H{
			"id": id,
		},
	})
}

func (h *CarHandler) Update(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil || id <= 0 {
		c.JSON(http.StatusBadRequest, gin.H{
			"message": "ID mobil tidak valid",
		})
		return
	}

	var input CarInput

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"message": "Format data mobil tidak valid",
		})
		return
	}

	if message := validateCar(&input); message != "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"message": message,
		})
		return
	}

	tag, err := h.DB.Exec(
		c.Request.Context(),
		`UPDATE cars SET
			brand = $1,
			model = $2,
			year = $3,
			price = $4,
			transmission = $5,
			fuel_type = $6,
			seats = $7,
			description = $8,
			status = $9,
			image_url = $10
		 WHERE id = $11`,
		input.Brand,
		input.Model,
		input.Year,
		input.Price,
		input.Transmission,
		input.FuelType,
		input.Seats,
		input.Description,
		input.Status,
		input.ImageURL,
		id,
	)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"message": "Gagal memperbarui mobil",
		})
		return
	}

	if tag.RowsAffected() == 0 {
		c.JSON(http.StatusNotFound, gin.H{
			"message": "Mobil tidak ditemukan",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"status":  "success",
		"message": "Mobil berhasil diperbarui",
	})
}

func (h *CarHandler) Delete(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil || id <= 0 {
		c.JSON(http.StatusBadRequest, gin.H{
			"message": "ID mobil tidak valid",
		})
		return
	}

	tag, err := h.DB.Exec(
		c.Request.Context(),
		`DELETE FROM cars WHERE id = $1`,
		id,
	)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"message": "Gagal menghapus mobil",
		})
		return
	}

	if tag.RowsAffected() == 0 {
		c.JSON(http.StatusNotFound, gin.H{
			"message": "Mobil tidak ditemukan",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"status":  "success",
		"message": "Mobil berhasil dihapus",
	})
}
