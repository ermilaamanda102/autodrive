package handlers

import (
	"errors"
	"log"
	"net/http"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgxpool"
)

type InquiryHandler struct {
	DB *pgxpool.Pool
}

type Inquiry struct {
	ID         int64  `json:"id"`
	BuyerID    int64  `json:"buyer_id"`
	BuyerName  string `json:"buyer_name"`
	BuyerEmail string `json:"buyer_email"`

	CarID    int64  `json:"car_id"`
	CarName  string `json:"car_name"`
	CarPrice int64  `json:"car_price"`

	SalesID *int64 `json:"sales_id"`
	Message string `json:"message"`
	Status  string `json:"status"`

	CreatedAt string `json:"created_at"`
	UpdatedAt string `json:"updated_at"`
}

type CreateInquiryRequest struct {
	CarID   int64  `json:"car_id" binding:"required,gt=0"`
	Message string `json:"message" binding:"required"`
}

type UpdateInquiryRequest struct {
	Status    string  `json:"status" binding:"required"`
	SalesNote *string `json:"sales_note"`
}

const inquirySelect = `
	SELECT
		i.id,
		i.buyer_id,
		u.name,
		u.email,
		i.car_id,
		CONCAT(c.brand, ' ', c.model),
		c.price,
		i.sales_id,
		i.message,
		i.status,
		TO_CHAR(
			i.created_at AT TIME ZONE 'UTC',
			'YYYY-MM-DD"T"HH24:MI:SS"Z"'
		),
		TO_CHAR(
			i.updated_at AT TIME ZONE 'UTC',
			'YYYY-MM-DD"T"HH24:MI:SS"Z"'
		)
	FROM car_inquiries i
	JOIN users u ON u.id = i.buyer_id
	JOIN cars c ON c.id = i.car_id
`

func scanInquiry(row pgx.Row) (Inquiry, error) {
	var item Inquiry

	err := row.Scan(
		&item.ID,
		&item.BuyerID,
		&item.BuyerName,
		&item.BuyerEmail,
		&item.CarID,
		&item.CarName,
		&item.CarPrice,
		&item.SalesID,
		&item.Message,
		&item.Status,
		&item.CreatedAt,
		&item.UpdatedAt,
	)

	return item, err
}

func validInquiryStatus(status string) bool {
	switch status {
	case "pending", "contacted", "negotiating",
		"completed", "cancelled":
		return true
	default:
		return false
	}
}

func inquiryError(
	c *gin.Context,
	code int,
	message string,
) {
	c.JSON(code, gin.H{
		"status":  "error",
		"message": message,
	})
}

// POST /api/inquiries
// Hanya untuk buyer.
func (h *InquiryHandler) Create(c *gin.Context) {
	buyerID := c.GetInt64("user_id")

	if buyerID <= 0 {
		inquiryError(
			c,
			http.StatusUnauthorized,
			"Sesi pengguna tidak valid",
		)
		return
	}

	var req CreateInquiryRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		inquiryError(
			c,
			http.StatusBadRequest,
			"ID mobil atau pesan tidak valid",
		)
		return
	}

	req.Message = strings.TrimSpace(req.Message)

	if len([]rune(req.Message)) < 5 ||
		len([]rune(req.Message)) > 2000 {
		inquiryError(
			c,
			http.StatusBadRequest,
			"Pesan harus berisi 5 sampai 2000 karakter",
		)
		return
	}

	// Gunakan transaksi untuk memastikan kendaraan
	// masih tersedia saat pengajuan dibuat.
	tx, err := h.DB.Begin(c.Request.Context())

	if err != nil {
		log.Println("Begin inquiry transaction:", err)
		inquiryError(
			c,
			http.StatusInternalServerError,
			"Gagal memproses pengajuan",
		)
		return
	}

	defer tx.Rollback(c.Request.Context())

	var status string

	err = tx.QueryRow(
		c.Request.Context(),
		`SELECT status
		 FROM cars
		 WHERE id = $1
		 FOR UPDATE`,
		req.CarID,
	).Scan(&status)

	if errors.Is(err, pgx.ErrNoRows) {
		inquiryError(
			c,
			http.StatusNotFound,
			"Mobil tidak ditemukan",
		)
		return
	}

	if err != nil {
		log.Println("Check inquiry car:", err)
		inquiryError(
			c,
			http.StatusInternalServerError,
			"Gagal memeriksa kendaraan",
		)
		return
	}

	if status != "available" {
		inquiryError(
			c,
			http.StatusConflict,
			"Mobil sudah tidak tersedia",
		)
		return
	}

	var inquiryID int64

	err = tx.QueryRow(
		c.Request.Context(),
		`INSERT INTO car_inquiries (
			buyer_id,
			car_id,
			message,
			status
		)
		VALUES ($1, $2, $3, 'pending')
		RETURNING id`,
		buyerID,
		req.CarID,
		req.Message,
	).Scan(&inquiryID)

	if err != nil {
		var pgErr *pgconn.PgError

		if errors.As(err, &pgErr) &&
			pgErr.Code == "23505" {
			inquiryError(
				c,
				http.StatusConflict,
				"Anda sudah memiliki pengajuan aktif untuk mobil ini",
			)
			return
		}

		log.Println("Insert inquiry:", err)

		inquiryError(
			c,
			http.StatusInternalServerError,
			"Gagal menyimpan pengajuan",
		)
		return
	}

	if err := tx.Commit(c.Request.Context()); err != nil {
		log.Println("Commit inquiry:", err)

		inquiryError(
			c,
			http.StatusInternalServerError,
			"Gagal menyelesaikan pengajuan",
		)
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"status":  "success",
		"message": "Pengajuan minat berhasil dikirim",
		"data": gin.H{
			"id":     inquiryID,
			"car_id": req.CarID,
			"status": "pending",
		},
	})
}

// GET /api/inquiries/my
// Buyer hanya membaca pengajuan sendiri.
func (h *InquiryHandler) MyInquiries(c *gin.Context) {
	buyerID := c.GetInt64("user_id")

	rows, err := h.DB.Query(
		c.Request.Context(),
		inquirySelect+`
		WHERE i.buyer_id = $1
		ORDER BY i.created_at DESC, i.id DESC`,
		buyerID,
	)

	if err != nil {
		log.Println("List buyer inquiries:", err)
		inquiryError(
			c,
			http.StatusInternalServerError,
			"Gagal mengambil riwayat pengajuan",
		)
		return
	}

	defer rows.Close()

	items := make([]Inquiry, 0)

	for rows.Next() {
		item, err := scanInquiry(rows)

		if err != nil {
			log.Println("Scan buyer inquiry:", err)
			inquiryError(
				c,
				http.StatusInternalServerError,
				"Gagal membaca pengajuan",
			)
			return
		}

		items = append(items, item)
	}

	if err := rows.Err(); err != nil {
		log.Println("Buyer inquiry rows:", err)
		inquiryError(
			c,
			http.StatusInternalServerError,
			"Gagal membaca riwayat pengajuan",
		)
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"status": "success",
		"total":  len(items),
		"data":   items,
	})
}

// GET /api/sales/inquiries
func (h *InquiryHandler) ListForSales(c *gin.Context) {
	rows, err := h.DB.Query(
		c.Request.Context(),
		inquirySelect+`
		ORDER BY
			CASE
				WHEN i.status = 'pending' THEN 0
				WHEN i.status = 'contacted' THEN 1
				WHEN i.status = 'negotiating' THEN 2
				ELSE 3
			END,
			i.created_at DESC,
			i.id DESC`,
	)

	if err != nil {
		log.Println("List sales inquiries:", err)
		inquiryError(
			c,
			http.StatusInternalServerError,
			"Gagal mengambil daftar pengajuan",
		)
		return
	}

	defer rows.Close()

	items := make([]Inquiry, 0)

	for rows.Next() {
		item, err := scanInquiry(rows)

		if err != nil {
			log.Println("Scan sales inquiry:", err)
			inquiryError(
				c,
				http.StatusInternalServerError,
				"Gagal membaca daftar pengajuan",
			)
			return
		}

		items = append(items, item)
	}

	if err := rows.Err(); err != nil {
		log.Println("Sales inquiry rows:", err)
		inquiryError(
			c,
			http.StatusInternalServerError,
			"Gagal membaca daftar pengajuan",
		)
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"status": "success",
		"total":  len(items),
		"data":   items,
	})
}

// GET /api/sales/inquiries/:id
func (h *InquiryHandler) GetForSales(c *gin.Context) {
	id, err := strconv.ParseInt(
		c.Param("id"),
		10,
		64,
	)

	if err != nil || id <= 0 {
		inquiryError(
			c,
			http.StatusBadRequest,
			"ID pengajuan tidak valid",
		)
		return
	}

	item, err := scanInquiry(
		h.DB.QueryRow(
			c.Request.Context(),
			inquirySelect+` WHERE i.id = $1`,
			id,
		),
	)

	if errors.Is(err, pgx.ErrNoRows) {
		inquiryError(
			c,
			http.StatusNotFound,
			"Pengajuan tidak ditemukan",
		)
		return
	}

	if err != nil {
		log.Println("Get sales inquiry:", err)
		inquiryError(
			c,
			http.StatusInternalServerError,
			"Gagal mengambil detail pengajuan",
		)
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"status": "success",
		"data":   item,
	})
}

// PATCH /api/sales/inquiries/:id
// Pembaruan status dan audit dilakukan dalam satu transaksi.
func (h *InquiryHandler) UpdateStatus(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil || id <= 0 {
		inquiryError(c, http.StatusBadRequest, "ID pengajuan tidak valid")
		return
	}
	salesID := c.GetInt64("user_id")
	if salesID <= 0 {
		inquiryError(c, http.StatusUnauthorized, "Sesi Sales tidak valid")
		return
	}
	var req UpdateInquiryRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		inquiryError(c, http.StatusBadRequest, "Data perubahan status tidak valid")
		return
	}
	req.Status = strings.TrimSpace(req.Status)
	if !validInquiryStatus(req.Status) {
		inquiryError(c, http.StatusBadRequest, "Status pengajuan tidak dikenal")
		return
	}
	if req.SalesNote != nil {
		note := strings.TrimSpace(*req.SalesNote)
		if len([]rune(note)) > 2000 || len([]byte(note)) > 2000 {
			inquiryError(c, http.StatusBadRequest, "Catatan Sales maksimal 2000 karakter/byte")
			return
		}
		req.SalesNote = &note
	}
	ctx := c.Request.Context()
	tx, err := h.DB.Begin(ctx)
	if err != nil {
		log.Println("Begin inquiry update:", err)
		inquiryError(c, http.StatusInternalServerError, "Gagal memproses pengajuan")
		return
	}
	defer tx.Rollback(ctx)
	var oldStatus string
	var ownerID *int64
	err = tx.QueryRow(ctx, `SELECT status, sales_id FROM car_inquiries WHERE id = $1 FOR UPDATE`, id).Scan(&oldStatus, &ownerID)
	if errors.Is(err, pgx.ErrNoRows) {
		inquiryError(c, http.StatusNotFound, "Pengajuan tidak ditemukan")
		return
	}
	if err != nil {
		log.Println("Lock inquiry:", err)
		inquiryError(c, http.StatusInternalServerError, "Gagal membaca pengajuan")
		return
	}
	if ownerID != nil && *ownerID != salesID {
		inquiryError(c, http.StatusForbidden, "Pengajuan sudah ditangani Sales lain")
		return
	}
	// NULL mempertahankan catatan sebelumnya. String kosong menghapusnya secara sengaja.
	_, err = tx.Exec(ctx, `UPDATE car_inquiries SET status = $1, sales_id = COALESCE(sales_id, $2), sales_note = COALESCE($3::text, sales_note) WHERE id = $4`, req.Status, salesID, req.SalesNote, id)
	if err != nil {
		log.Println("Update inquiry:", err)
		inquiryError(c, http.StatusInternalServerError, "Gagal memperbarui pengajuan")
		return
	}
	changed := oldStatus != req.Status
	if changed {
		_, err = tx.Exec(ctx, `INSERT INTO car_inquiry_history (inquiry_id, changed_by, old_status, new_status) VALUES ($1, $2, $3, $4)`, id, salesID, oldStatus, req.Status)
		if err != nil {
			log.Println("Insert inquiry history:", err)
			inquiryError(c, http.StatusInternalServerError, "Gagal mencatat riwayat pengajuan")
			return
		}
	}
	if err := tx.Commit(ctx); err != nil {
		log.Println("Commit inquiry update:", err)
		inquiryError(c, http.StatusInternalServerError, "Gagal menyimpan pengajuan")
		return
	}
	c.JSON(http.StatusOK, gin.H{"status": "success", "message": "Pengajuan berhasil diperbarui", "data": gin.H{"id": id, "status": req.Status, "status_changed": changed}})
}

// GET /api/sales/inquiries/:id/internal
// Hanya didaftarkan pada grup route dengan RequireRole("sales").
func (h *InquiryHandler) GetInternalDetail(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil || id <= 0 {
		inquiryError(c, http.StatusBadRequest, "ID pengajuan tidak valid")
		return
	}
	salesID := c.GetInt64("user_id")
	if salesID <= 0 {
		inquiryError(c, http.StatusUnauthorized, "Sesi Sales tidak valid")
		return
	}
	var note string
	var ownerID *int64
	err = h.DB.QueryRow(c.Request.Context(), `SELECT sales_note, sales_id FROM car_inquiries WHERE id = $1`, id).Scan(&note, &ownerID)
	if errors.Is(err, pgx.ErrNoRows) {
		inquiryError(c, http.StatusNotFound, "Pengajuan tidak ditemukan")
		return
	}
	if err != nil {
		log.Println("Get internal detail:", err)
		inquiryError(c, http.StatusInternalServerError, "Gagal mengambil catatan Sales")
		return
	}
	if ownerID != nil && *ownerID != salesID {
		inquiryError(c, http.StatusForbidden, "Pengajuan ditangani Sales lain")
		return
	}
	c.JSON(http.StatusOK, gin.H{"status": "success", "data": gin.H{"id": id, "sales_note": note}})
}

// GET /api/sales/inquiries/:id/history
func (h *InquiryHandler) GetHistory(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil || id <= 0 {
		inquiryError(c, http.StatusBadRequest, "ID pengajuan tidak valid")
		return
	}
	salesID := c.GetInt64("user_id")
	if salesID <= 0 {
		inquiryError(c, http.StatusUnauthorized, "Sesi Sales tidak valid")
		return
	}
	var ownerID *int64
	err = h.DB.QueryRow(c.Request.Context(), `SELECT sales_id FROM car_inquiries WHERE id = $1`, id).Scan(&ownerID)
	if errors.Is(err, pgx.ErrNoRows) {
		inquiryError(c, http.StatusNotFound, "Pengajuan tidak ditemukan")
		return
	}
	if err != nil {
		log.Println("Get history owner:", err)
		inquiryError(c, http.StatusInternalServerError, "Gagal membaca pengajuan")
		return
	}
	if ownerID != nil && *ownerID != salesID {
		inquiryError(c, http.StatusForbidden, "Pengajuan ditangani Sales lain")
		return
	}
	rows, err := h.DB.Query(c.Request.Context(), `SELECT h.id, h.old_status, h.new_status, h.changed_by, TO_CHAR(h.created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') FROM car_inquiry_history h WHERE h.inquiry_id = $1 ORDER BY h.created_at DESC, h.id DESC`, id)
	if err != nil {
		log.Println("Get inquiry history:", err)
		inquiryError(c, http.StatusInternalServerError, "Gagal mengambil riwayat status")
		return
	}
	defer rows.Close()
	type historyItem struct {
		ID        int64  `json:"id"`
		OldStatus string `json:"old_status"`
		NewStatus string `json:"new_status"`
		ChangedBy int64  `json:"changed_by"`
		ChangedAt string `json:"changed_at"`
	}
	items := make([]historyItem, 0)
	for rows.Next() {
		var item historyItem
		if err := rows.Scan(&item.ID, &item.OldStatus, &item.NewStatus, &item.ChangedBy, &item.ChangedAt); err != nil {
			log.Println("Scan inquiry history:", err)
			inquiryError(c, http.StatusInternalServerError, "Gagal membaca riwayat status")
			return
		}
		items = append(items, item)
	}
	if err := rows.Err(); err != nil {
		log.Println("History rows:", err)
		inquiryError(c, http.StatusInternalServerError, "Gagal membaca riwayat status")
		return
	}
	c.JSON(http.StatusOK, gin.H{"status": "success", "total": len(items), "data": items})
}
