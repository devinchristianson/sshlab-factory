package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"log/slog"
	"net/http"

	jwtmiddleware "github.com/auth0/go-jwt-middleware/v2"
	"github.com/auth0/go-jwt-middleware/v2/validator"
)

var validatorMiddleware jwtmiddleware.JWTMiddleware

func SetupMiddleware(jwtSecret string) {
	keyFunc := func(ctx context.Context) (interface{}, error) {
		return []byte(jwtSecret), nil
	}

	// Set up the validator.
	jwtValidator, err := validator.New(
		keyFunc,
		validator.HS256,
		"http://authconfig:7080/",
		[]string{"ssh-lab-factory"},
	)
	if err != nil {
		log.Fatalf("failed to set up the validator: %v", err)
	}

	// Set up the middleware.
	validatorMiddleware = *jwtmiddleware.New(jwtValidator.ValidateToken)
}

func UseWithMiddlewares(f func(http.ResponseWriter, *http.Request)) http.Handler {
	return errorHandlerMiddleware(validatorMiddleware.CheckJWT(verifyAuthorization(http.HandlerFunc(f))))
}
func verifyAuthorization(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		claims, ok := r.Context().Value(jwtmiddleware.ContextKey{}).(*validator.ValidatedClaims)
		if !ok {
			ErrorHandler(w, r, 401, "Could not retrieve JWT claims")
			return
		}
		if claims.RegisteredClaims.Subject == r.PathValue("name") || claims.RegisteredClaims.Subject == "config@ssh-lab-factory" {
			next.ServeHTTP(w, r)
		} else {
			ErrorHandler(w, r, 401, "Request unauthorized")
		}
	})
}

func errorHandlerMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		defer func() {
			if err := recover(); err != nil {
				slog.ErrorContext(r.Context(), err.(error).Error())
			}
		}()
		next.ServeHTTP(w, r)
	})
}

func ErrorHandler(w http.ResponseWriter, r *http.Request, status int, message string) {
	w.WriteHeader(status)
	data, _ := json.Marshal(map[string]interface{}{
		"message": message,
	})
	slog.Error(fmt.Sprintf("[%s %s]: %d - %s\n", r.URL.Path, r.Method, status, message))
	w.Header().Set("Content-Type", "application/json")
	w.Write(data)
}

func SuccessHandler(w http.ResponseWriter, r *http.Request, message string) {
	data, _ := json.Marshal(map[string]interface{}{
		"message": message,
	})
	slog.Error(fmt.Sprintf("[%s %s]: %s\n", r.URL.Path, r.Method, message))
	w.Header().Set("Content-Type", "application/json")
	w.Write(data)
}
