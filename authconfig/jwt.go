package main

import (
	"time"

	"github.com/golang-jwt/jwt/v5"
)

type JWTGenerator struct {
	key string
}

func (j JWTGenerator) User(username string) string {
	return j.createSignedJwtToken(username)
}

func (j JWTGenerator) Server() string {
	return j.createSignedJwtToken("config@ssh-lab-factory")
}
func (j JWTGenerator) createSignedJwtToken(sub string) string {
	result, err := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.RegisteredClaims{
		Issuer:   "http://authconfig:7080/",
		Audience: append(make(jwt.ClaimStrings, 0), "ssh-lab-factory"), // because golang is WEIRD
		ExpiresAt: &jwt.NumericDate{
			Time: time.Now().Add(time.Hour * 24 * 14),
		},
		Subject: sub,
	}).SignedString([]byte(j.key))
	if err != nil {
		panic(err.Error())
	}
	return result
}
