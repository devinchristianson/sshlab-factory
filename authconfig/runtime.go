package main

import (
	"bytes"
	"context"
	"fmt"
	"io"
	"log/slog"
	"net/http"
	"os"
	"path/filepath"
	"slices"
	"text/template"
	"time"

	"github.com/go-redis/redis/v8"
	"go.containerssh.io/libcontainerssh/config"
	"go.containerssh.io/libcontainerssh/metadata"
	"gopkg.in/yaml.v3"
)

type RunTime struct {
	configPath string
	config     Config
	redis      *redis.Client
	jwt        JWTGenerator
	http       HttpClient
	domain     string
}

func (runtime RunTime) ReloadConfig() {
	runtime.config.ReadConfig(runtime.configPath)
}

func Load() RunTime {
	runtime := RunTime{}
	slog.SetDefault(slog.New(slog.NewTextHandler(os.Stderr, &slog.HandlerOptions{Level: slog.LevelDebug})))
	// initial setup
	configPath, ok := os.LookupEnv("CONFIG_FILE")
	if !ok {
		configPath, _ = filepath.Abs("config.yml")
	}
	slog.Info(fmt.Sprintf("Using template path %s\n", configPath))
	runtime.configPath = configPath
	runtime.config.ReadConfig(runtime.configPath)
	jwtSecret, ok := os.LookupEnv("JWT_SECRET")
	if !ok {
		panic("JWT secret is required!")
	}

	runtime.domain, ok = os.LookupEnv("DOMAIN")
	if !ok {
		runtime.domain = "localhost"
	}

	runtime.jwt = JWTGenerator{
		key: jwtSecret,
	}

	redisPass, ok := os.LookupEnv("REDIS_PASS")
	if !ok {
		panic("JWT secret is required!")
	}

	runtime.redis = redis.NewClient(&redis.Options{
		Addr:     "redis:6379",
		Password: redisPass,
		DB:       0,
	})

	runtime.http = HttpClient{
		client:     http.Client{},
		tokenEpiry: time.Now().Add(time.Hour * 24 * 14),
		renewToken: func() string {
			return runtime.jwt.Server()
		},
		token: runtime.jwt.Server(),
	}

	return runtime
}

func (runtime *RunTime) RegisterConnection(ctx context.Context, Username string, ConnectionID string) {
	err := runtime.redis.Set(ctx, "connectionId:"+ConnectionID, Username, 0).Err()
	if err != nil {
		slog.ErrorContext(ctx, "Error setting connectionId->username in redis: "+err.Error())
	}
	err = runtime.redis.RPush(ctx, "user:"+Username, ConnectionID).Err()
	if err != nil {
		slog.ErrorContext(ctx, "Error adding username->connectionId in redis: "+err.Error())
	}
}

type Config struct {
	Groups       map[string]Group       `yaml:"groups"`
	Envrionments map[string]Environment `yaml:"environments"`
}

type Group struct {
	Members      []string         `yaml:"members"`
	Environments []string         `yaml:"environments"`
	Overrides    config.AppConfig `yaml:"overrides"`
}

type Environment struct {
	Config   config.AppConfig `yaml:"config"`
	Webhooks Webhooks         `yaml:"webhooks"`
}

type WebHook string

type Webhooks struct {
	Initialization WebHook            `yaml:"initialization"`
	Cleanup        WebHook            `yaml:"cleanup"`
	Files          map[string]WebHook `yaml:"files"`
	Environment    map[string]WebHook `yaml:"environment"`
}

func (c *Config) ReadConfig(path string) {
	yamlFile, err := os.ReadFile(path)
	if err != nil {
		slog.Error(fmt.Sprintf("Error reading yaml file: %s", err.Error()))
	}
	err = yaml.Unmarshal(yamlFile, c)

	if err != nil {
		slog.Error(fmt.Sprintf("Error unmarshalling config file: %s", err.Error()))
	}
}

func (c *Config) GetUserGroups(user string) []string {
	var groups []string
	for name, group := range c.Groups {
		if slices.Contains(group.Members, user) {
			groups = append(groups, name)
		}
	}
	return groups
}

func (c *Config) GetUserEnvironments(user string) []string {
	var environments []string
	for _, group := range c.Groups {
		if slices.Contains(group.Members, user) {
			environments = append(environments, group.Environments...)
		}
	}
	slices.Sort(environments)
	return slices.Compact(environments)
}

func (c *Config) IsUserAllowedInEnv(user string, environment string) bool {
	if slices.Contains(c.GetUserEnvironments(user), "*") {
		return true
	} else {
		return slices.Contains(c.GetUserEnvironments(user), environment)
	}
}

type HttpClient struct {
	client     http.Client
	token      string
	tokenEpiry time.Time
	renewToken func() string
}

type TemplateVariables struct {
	Username string
	Domain   string
}

func (client *HttpClient) Get(url WebHook, variables TemplateVariables) (*http.Response, error) {
	if time.Now().After(client.tokenEpiry) {
		client.token = client.renewToken()
	}
	var buf bytes.Buffer
	template.Must(template.New("key").Parse(string(url))).Execute(&buf, variables)
	templatedUrl := buf.String()
	initReq, err := http.NewRequest("GET", templatedUrl, nil)
	initReq.Header.Set("Authorization", "Bearer "+client.token)
	if err != nil {
		panic(err.Error())
	}
	return client.client.Do(initReq)
}

func (client *HttpClient) MapWebhooksToValues(input map[string]WebHook, variables TemplateVariables) map[string]metadata.Value {
	results := make(map[string]metadata.Value)
	for key, url := range input {
		resp, err := client.Get(url, variables)
		if err != nil {
			slog.Warn(fmt.Sprintf("Failed getting %s %s due to error %s", key, url, err.Error()))
			continue
		}
		contents, err := io.ReadAll(resp.Body)
		if err != nil {
			slog.Warn(fmt.Sprintf("Failed reading resp for %s %s due to error %s", key, url, err.Error()))
			continue
		}
		results[key] = metadata.Value{
			Value:     string(contents),
			Sensitive: true,
		}
	}
	return results
}

func MapVariables(input map[string]string, variables TemplateVariables) map[string]string {
	output := map[string]string{}
	for key, value := range input {
		var buf bytes.Buffer
		template.Must(template.New("key").Parse(key)).Execute(&buf, variables)
		templatedKey := buf.String()
		buf.Reset()
		template.Must(template.New("value").Parse(value)).Execute(&buf, variables)
		templatedValue := buf.String()
		output[templatedKey] = templatedValue
	}
	return output
}
