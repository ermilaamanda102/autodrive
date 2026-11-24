package handlers

import (
	"net/http"

	"autodrive/backend/recommendation"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"
)

type SensitivityHandler struct {
	DB *pgxpool.Pool
}

func (h *SensitivityHandler) Analyze(c *gin.Context) {
	var prefs recommendation.Preferences

	if err := c.ShouldBindJSON(&prefs); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"status":  "error",
			"message": "Format preferensi tidak valid",
		})
		return
	}

	rows, err := h.DB.Query(
		c.Request.Context(),
		`SELECT
			id, brand, model, year, price,
			transmission, fuel_type, seats,
			COALESCE(description, ''),
			status,
			COALESCE(image_url, '')
		FROM cars
		WHERE status = 'available'
		ORDER BY id ASC`,
	)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"status":  "error",
			"message": "Gagal mengambil data mobil",
		})
		return
	}
	defer rows.Close()

	cars := make([]recommendation.Car, 0)

	for rows.Next() {
		var car recommendation.Car

		if err := rows.Scan(
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
		); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"status":  "error",
				"message": "Gagal membaca data mobil",
			})
			return
		}

		cars = append(cars, car)
	}

	if err := rows.Err(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"status":  "error",
			"message": "Gagal membaca daftar mobil",
		})
		return
	}

	result, err := recommendation.AnalyzeSensitivity(
		cars,
		prefs,
	)

	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"status":  "error",
			"message": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"status": "success",
		"data":   result,
	})
}
