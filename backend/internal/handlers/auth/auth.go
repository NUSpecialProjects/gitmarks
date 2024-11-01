package auth

import (
	"fmt"
	"log"
	"strconv"
	"strings"
	"time"

	"github.com/CamPlume1/khoury-classroom/internal/github/userclient"
	"github.com/CamPlume1/khoury-classroom/internal/middleware"
	"github.com/CamPlume1/khoury-classroom/internal/models"
	"github.com/gofiber/fiber/v2"
)

func (service *AuthService) Ping() fiber.Handler {
	return func(c *fiber.Ctx) error {
		return c.Status(200).JSON(fiber.Map{
			"message": `Back in the good old days -- the "Golden Era" of computers, it was easy to separate the men from the boys (sometimes called "Real Men" and "Quiche Eaters" in the literature). During this period, the Real Men were the ones that understood computer programming, and the Quiche Eaters were the ones that didn't. A real computer programmer said things like "DO 10 I=1,10" and "ABEND" (they actually talked in capital letters, you understand), and the rest of the world said things like "computers are too complicated for me" and "I can't relate to computers -- they're so impersonal". (A previous work [1] points out that Real Men don't "relate" to anything, and aren't afraid of being impersonal.)

			But, as usual, times change. We are faced today with a world in which little old ladies can get computers in their microwave ovens, 12-year-old kids can blow Real Men out of the water playing Asteroids and Pac-Man, and anyone can buy and even understand their very own Personal Computer. The Real Programmer is in danger of becoming extinct, of being replaced by high-school students with TRASH-80's.

			There is a clear need to point out the differences between the typical high-school junior Pac-Man player and a Real Programmer. If this difference is made clear, it will give these kids something to aspire to -- a role model, a Father Figure. It will also help explain to the employers of Real Programmers why it would be a mistake to replace the Real Programmers on their staff with 12-year-old Pac-Man players (at a considerable salary savings).`})
	}
}

func (service *AuthService) GetCallbackURL() fiber.Handler {
	return func(c *fiber.Ctx) error {
		oAuthCfg := service.userCfg.OAuthConfig()
		clientID := oAuthCfg.ClientID
		redirectURI := oAuthCfg.RedirectURL
		scope := strings.Join(service.userCfg.Scopes, ",")
		allowSignup := "false"
		authURL := fmt.Sprintf("https://github.com/login/oauth/authorize?client_id=%s&redirect_uri=%s&scope=%s&allow_signup=%s",
			clientID, redirectURI, scope, allowSignup)

		return c.Status(200).JSON(fiber.Map{"url": authURL})
	}
}

func (service *AuthService) Login() fiber.Handler {
	return func(c *fiber.Ctx) error {
		// Extract code from the request body
		var requestBody struct {
			Code string `json:"code"`
		}
		if err := c.BodyParser(&requestBody); err != nil {
			return c.Status(400).JSON(fiber.Map{"error": "invalid request body"})
		}
		code := requestBody.Code
		// create client
		client, err := userclient.NewFromCode(service.userCfg, code)
		if err != nil {
			return c.Status(500).JSON(fiber.Map{"error": err.Error()})
		}

		user, err := client.GetCurrentUser(c.Context())
		if err != nil {
			return c.Status(500).JSON(fiber.Map{"error": err.Error()})
		}

		// Convert user.ID to string
		userID := strconv.FormatInt(user.ID, 10)

		timeToExp := 24 * time.Hour
		expirationTime := time.Now().Add(timeToExp)

		err = service.store.CreateSession(c.Context(), models.Session{
			GitHubUserID: user.ID,
			AccessToken:  client.Token.AccessToken,
			TokenType:    client.Token.TokenType,
			RefreshToken: client.Token.RefreshToken,
			ExpiresIn:    int64(timeToExp.Seconds()),
		})

		if err != nil {
			return c.Status(500).JSON(fiber.Map{"error": "failed to create session"})
		}

		// Generate JWT token
		jwtToken, err := middleware.GenerateJWT(userID, expirationTime, service.userCfg.JWTSecret)
		if err != nil {
			return c.Status(500).JSON(fiber.Map{"error": "failed to generate JWT token"})
		}

		c.Cookie(&fiber.Cookie{
			Name:     "jwt_cookie",
			Value:    jwtToken,
			Expires:  expirationTime,
			HTTPOnly: true,
			Secure:   true,
			SameSite: "None",
			Path:     "/",
		})

		return c.Status(200).JSON("Successfully logged in")
	}
}

func (service *AuthService) GetCurrentUser() fiber.Handler {
	return func(c *fiber.Ctx) error {
		client, err := middleware.GetClient(c, service.store, service.userCfg)
		if err != nil {
			log.Default().Println("FAILED TO GET CLIENT", err)
			return c.Status(500).JSON(fiber.Map{"error": "failed to create client"})
		}

		user, err := client.GetCurrentUser(c.Context())
		if err != nil {
			log.Default().Println("FAILED TO GET USER", err)
			return c.Status(500).JSON(fiber.Map{"error": "failed to fetch user"})
		}

		//TODO: include the user's role (i.e. professor, TA, student) in the response
		return c.Status(200).JSON(user)
	}
}

func (service *AuthService) Logout() fiber.Handler {
	return func(c *fiber.Ctx) error {
		userID, ok := c.Locals("userID").(int64)
		if !ok {
			return c.Status(500).JSON(fiber.Map{"error": "failed to retrieve userID from context"})
		}

		err := service.store.DeleteSession(c.Context(), userID)
		if err != nil {
			return c.Status(500).JSON(fiber.Map{"error": "failed to delete session"})
		}

		return c.Status(200).JSON("Successfully logged out")
	}
}