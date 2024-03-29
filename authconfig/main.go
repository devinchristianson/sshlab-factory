package main

import (
	"context"
	"encoding/base32"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"strings"
	"syscall"
	"time"

	"github.com/docker/docker/api/types/container"
	"github.com/pquerna/otp"
	"github.com/pquerna/otp/totp"
	"go.containerssh.io/libcontainerssh/auth"
	"go.containerssh.io/libcontainerssh/config"
	"go.containerssh.io/libcontainerssh/metadata"
)

func ErrorHandler(ctx context.Context, w http.ResponseWriter, status int, message string) {
	w.WriteHeader(status)
	data, _ := json.Marshal(map[string]interface{}{
		"message": message,
	})
	slog.ErrorContext(ctx, message)
	w.Header().Set("Content-Type", "application/json")
	w.Write(data)
}

func main() {
	runtime := Load()
	mux := http.NewServeMux()
	mux.HandleFunc("/auth/password", func(w http.ResponseWriter, r *http.Request) {
		decoder := json.NewDecoder(r.Body)
		var req auth.PasswordAuthRequest
		err := decoder.Decode(&req)
		if err != nil {
			ErrorHandler(r.Context(), w, 500, err.Error())
			return
		}
		username, environment := SplitUsername(req.Username)
		slog.InfoContext(r.Context(), fmt.Sprintf("User %s is attempting login to %s with password %s", username, environment, req.Password))
		groups := runtime.config.GetUserGroups(username)
		slog.DebugContext(r.Context(), fmt.Sprintf("User %s is in groups %s", username, groups))
		// if user is in a group and some group matches the selected environment
		if len(groups) > 0 && runtime.config.IsUserAllowedInEnv(username, environment) {
			code, err := base64.StdEncoding.DecodeString(req.Password)
			slog.InfoContext(r.Context(), string(code))
			if err != nil {
				slog.ErrorContext(r.Context(), "Failed to decode base64: "+err.Error())
			}
			key := base32.StdEncoding.EncodeToString([]byte(username + runtime.jwt.key))
			slog.DebugContext(r.Context(), fmt.Sprint(time.Now().UnixMilli()))
			totpResult, err := totp.ValidateCustom(string(code), key, time.Now(), totp.ValidateOpts{
				Algorithm: otp.AlgorithmSHA256,
				Digits:    otp.DigitsSix,
			})
			if err != nil {
				slog.ErrorContext(r.Context(), "TOTP validate failed with: "+err.Error())
			} else if totpResult {
				runtime.RegisterConnection(r.Context(), req.Username, req.ConnectionID)
				resp, err := json.Marshal(auth.ResponseBody{
					ConnectionAuthenticatedMetadata: metadata.ConnectionAuthenticatedMetadata{
						AuthenticatedUsername:         req.Username,
						ConnectionAuthPendingMetadata: req.ConnectionAuthPendingMetadata,
					},
					Success: true,
				})
				if err != nil {
					ErrorHandler(r.Context(), w, 500, err.Error())
					return
				}
				w.Write(resp)
				w.Header().Set("Content-Type", "application/json")
			}
		}
		resp, err := json.Marshal(auth.ResponseBody{
			ConnectionAuthenticatedMetadata: metadata.ConnectionAuthenticatedMetadata{
				ConnectionAuthPendingMetadata: req.ConnectionAuthPendingMetadata,
			},
			Success: false,
		})
		if err != nil {
			ErrorHandler(r.Context(), w, 500, err.Error())
		}
		w.Write(resp)
		w.Header().Set("Content-Type", "application/json")
	})
	mux.HandleFunc("/auth/pubkey", func(w http.ResponseWriter, r *http.Request) {
		decoder := json.NewDecoder(r.Body)
		var req auth.PublicKeyAuthRequest
		err := decoder.Decode(&req)
		if err != nil {
			ErrorHandler(r.Context(), w, 500, err.Error())
			return
		}
		username, environment := SplitUsername(req.Username)
		slog.InfoContext(r.Context(), fmt.Sprintf("User %s is attempting login to %s with %s", username, environment, req.PublicKey.PublicKey))
		groups := runtime.config.GetUserGroups(username)
		slog.DebugContext(r.Context(), fmt.Sprintf("User %s is in groups %s", username, groups))
		// if user is in a group and some group matches the selected environment
		if len(groups) > 0 && runtime.config.IsUserAllowedInEnv(username, environment) {
			slog.DebugContext(r.Context(), fmt.Sprintf("Pulling keys for user %s", username))
			// pull github keys for user
			keysResp, err := http.Get(fmt.Sprintf("http://github.com/%s.keys", username))
			if err != nil {
				ErrorHandler(r.Context(), w, 500, err.Error())
				return
			}
			keysRespBytes, err := io.ReadAll(keysResp.Body)
			if err != nil {
				ErrorHandler(r.Context(), w, 500, err.Error())
				return
			}
			keys := string(keysRespBytes)
			// pubkey is listed in user's github keys
			slog.DebugContext(r.Context(), fmt.Sprintf("Got keys %s for user %s", keys, username))
			if strings.Contains(keys, req.PublicKey.PublicKey) {
				slog.DebugContext(r.Context(), fmt.Sprintf("User %s key matches", username))
				runtime.RegisterConnection(r.Context(), req.Username, req.ConnectionID)
				resp, err := json.Marshal(auth.ResponseBody{
					ConnectionAuthenticatedMetadata: metadata.ConnectionAuthenticatedMetadata{
						AuthenticatedUsername:         req.Username,
						ConnectionAuthPendingMetadata: req.ConnectionAuthPendingMetadata,
					},
					Success: true,
				})
				if err != nil {
					ErrorHandler(r.Context(), w, 500, err.Error())
					return
				}
				w.Write(resp)
				w.Header().Set("Content-Type", "application/json")
				return
			}
		}
		resp, err := json.Marshal(auth.ResponseBody{
			ConnectionAuthenticatedMetadata: metadata.ConnectionAuthenticatedMetadata{
				ConnectionAuthPendingMetadata: req.ConnectionAuthPendingMetadata,
			},
			Success: false,
		})
		if err != nil {
			ErrorHandler(r.Context(), w, 500, err.Error())
		}
		w.Write(resp)
		w.Header().Set("Content-Type", "application/json")
	})
	mux.HandleFunc("/config", func(w http.ResponseWriter, r *http.Request) {
		decoder := json.NewDecoder(r.Body)
		var req config.Request
		err := decoder.Decode(&req)
		if err != nil {
			ErrorHandler(r.Context(), w, 500, err.Error())
		}
		username, environmentName := SplitUsername(req.Username)
		escapedUsername := EscapeUsername(username)
		slog.InfoContext(r.Context(), fmt.Sprintf("Generating config for %s environment %s", username, environmentName))
		environment := runtime.config.Envrionments[environmentName]
		environment.Config.Docker.Execution.ContainerConfig.Env = []string{
			"USERNAME=" + escapedUsername,
			"ENVIRONMENT=" + environmentName,
			"JWT=" + runtime.jwt.User(escapedUsername),
		}
		// note this assumes the container user is "lab"
		if environment.Config.Docker.Execution.HostConfig == nil {
			environment.Config.Docker.Execution.HostConfig = &container.HostConfig{}
		}
		environment.Config.Docker.Execution.HostConfig.Binds = append(environment.Config.Docker.Execution.HostConfig.Binds,
			fmt.Sprintf("lab-%s-%s:/home/lab", environmentName, escapedUsername),
		)
		if environment.Webhooks.Initialization != "" {
			runtime.http.Get(environment.Webhooks.Initialization, username)
		}
		req.ConnectionMetadata.Files = ConvertValuesToBinaryValues(runtime.http.MapWebhooksToValues(environment.Webhooks.Files, username))
		req.ConnectionMetadata.Environment = runtime.http.MapWebhooksToValues(environment.Webhooks.Environment, username)
		// holy embedding batman 🤮
		appConfig := config.ResponseBody{
			Config: environment.Config,
			ConnectionAuthenticatedMetadata: metadata.ConnectionAuthenticatedMetadata{
				AuthenticatedUsername: req.Username,
				ConnectionAuthPendingMetadata: metadata.ConnectionAuthPendingMetadata{
					Username:           escapedUsername,
					ConnectionMetadata: req.ConnectionMetadata,
				},
			},
		}
		resp, err := json.Marshal(appConfig)
		if err != nil {
			ErrorHandler(r.Context(), w, 500, err.Error())
		}
		w.Write(resp)
		w.Header().Set("Content-Type", "application/json")
	})
	mux.HandleFunc("/cleanup", func(w http.ResponseWriter, r *http.Request) {
		decoder := json.NewDecoder(r.Body)
		req := struct {
			ConnectionId string `json:"connectionId"`
		}{}
		err := decoder.Decode(&req)
		if err != nil || req.ConnectionId == "" {
			ErrorHandler(r.Context(), w, 500, err.Error())
			return
		}
		username, err := runtime.redis.Get(r.Context(), "connectionId:"+req.ConnectionId).Result()
		if err != nil {
			slog.Error("Failed to retrieve connectionId " + req.ConnectionId)
		}
		slog.InfoContext(r.Context(), fmt.Sprintf("Removing connection %s for user %s", req.ConnectionId, username))
		err = runtime.redis.LRem(r.Context(), "user:"+username, 0, req.ConnectionId).Err()
		if err != nil {
			slog.Error("Failed to remove user->connectionId with error: " + err.Error())
		}
		runtime.redis.Del(r.Context(), "connectionId:"+req.ConnectionId).Err()
		if err != nil {
			slog.Error("Failed to remove connectionId->user with error: " + err.Error())
		}
		activeConnections, err := runtime.redis.LLen(r.Context(), "user:"+username).Result()
		if err != nil {
			slog.Error("Failed to list user connections with error: " + err.Error())
		}
		if activeConnections == 0 {
			slog.Debug(fmt.Sprintf("Cleanup initiated for connectionId %s user %s", req.ConnectionId, username))
			baseUsername, environmentName := SplitUsername(username)
			environment := runtime.config.Envrionments[environmentName]
			if environment.Webhooks.Cleanup != "" {
				slog.Info(fmt.Sprintf("Cleaning up %s environment %s", baseUsername, environmentName))
				runtime.http.Get(environment.Webhooks.Cleanup, baseUsername)
			}
		}
	})
	// setup and start the server
	port, ok := os.LookupEnv("PORT")
	if !ok {
		port = "7080"
	}
	slog.Info("Starting up server!")
	srv := http.Server{
		Handler:      mux,
		Addr:         "0.0.0.0:" + port,
		ErrorLog:     slog.NewLogLogger(slog.Default().Handler(), slog.LevelError),
		WriteTimeout: 30 * time.Second,
		ReadTimeout:  30 * time.Second,
	}
	c := make(chan os.Signal, 1)
	signal.Notify(c, syscall.SIGHUP, syscall.SIGQUIT, syscall.SIGTERM, syscall.SIGINT)
	go func() {
		for {
			s := <-c
			switch s {
			case syscall.SIGQUIT, syscall.SIGTERM, syscall.SIGINT:
				srv.Shutdown(context.Background())
				return
			case syscall.SIGHUP:
				runtime.ReloadConfig()
			case syscall.SIGSEGV:
			default:
				srv.Shutdown(context.Background())
				return
			}
		}
	}()
	srv.ListenAndServe()
}
