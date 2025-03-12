package middleware

import (
	"errors"
	"net/http"
	"strconv"
	"time"

	"github.com/CamPlume1/khoury-classroom/internal/config"
	"github.com/CamPlume1/khoury-classroom/internal/errs"
	"github.com/CamPlume1/khoury-classroom/internal/github"
	"github.com/CamPlume1/khoury-classroom/internal/github/userclient"
	"github.com/CamPlume1/khoury-classroom/internal/models"
	"github.com/CamPlume1/khoury-classroom/internal/storage"
	"github.com/gofiber/fiber/v2"
	"github.com/golang-jwt/jwt"
)

func GenerateJWT(userID string, expirationTime time.Time, secret string) (string, error) {
	claims := &jwt.StandardClaims{
		Subject:   userID,
		ExpiresAt: expirationTime.Unix(),
		IssuedAt:  time.Now().Unix(),
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	jwtToken, err := token.SignedString([]byte(secret))
	if err != nil {
		return "", err
	}
	return jwtToken, nil
}

func ParseJWT(tokenString string, secret string) (*jwt.StandardClaims, error) {
	claims := &jwt.StandardClaims{}
	token, err := jwt.ParseWithClaims(tokenString, claims, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, errors.New("unexpected signing method")
		}
		return []byte(secret), nil
	})
	if err != nil {
		return nil, err
	}
	if !token.Valid {
		return nil, errors.New("invalid token")
	}
	return claims, nil
}

func Protected(secret string) fiber.Handler {
	return func(c *fiber.Ctx) error {
		// Extract and validate JWT token
		token := c.Cookies("jwt_cookie", "")
		if token == "" {
			return c.Status(http.StatusUnauthorized).JSON(fiber.Map{"error": "missing or invalid JWT token"})
		}

		claims, err := ParseJWT(token, secret)
		if err != nil {
			return c.Status(http.StatusUnauthorized).JSON(fiber.Map{"error": "invalid JWT token"})
		}

		// Set userID in context
		userID, err := strconv.ParseInt(claims.Subject, 10, 64)
		if err != nil {
			return c.Status(http.StatusInternalServerError).JSON(fiber.Map{"error": "failed to parse userID from token"})
		}
		c.Locals("userID", userID)

		return c.Next()
	}
}

/* Warning: Usage of Protected Middleware is a prerequisite to the use of this function */
func GetClient(c *fiber.Ctx, store storage.Storage, userCfg *config.GitHubUserClient) (github.GitHubUserClient, error) {
	userID, ok := c.Locals("userID").(int64)
	if !ok {
		return nil, errs.NewAPIError(500, errors.New("failed to retrieve userID from context"))
	}

	session, err := store.GetSession(c.Context(), userID)
	if err != nil {
		return nil, err
	}

	client, err := userclient.NewFromSession(userCfg.OAuthConfig(), &session)

	if err != nil {
		return nil, err
	}

	return client, nil
}

func GetClientAndUser(c *fiber.Ctx, store storage.Storage, userCfg *config.GitHubUserClient) (github.GitHubUserClient, models.GitHubUser, models.User, error) {
	client, err := GetClient(c, store, userCfg)
	if err != nil {
		return nil, models.GitHubUser{}, models.User{}, errs.AuthenticationError()
	}

	currentGitHubUser, err := client.GetCurrentUser(c.Context())
	if err != nil {
		return nil, models.GitHubUser{}, models.User{}, errs.AuthenticationError()
	}

	user, err := store.GetUserByGitHubID(c.Context(), currentGitHubUser.ID)
	if err != nil {
		return nil, models.GitHubUser{}, models.User{}, errs.AuthenticationError()
	}

	return client, currentGitHubUser, user, nil
}
