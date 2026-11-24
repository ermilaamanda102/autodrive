package middleware

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type Claims struct {
	UserID int64 `json:"user_id"`
	jwt.RegisteredClaims
}

func AuthMiddleware(
	db *pgxpool.Pool,
	secret []byte,
) gin.HandlerFunc {
	return func(c *gin.Context) {
		header := c.GetHeader("Authorization")
		parts := strings.Fields(header)

		if len(parts) != 2 ||
			!strings.EqualFold(parts[0], "Bearer") {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{
				"status":  "error",
				"message": "Token diperlukan",
			})
			return
		}

		claims := &Claims{}

		token, err := jwt.ParseWithClaims(
			parts[1],
			claims,
			func(token *jwt.Token) (interface{}, error) {
				return secret, nil
			},
			jwt.WithValidMethods([]string{"HS256"}),
			jwt.WithIssuer("autodrive"),
			jwt.WithExpirationRequired(),
		)

		if err != nil || !token.Valid || claims.UserID <= 0 {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{
				"status":  "error",
				"message": "Token tidak valid",
			})
			return
		}

		var (
			name     string
			email    string
			role     string
			isActive bool
		)

		err = db.QueryRow(
			c.Request.Context(),
			`SELECT name, email, role, is_active
			 FROM users
			 WHERE id = $1`,
			claims.UserID,
		).Scan(&name, &email, &role, &isActive)

		if err != nil {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{
				"status":  "error",
				"message": "Akun tidak ditemukan",
			})
			return
		}

		if !isActive {
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{
				"status":  "error",
				"message": "Akun telah dinonaktifkan",
			})
			return
		}

		c.Set("user_id", claims.UserID)
		c.Set("name", name)
		c.Set("email", email)
		c.Set("role", role)

		c.Next()
	}
}

func RequireRole(roles ...string) gin.HandlerFunc {
	return func(c *gin.Context) {
		userRole := c.GetString("role")

		for _, role := range roles {
			if userRole == role {
				c.Next()
				return
			}
		}

		c.AbortWithStatusJSON(http.StatusForbidden, gin.H{
			"status":  "error",
			"message": "Anda tidak memiliki akses",
		})
	}
}
